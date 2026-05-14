import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const groqAvailable = !!process.env.GROQ_API_KEY;
  const azureAvailable = !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
  return NextResponse.json({
    available: azureAvailable || groqAvailable,
    hasAssessment: azureAvailable,
  });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const audio = form.get('audio') as File | null;
  const referenceText = ((form.get('referenceText') as string | null) ?? '').trim();
  const lang = (form.get('lang') as string | null) ?? 'en-US';

  if (!audio || audio.size === 0) {
    return NextResponse.json({ error: 'no_audio' }, { status: 400 });
  }

  const azureKey = process.env.AZURE_SPEECH_KEY;
  const azureRegion = process.env.AZURE_SPEECH_REGION;

  if (azureKey && azureRegion && referenceText) {
    try {
      const assessConfig = {
        ReferenceText: referenceText,
        GradingSystem: 'HundredMark',
        Granularity: 'Word',
        EnableMiscue: true,
      };
      const configBase64 = Buffer.from(JSON.stringify(assessConfig)).toString('base64');
      const audioBuffer = Buffer.from(await audio.arrayBuffer());
      const mimeType = audio.type || 'audio/webm';

      const url = `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${lang}&format=detailed`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': mimeType,
          'Pronunciation-Assessment': configBase64,
          'Accept': 'application/json',
        },
        body: audioBuffer,
      });

      if (res.ok) {
        const data = await res.json();
        const nbest = data.NBest?.[0];
        const assessment = nbest?.PronunciationAssessment;
        const text = (data.DisplayText ?? nbest?.Display ?? '').replace(/[.,!?]+$/, '').trim();
        return NextResponse.json({
          text,
          score: assessment?.PronScore != null ? Math.round(assessment.PronScore) : null,
          accuracyScore: assessment?.AccuracyScore != null ? Math.round(assessment.AccuracyScore) : null,
        });
      }
      console.error('Azure Speech error:', res.status, await res.text());
    } catch (e) {
      console.error('Azure assessment failed:', e);
    }
  }

  // Fallback to Groq
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  try {
    const groqForm = new FormData();
    groqForm.append('file', audio, 'recording.webm');
    groqForm.append('model', 'whisper-large-v3-turbo');
    groqForm.append('language', lang.split('-')[0]);
    groqForm.append('response_format', 'json');
    groqForm.append('temperature', '0');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: groqForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Groq API error:', res.status, errText);
      return NextResponse.json({ error: 'groq_error' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ text: (data.text ?? '').trim(), score: null });
  } catch (e) {
    console.error('Assessment route error:', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
