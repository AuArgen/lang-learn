'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createGameSessionAction, saveGameResultAction } from '@/app/actions/game-actions';
import { useTranslations } from 'next-intl';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface PlayContainerProps {
  theme: any;
  words: any[];
  themeId: string;
  isLocal?: boolean;
  onBackToSetup?: () => void;
}

const getSpeechLangCode = (code: string) => {
  const map: Record<string, string> = {
    'en': 'en-US', 'ru': 'ru-RU', 'tr': 'tr-TR', 'zh': 'zh-CN',
    'ar': 'ar-SA', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
    'ko': 'ko-KR', 'ja': 'ja-JP', 'ky': 'ky-KG'
  };
  return map[code] || 'en-US';
};

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function isSpeechMatch(transcript: string, word: string): boolean {
  if (!transcript || !word) return false;
  if (transcript.includes(word) || word.includes(transcript)) return true;
  const maxDist = Math.max(1, Math.floor(word.length * 0.25));
  return levenshtein(transcript, word) <= maxDist;
}

const getLangSpeakLabel = (code: string) => {
  const map: Record<string, string> = {
    'en': 'Англисче айтыңыз!', 'ru': 'Орусча айтыңыз!', 'tr': 'Түркчө айтыңыз!',
    'zh': 'Кытайча айтыңыз!', 'ar': 'Арабча айтыңыз!', 'es': 'Испанча айтыңыз!',
    'fr': 'Французча айтыңыз!', 'de': 'Немисче айтыңыз!', 'ko': 'Корейче айтыңыз!',
    'ja': 'Жапончо айтыңыз!', 'ky': 'Кыргызча айтыңыз!'
  };
  return map[code] || 'Англисче айтыңыз!';
};

