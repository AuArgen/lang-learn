import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const available = !!process.env.GROQ_API_KEY;
  return NextResponse.json({ available });
}

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  try {
    const form = await req.formData();
    const audio = form.get('audio') as File | null;
    const lang = ((form.get('lang') as string | null) ?? 'en').split('-')[0];

    if (!audio || audio.size === 0) {
      return NextResponse.json({ error: 'no_audio' }, { status: 400 });
    }

    const groqForm = new FormData();
    groqForm.append('file', audio, 'recording.webm');
    groqForm.append('model', 'whisper-large-v3-turbo');
    groqForm.append('language', lang);
    groqForm.append('response_format', 'json');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: groqForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Groq API error:', res.status, errText);
      return NextResponse.json({ error: 'groq_error' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ text: (data.text ?? '').trim() });
  } catch (e) {
    console.error('Transcription route error:', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