export default function PlayContainer({ theme, words, themeId, isLocal, onBackToSetup }: PlayContainerProps) {
  const router = useRouter();
  const t = useTranslations('PlayGame');
  const themeLangCode = theme?.language || 'en';
  const [stage, setStage] = useState<'lobby' | 'countdown' | 'playing' | 'finished'>('lobby');
  const [mode, setMode] = useState<'solo' | 'team'>('solo');
  const [playerName, setPlayerName] = useState('');
  const [team1Name, setTeam1Name] = useState(t('team1Default'));
  const [team2Name, setTeam2Name] = useState(t('team2Default'));
  const [gameId, setGameId] = useState<string | null>(null);

  // Shared Logic state
  const [countdownValue, setCountdownValue] = useState(3);
  const [gameWords, setGameWords] = useState<any[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isListening, setIsListening] = useState(false);
  const [isAutoListen, setIsAutoListen] = useState(false); 
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [manualInputText, setManualInputText] = useState('');
  const [wordMistakes, setWordMistakes] = useState(0);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [currentWordInputs, setCurrentWordInputs] = useState<string[]>([]);
  const [selectedTimeSec, setSelectedTimeSec] = useState(60);
  const [hasSpeech, setHasSpeech] = useState(true);
  const [useGroq, setUseGroq] = useState(false);
  const [streak, setStreak] = useState(0);
  const MAX_HEARTS = 5;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Score/Mistakes State
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // Team mode specific state
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [team1Mistakes, setTeam1Mistakes] = useState(0);
  const [team2Mistakes, setTeam2Mistakes] = useState(0);
  const [turnState, setTurnState] = useState<'buzz' | 'answering' | 'next_countdown'>('buzz');
  const [answeringTeam, setAnsweringTeam] = useState<'team1' | 'team2' | null>(null);
  const [nextWordCountdown, setNextWordCountdown] = useState(0);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (useGroq) return;
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = getSpeechLangCode(themeLangCode);
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.maxAlternatives = 5;

        recognitionRef.current.onresult = (event: any) => {
          const alternatives: string[] = Array.from(event.results[0])
            .map((r: any) => r.transcript.toLowerCase().trim());
          const currentWord = gameWords[currentWordIndex]?.word || '';
          const normWord = normalizeText(currentWord);
          const best = alternatives.find(alt => isSpeechMatch(normalizeText(alt), normWord));
          handleSpeechResult(best ?? alternatives[0]);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        setHasSpeech(false);
      }
    }
  }, [useGroq, currentWordIndex, themeLangCode, stage, gameWords, turnState, answeringTeam, t]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      setHasSpeech(!!SR);
    }
    fetch('/api/transcribe')
      .then(r => r.json())
      .then(d => {
        if (d.available) {
          setUseGroq(true);
          setHasSpeech(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (useGroq) return;
    let tTimer: any;
    const currentWordInfo = gameWords[currentWordIndex];
    const canListen = mode === 'solo' || (mode === 'team' && turnState === 'answering');

    const isSuccess = feedbackMsg.includes(t('correctFeedback').replace(' 🎉', ''));

    if (stage === 'playing' && currentWordInfo && !currentWordInfo.is_manual_input && isAutoListen && !isListening && !isSuccess && canListen) {
      tTimer = setTimeout(() => {
        if (!isListening && stage === 'playing') {
          startListening();
        }
      }, 800);
    }
    return () => clearTimeout(tTimer);
  }, [useGroq, isListening, isAutoListen, stage, feedbackMsg, gameWords, currentWordIndex, mode, turnState, t]);

  useEffect(() => {
    let timer: any;
    if (stage === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (stage === 'playing' && timeLeft === 0) {
      endGame(gameHistory);
    }
    return () => clearInterval(timer);
  }, [stage, timeLeft, gameHistory]);

  useEffect(() => {
    let timer: any;
    if (stage === 'countdown' && countdownValue > 0) {
      timer = setTimeout(() => {
        setCountdownValue(prev => prev - 1);
      }, 1000);
    } else if (stage === 'countdown' && countdownValue === 0) {
      setStage('playing');
    }
    return () => clearTimeout(timer);
  }, [stage, countdownValue]);

  // Team Mode Next Word Countdown
  useEffect(() => {
    let timer: any;
    if (stage === 'playing' && mode === 'team' && turnState === 'next_countdown') {
      if (nextWordCountdown > 0) {
        timer = setTimeout(() => {
          setNextWordCountdown(prev => prev - 1);
        }, 1000);
      } else {
        setFeedbackMsg('');
        setManualInputText('');
        setTurnState('buzz');
        setAnsweringTeam(null);
        setWordMistakes(0);
        setCurrentWordInputs([]);

        if (currentWordIndex + 1 < gameWords.length) {
          setCurrentWordIndex(prev => prev + 1);
        } else {
           endGame(gameHistory);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [stage, mode, turnState, nextWordCountdown, currentWordIndex, gameWords.length, gameHistory]);

  useEffect(() => {
    if (stage === 'playing' && mode === 'solo' && mistakes >= MAX_HEARTS) {
      endGame(gameHistory);
    }
  }, [mistakes, stage, mode, gameHistory]);

  const startGame = async () => {
    if (mode === 'solo' && !playerName) return alert(t('enterNameAlert'));
    let gId: string | null = null;
    if (!isLocal) {
      gId = await createGameSessionAction(themeId, mode, true);
    }
    setGameId(gId);
    
    // Shuffle words randomly
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setGameWords(shuffled);

    setStage('countdown');
    setCountdownValue(3);
    setTimeLeft(selectedTimeSec);
    setScore(0);
    setMistakes(0);
    setTeam1Score(0);
    setTeam2Score(0);
    setTeam1Mistakes(0);
    setTeam2Mistakes(0);
    setTurnState('buzz');
    setAnsweringTeam(null);
    setWordMistakes(0);
    setCurrentWordIndex(0);
    setIsAutoListen(false);
    setManualInputText('');
    setGameHistory([]);
    setCurrentWordInputs([]);
    setStreak(0);
  };

  const handleBuzz = (team: 'team1' | 'team2') => {
    if (turnState !== 'buzz') return;
    setAnsweringTeam(team);
    setTurnState('answering');
    
    const currentWordInfo = gameWords[currentWordIndex];
    if (!currentWordInfo?.is_manual_input) {
      setIsAutoListen(true);
      startListening();
    }
  };

  const stopGroqRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const startGroqListening = async () => {
    if (isListening) return;
    const currentWordInfo = gameWords[currentWordIndex];
    if (currentWordInfo?.is_manual_input) return;

    try {
      setFeedbackMsg('');
      setIsListening(true);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find(
        m => MediaRecorder.isTypeSupported(m)
      ) || '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        if (blob.size < 1000) { setIsListening(false); return; }

        const form = new FormData();
        form.append('audio', blob, 'recording.webm');
        form.append('lang', getSpeechLangCode(themeLangCode));

        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: form });
          const data = await res.json();
          if (data.text) handleSpeechResult(data.text.toLowerCase().trim());
        } catch (e) {
          console.error('Groq transcription failed:', e);
        } finally {
          setIsListening(false);
        }
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 6000);
    } catch (e) {
      console.error('Microphone access error:', e);
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (useGroq) {
      if (isListening) stopGroqRecording();
      else startGroqListening();
      return;
    }
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsAutoListen(false);
    } else {
      setIsAutoListen(true);
      startListening();
    }
  };

  const startListening = () => {
    if (useGroq) { startGroqListening(); return; }
    const currentWordInfo = gameWords[currentWordIndex];
    if (currentWordInfo?.is_manual_input) return;
    if (recognitionRef.current && !isListening) {
      setFeedbackMsg('');
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        // already started
      }
    }
  };

  const playSound = (type: 'correct' | 'error') => {
    try {
      const audio = new Audio(`/song/${type}.mp3`);
      audio.volume = 0.5;
      audio.play().catch(e => console.error('Audio play error:', e));
    } catch (err) {
      console.error(err);
    }
  };

  const normalizeText = (text: string) => {
    let s = text.toLowerCase();
    s = s.replace(/what's/gi, 'what is').replace(/it's/gi, 'it is').replace(/he's/gi, 'he is').replace(/she's/gi, 'she is')
         .replace(/that's/gi, 'that is').replace(/who's/gi, 'who is').replace(/where's/gi, 'where is').replace(/how's/gi, 'how is')
         .replace(/there's/gi, 'there is').replace(/let's/gi, 'let us').replace(/i'm/gi, 'i am').replace(/you're/gi, 'you are')
         .replace(/we're/gi, 'we are').replace(/they're/gi, 'they are').replace(/i've/gi, 'i have').replace(/you've/gi, 'you have')
         .replace(/we've/gi, 'we have').replace(/they've/gi, 'they have').replace(/i'll/gi, 'i will').replace(/you'll/gi, 'you will')
         .replace(/he'll/gi, 'he will').replace(/she'll/gi, 'she will').replace(/we'll/gi, 'we will').replace(/they'll/gi, 'they will')
         .replace(/isn't/gi, 'is not').replace(/aren't/gi, 'are not').replace(/wasn't/gi, 'was not').replace(/weren't/gi, 'were not')
         .replace(/haven't/gi, 'have not').replace(/hasn't/gi, 'has not').replace(/hadn't/gi, 'had not').replace(/won't/gi, 'will not')
         .replace(/wouldn't/gi, 'would not').replace(/don't/gi, 'do not').replace(/doesn't/gi, 'does not').replace(/didn't/gi, 'did not')
         .replace(/can't/gi, 'cannot').replace(/couldn't/gi, 'could not').replace(/shouldn't/gi, 'should not').replace(/mightn't/gi, 'might not')
         .replace(/mustn't/gi, 'must not');
    return s.replace(/[^a-zа-яёүөң0-9]/gi, '');
  };

  const triggerNextWord = (isCorrect: boolean) => {
    let newHistory = gameHistory;
    const currentWord = gameWords[currentWordIndex];
    if (currentWord) {
      newHistory = [...gameHistory, {
        word: currentWord.word,
        translation: currentWord.translation,
        isCorrect,
        mistakes_made: wordMistakes,
        inputs: currentWordInputs,
        answeredBy: answeringTeam
      }];
      setGameHistory(newHistory);
    }
    
    if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        setIsAutoListen(false);
    }

    if (mode === 'solo') {
      setFeedbackMsg('');
      setManualInputText('');
      setWordMistakes(0);
      setCurrentWordInputs([]);
      if (currentWordIndex + 1 < gameWords.length) {
        setCurrentWordIndex(prev => prev + 1);
      } else {
        endGame(newHistory);
      }
    } else {
      setTurnState('next_countdown');
      setNextWordCountdown(3);
    }
  };

  const handleSpeechResult = (transcript: string) => {
    if (stage !== 'playing' || !gameWords[currentWordIndex]) return;
    if (mode === 'team' && turnState !== 'answering') return;
    
    setCurrentWordInputs(prev => [...prev, transcript]);
    
    const currentWord = gameWords[currentWordIndex].word;
    
    const normTranscript = normalizeText(transcript);
    const normWord = normalizeText(currentWord);

    if (isSpeechMatch(normTranscript, normWord)) {
      playSound('correct');
      setStreak(s => s + 1);
      setFeedbackMsg(t('correctFeedback'));
      if (mode === 'team') {
        if (answeringTeam === 'team1') setTeam1Score(s => s + 10);
        else if (answeringTeam === 'team2') setTeam2Score(s => s + 10);
      } else {
        setScore(s => s + 10);
      }
      setTimeout(() => triggerNextWord(true), 1000);
    } else {
      playSound('error');
      setStreak(0);

      const willSkip = wordMistakes + 1 >= 3;
      const msg = willSkip
        ? t('errorSkipMaxMistakes') + ' ' + t('correctAnswerWas', { word: currentWord })
        : t('errorSpoken', { transcript });

      setFeedbackMsg(msg);
      if (mode === 'team') {
        if (answeringTeam === 'team1') setTeam1Mistakes(m => m + 1);
        else if (answeringTeam === 'team2') setTeam2Mistakes(m => m + 1);
      } else {
        setMistakes(m => m + 1);
      }
      
      if (willSkip) {
        setTimeout(() => triggerNextWord(false), 1500);
      } else {
        setWordMistakes(wm => wm + 1);
      }
    }
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (stage !== 'playing' || !gameWords[currentWordIndex]) return;
    if (mode === 'team' && turnState !== 'answering') return;

    const transcript = manualInputText.trim();
    if (!transcript) return;
    
    setCurrentWordInputs(prev => [...prev, transcript]);

    const currentWord = gameWords[currentWordIndex].word;

    const normTranscript = normalizeText(transcript);
    const normWord = normalizeText(currentWord);

    if (normTranscript === normWord || normTranscript.includes(normWord)) {
      playSound('correct');
      setStreak(s => s + 1);
      setFeedbackMsg(t('correctFeedback'));
      if (mode === 'team') {
        if (answeringTeam === 'team1') setTeam1Score(s => s + 10);
        else if (answeringTeam === 'team2') setTeam2Score(s => s + 10);
      } else {
        setScore(s => s + 10);
      }
      setTimeout(() => triggerNextWord(true), 1000);
    } else {
      playSound('error');
      setStreak(0);

      const willSkip = wordMistakes + 1 >= 3;
      const msg = willSkip
        ? t('errorWrittenSkip') + ' ' + t('correctAnswerWas', { word: currentWord })
        : t('errorWritten', { transcript });

      setFeedbackMsg(msg);
      if (mode === 'team') {
        if (answeringTeam === 'team1') setTeam1Mistakes(m => m + 1);
        else if (answeringTeam === 'team2') setTeam2Mistakes(m => m + 1);
      } else {
        setMistakes(m => m + 1);
      }
      setManualInputText('');

      if (willSkip) {
        setTimeout(() => triggerNextWord(false), 1500);
      } else {
        setWordMistakes(wm => wm + 1);
      }
    }
  };

  const skipWord = () => {
    playSound('error');
    if (mode === 'team') {
      if (answeringTeam === 'team1') setTeam1Mistakes(m => m + 1);
      else if (answeringTeam === 'team2') setTeam2Mistakes(m => m + 1);
    } else {
      setMistakes(m => m + 1);
    }
    triggerNextWord(false);
  };

  const speakWord = () => {
    if (!('speechSynthesis' in window)) {
      return alert(t('ttsNotSupported'));
    }
    const currentWord = gameWords[currentWordIndex].word;
    const utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.lang = getSpeechLangCode(themeLangCode);
    window.speechSynthesis.speak(utterance);
  };

  const endGame = async (finalHistory: any[] = gameHistory) => {
    setStage('finished');
    const timeTakenSec = selectedTimeSec - timeLeft;
    if (gameId && !isLocal) {
      let finalPlayerName = playerName;
      let finalScore = score;
      let finalMistakes = mistakes;

      if (mode === 'team') {
        finalPlayerName = `${team1Name} (Упай: ${team1Score}) vs ${team2Name} (Упай: ${team2Score})`;
        finalScore = Math.max(team1Score, team2Score); 
        finalMistakes = team1Mistakes + team2Mistakes;
      }

      await saveGameResultAction(
        gameId, 
        themeId, 
        finalPlayerName, 
        finalScore, 
        finalMistakes,
        timeTakenSec,
        finalHistory
      );
    }
  };

  if (stage === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-white/50 backdrop-blur-sm">
          {/* Back button */}
          <button
            onClick={() => onBackToSetup ? onBackToSetup() : router.push('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('back')}
          </button>

          {!hasSpeech && (
            <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <span className="text-lg leading-none">⚠️</span>
              <span>{t('noBrowserWarning')}</span>
            </div>
          )}

          <h1 className="text-3xl font-extrabold text-center text-slate-800 mb-2">{theme.title}</h1>
          <p className="text-center text-slate-500 mb-8">{theme.description}</p>

          <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setMode('solo')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'solo' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>{t('modeSolo')}</button>
              <button onClick={() => setMode('team')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'team' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>{t('modeTeam')}</button>
            </div>

            {mode === 'solo' ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('enterNameLabel')}</label>
                <input value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full px-5 py-3 text-slate-900 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-indigo-400 focus:ring-0 outline-none transition font-medium" placeholder={t('namePlaceholder')} />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('team1Default')}</label>
                  <input value={team1Name} onChange={e => setTeam1Name(e.target.value)} className="w-full px-5 py-3 text-slate-900 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-indigo-400 outline-none transition font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('team2Default')}</label>
                  <input value={team2Name} onChange={e => setTeam2Name(e.target.value)} className="w-full px-5 py-3 text-slate-900 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-indigo-400 outline-none transition font-medium" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('gameTimeLabel')}</label>
              <select 
                value={selectedTimeSec} 
                onChange={(e) => setSelectedTimeSec(Number(e.target.value))}
                className="w-full px-5 py-3 text-slate-900 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-indigo-400 focus:ring-0 outline-none transition font-medium appearance-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(m => (
                  <option key={m} value={m * 60}>{t('minutes', { m })}</option>
                ))}
              </select>
            </div>

            <button onClick={startGame} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 text-lg">
              {t('startBtn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'countdown') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col space-y-8">
         <p className="text-slate-400 text-3xl font-bold animate-pulse">{t('gameStarting')}</p>
         <div key={countdownValue} className="text-[12rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-400 animate-bounce">
           {countdownValue > 0 ? countdownValue : t('go')}
         </div>
      </div>
    );
  }

  if (stage === 'playing') {
    const currentWordInfo = gameWords[currentWordIndex];
    const isTimerRed = timeLeft <= 10;

    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 md:p-10 font-sans relative overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-700 z-20">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${gameWords.length > 0 ? (currentWordIndex / gameWords.length) * 100 : 0}%` }}
          />
        </div>

        {mode === 'team' && turnState === 'next_countdown' && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center flex-col">
            <h2 className="text-4xl text-slate-300 font-bold mb-8">{t('prepareNextWord')}</h2>
            <div key={nextWordCountdown} className="text-[15rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-400 animate-bounce">
               {nextWordCountdown}
            </div>
          </div>
        )}

        {/* Header: Score & Timer */}
        <div className="flex justify-between items-center bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl mx-auto w-full max-w-5xl z-10">
          {mode === 'solo' ? (
            <>
              <div className="flex flex-col items-start gap-0.5">
                <div className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">{t('score', { score })}</div>
                {streak >= 2 && <div className="text-xs font-bold text-yellow-400">{t('streakLabel', { n: streak })}</div>}
              </div>
              <div className={`text-2xl font-black ${isTimerRed ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="flex gap-0.5 text-lg">
                {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                  <span key={i} className={i < MAX_HEARTS - mistakes ? 'text-red-500' : 'text-slate-600 opacity-40'}>❤</span>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-blue-400 flex flex-col items-start leading-tight">
                <span>{team1Name}</span>
                <span className="text-2xl text-blue-300">{t('score', { score: team1Score })}</span>
              </div>
              <div className={`text-3xl font-black ${isTimerRed ? 'text-red-500 animate-pulse' : 'text-white'} mx-4`}>
                {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-lg font-bold text-pink-400 flex flex-col items-end leading-tight">
                <span>{team2Name}</span>
                <span className="text-2xl text-pink-300">{t('score', { score: team2Score })}</span>
              </div>
            </>
          )}
        </div>

        {/* Word Display as Stacked Cards */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 mb-4 z-10 mt-8">
          <div className="bg-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest border border-indigo-500/30 mb-4 z-20">
            {t('wordCount', { current: currentWordIndex + 1, total: gameWords.length })}
          </div>
          
          <div className="relative w-full max-w-2xl mx-auto h-64 md:h-80 flex items-center justify-center -mt-4">
            {/* Background layers simulating cards stack */}
            {Array.from({ length: Math.min(3, gameWords.length - currentWordIndex - 1) }).map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-full bg-slate-800/80 rounded-[2rem] border border-slate-700 shadow-2xl transition-all duration-300 pointer-events-none"
                style={{
                  transform: `translateY(${(i + 1) * -8}px) scale(${1 - (i + 1) * 0.03})`,
                  zIndex: 0 - i
                }}
              />
            ))}

            {/* Current Top Card */}
            <div className={`absolute w-full h-full rounded-[2rem] border-2 shadow-2xl flex flex-col items-center justify-center p-6 z-10 transition-transform duration-300 ${mode === 'team' && turnState === 'answering' ? (answeringTeam === 'team1' ? 'bg-blue-900 border-blue-500 shadow-blue-500/20 scale-105' : 'bg-pink-900 border-pink-500 shadow-pink-500/20 scale-105') : 'bg-slate-800 border-indigo-500 shadow-indigo-500/10'}`}>
              <p className="text-xl md:text-2xl text-slate-400 font-medium mb-2">{t('kgTranslation')}</p>
              <h2 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6 px-4">
                {currentWordInfo.translation}
              </h2>
              
              <div className="h-10 mt-2">
                {mode === 'team' && turnState === 'buzz' ? (
                  <p className="text-lg md:text-xl text-yellow-400 animate-pulse font-bold">{t('whoPressesFirst')}</p>
                ) : currentWordInfo.is_manual_input ? (
                  <p className="text-lg md:text-xl text-slate-300">{t('answerWithText')}</p>
                ) : isListening ? (
                  <div className="flex items-center space-x-3 text-indigo-400">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                    </span>
                    <span className="text-lg md:text-xl font-semibold">{mode === 'team' ? t('teamListening', { team: answeringTeam === 'team1' ? team1Name : team2Name }) : t('listeningMode')}</span>
                  </div>
                ) : (
                  <p className="text-lg md:text-xl text-slate-300">{
                    themeLangCode === 'en' ? t('speakEn') :
                    themeLangCode === 'ru' ? t('speakRu') :
                    themeLangCode === 'tr' ? t('speakTr') :
                    themeLangCode === 'zh' ? t('speakZh') :
                    themeLangCode === 'ar' ? t('speakAr') :
                    themeLangCode === 'es' ? t('speakEs') :
                    themeLangCode === 'fr' ? t('speakFr') :
                    themeLangCode === 'de' ? t('speakDe') :
                    themeLangCode === 'ko' ? t('speakKo') :
                    themeLangCode === 'ja' ? t('speakJa') :
                    themeLangCode === 'ky' ? t('speakKy') :
                    t('speakEn')
                  }</p>
                )}
              </div>
            </div>
          </div>

          {(currentWordInfo.is_manual_input || !hasSpeech) && (mode === 'solo' || turnState === 'answering') && (
             <form onSubmit={handleManualSubmit} className="mt-8 w-full max-w-md flex flex-row items-center gap-2">
               <input
                 type="text"
                 value={manualInputText}
                 onChange={e => setManualInputText(e.target.value)}
                 placeholder={mode === 'team'
                   ? t('writePlaceholderTeam', { team: answeringTeam === 'team1' ? team1Name : team2Name })
                   : t('typeAnswerPlaceholder')}
                 className="flex-1 px-4 py-3 bg-white/10 text-white placeholder-slate-400 border border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none backdrop-blur-md font-medium text-lg"
                 autoFocus
               />
               <button
                 type="submit"
                 className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95 text-lg"
               >
                 {t('checkBtn')}
               </button>
             </form>
          )}

          {/* Feedback Msg */}
          <div className="min-h-[4rem] mt-4 w-full flex items-center justify-center px-4">
            {feedbackMsg && (
              <div className={`px-5 py-3 rounded-2xl font-bold text-base animate-in zoom-in text-center max-w-sm ${feedbackMsg.includes(t('correctFeedback').replace(' 🎉', '')) ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                {feedbackMsg}
              </div>
            )}
          </div>
          
          {/* Buzzer Buttons for Team Mode */}
          {mode === 'team' && turnState === 'buzz' && (
            <div className="flex w-full items-center justify-between gap-4 px-2 md:px-12 mt-8 absolute inset-x-0 bottom-10 md:bottom-20 z-30">
              <button 
                onClick={() => handleBuzz('team1')}
                className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 border-8 border-blue-900 shadow-[0_0_50px_rgba(59,130,246,0.5)] flex flex-col items-center justify-center active:scale-90 transition-all hover:scale-105"
              >
                <div className="text-white font-black text-2xl md:text-3xl text-center leading-tight mb-2 drop-shadow-md px-2 break-all">{team1Name}</div>
                <div className="text-blue-200 font-bold uppercase text-xs md:text-sm tracking-wider bg-blue-900/50 px-3 py-1 rounded-full">{t('answerBtn')}</div>
              </button>
              
              <button 
                onClick={() => handleBuzz('team2')}
                className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-pink-500 to-rose-700 hover:from-pink-400 hover:to-rose-600 border-8 border-pink-900 shadow-[0_0_50px_rgba(236,72,153,0.5)] flex flex-col items-center justify-center active:scale-90 transition-all hover:scale-105"
              >
                <div className="text-white font-black text-2xl md:text-3xl text-center leading-tight mb-2 drop-shadow-md px-2 break-all">{team2Name}</div>
                <div className="text-pink-200 font-bold uppercase text-xs md:text-sm tracking-wider bg-pink-900/50 px-3 py-1 rounded-full">{t('answerBtn')}</div>
              </button>
            </div>
          )}
        </div>

        {/* Actions for Solo or when Answering in Team */}
        {(mode === 'solo' || (mode === 'team' && turnState === 'answering')) && (
          <div className="flex justify-center items-center space-x-4 md:space-x-8 pb-8 z-20">
            <button onClick={speakWord} title={t('howToPronounce')} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 flex items-center justify-center transition-all shadow-lg hover:scale-105 text-indigo-400 hover:text-indigo-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>

            {!currentWordInfo.is_manual_input && hasSpeech && (
              <button
                onClick={toggleListening}
                title={isAutoListen ? t('stopListeningTitle') : t('startListeningTitle')}
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all ${
                  isListening || isAutoListen ? 'bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite] scale-110 shadow-red-500/50' : (mode === 'team' ? (answeringTeam === 'team2' ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/50' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/50') : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 shadow-indigo-600/50')
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-white/80 text-xs font-medium uppercase tracking-widest">
                  {isListening && useGroq ? '⏺ REC' : isAutoListen ? t('stopBtn') : t('speakBtn')}
                </span>
              </button>
            )}

            <button onClick={skipWord} title={t('skipBtn')} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 flex items-center justify-center transition-all shadow-lg hover:scale-105 text-slate-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  // finished
  let finalWinText = t('gameFinished');
  let finalWinColor = "text-yellow-400";
  if (mode === 'team') {
    if (team1Score > team2Score) {
      finalWinText = t('winner', { name: team1Name });
      finalWinColor = "text-blue-400";
    } else if (team2Score > team1Score) {
      finalWinText = t('winner', { name: team2Name });
      finalWinColor = "text-pink-400";
    } else {
      finalWinText = t('draw');
      finalWinColor = "text-emerald-400";
    }
  }

  const correctCount = mode === 'solo' ? score / 10 : Math.floor(Math.max(team1Score, team2Score) / 10);
  const accuracy = gameHistory.length > 0 ? Math.round((gameHistory.filter(h => h.isCorrect).length / gameHistory.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-900 p-4 flex flex-col items-center justify-start pt-10">
      <div className="max-w-2xl w-full space-y-5">
        {/* Header */}
        <div className="text-center">
          <h2 className={`text-4xl md:text-5xl font-extrabold mb-2 ${finalWinColor}`}>{finalWinText}</h2>
        </div>

        {/* Stats row */}
        {mode === 'solo' ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
              <p className="text-green-400 text-3xl font-black">{correctCount}</p>
              <p className="text-slate-400 text-xs mt-1 font-medium">{t('correctWords')}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
              <p className="text-indigo-400 text-3xl font-black">{accuracy}%</p>
              <p className="text-slate-400 text-xs mt-1 font-medium">Тактык</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
              <p className="text-yellow-400 text-3xl font-black">{score}</p>
              <p className="text-slate-400 text-xs mt-1 font-medium">{t('totalScore')}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-900/40 border border-blue-500/30 rounded-2xl p-5 text-center">
              <p className="text-blue-300 font-bold truncate mb-2">{team1Name}</p>
              <p className="text-4xl font-black text-white">{team1Score}</p>
              <p className="text-slate-400 text-xs mt-1">Ката: {team1Mistakes}</p>
            </div>
            <div className="bg-pink-900/40 border border-pink-500/30 rounded-2xl p-5 text-center">
              <p className="text-pink-300 font-bold truncate mb-2">{team2Name}</p>
              <p className="text-4xl font-black text-white">{team2Score}</p>
              <p className="text-slate-400 text-xs mt-1">Ката: {team2Mistakes}</p>
            </div>
          </div>
        )}

        {/* Word review list */}
        {gameHistory.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700 font-bold text-slate-300 text-sm">
              Сөздөрдүн жыйынтыгы
            </div>
            <ul className="divide-y divide-slate-700/60 max-h-72 overflow-y-auto">
              {gameHistory.map((item, i) => (
                <li key={i} className="flex items-center justify-between px-5 py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-lg flex-shrink-0 ${item.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {item.isCorrect ? '✓' : '✗'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate">{item.word}</p>
                      <p className="text-slate-400 text-xs truncate">{item.translation}</p>
                    </div>
                  </div>
                  {item.mistakes_made > 0 && (
                    <span className="text-xs text-red-400 flex-shrink-0">Ката: {item.mistakes_made}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pb-10">
          <button onClick={startGame} className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black rounded-xl transition shadow-lg text-lg">
            {t('playAgainBtn')}
          </button>
          <button onClick={() => window.location.href = '/'} className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl transition text-lg">
            {t('toHomeBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
