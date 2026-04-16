'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createGameSessionAction, saveGameResultAction } from '@/app/actions/game-actions';

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
}

const getSpeechLangCode = (code: string) => {
  const map: Record<string, string> = {
    'en': 'en-US', 'ru': 'ru-RU', 'tr': 'tr-TR', 'zh': 'zh-CN',
    'ar': 'ar-SA', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
    'ko': 'ko-KR', 'ja': 'ja-JP', 'ky': 'ky-KG'
  };
  return map[code] || 'en-US';
};

const getLangSpeakLabel = (code: string) => {
  const map: Record<string, string> = {
    'en': 'Англисче айтыңыз!', 'ru': 'Орусча айтыңыз!', 'tr': 'Түркчө айтыңыз!',
    'zh': 'Кытайча айтыңыз!', 'ar': 'Арабча айтыңыз!', 'es': 'Испанча айтыңыз!',
    'fr': 'Французча айтыңыз!', 'de': 'Немисче айтыңыз!', 'ko': 'Корейче айтыңыз!',
    'ja': 'Жапончо айтыңыз!', 'ky': 'Кыргызча айтыңыз!'
  };
  return map[code] || 'Англисче айтыңыз!';
};

export default function PlayContainer({ theme, words, themeId }: PlayContainerProps) {
  const router = useRouter();
  const themeLangCode = theme?.language || 'en';
  const [stage, setStage] = useState<'lobby' | 'countdown' | 'playing' | 'finished'>('lobby');
  const [mode, setMode] = useState<'solo' | 'team'>('solo');
  const [playerName, setPlayerName] = useState('');
  const [team1Name, setTeam1Name] = useState('Команда 1');
  const [team2Name, setTeam2Name] = useState('Команда 2');
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
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = getSpeechLangCode(themeLangCode);
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript.toLowerCase().trim();
          handleSpeechResult(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        alert("Сиздин браузериңиз үн таанууну (Speech API) колдобойт. Google Chrome сунушталат.");
      }
    }
  }, [currentWordIndex, themeLangCode, stage, gameWords, turnState, answeringTeam]);

  useEffect(() => {
    let t: any;
    const currentWordInfo = gameWords[currentWordIndex];
    const canListen = mode === 'solo' || (mode === 'team' && turnState === 'answering');
    
    if (stage === 'playing' && currentWordInfo && !currentWordInfo.is_manual_input && isAutoListen && !isListening && !feedbackMsg.includes('Туура') && canListen) {
      t = setTimeout(() => {
        if (!isListening && stage === 'playing') {
          startListening();
        }
      }, 800);
    }
    return () => clearTimeout(t);
  }, [isListening, isAutoListen, stage, feedbackMsg, gameWords, currentWordIndex, mode, turnState]);

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

  const startGame = async () => {
    if (mode === 'solo' && !playerName) return alert("Атыңызды жазыңыз!");
    // create session
    const gId = await createGameSessionAction(themeId, mode, true);
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

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsAutoListen(false);
    } else {
      setIsAutoListen(true);
      startListening();
    }
  };

  const startListening = () => {
    const currentWordInfo = gameWords[currentWordIndex];
    if (currentWordInfo?.is_manual_input) return; // Do not listen if manual word
    if (recognitionRef.current && !isListening) {
      setFeedbackMsg('');
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Handle case where it might already be started
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
    
    if (normTranscript.includes(normWord) || normWord.includes(normTranscript)) {
      playSound('correct');
      setFeedbackMsg('Туура! 🎉');
      if (mode === 'team') {
        if (answeringTeam === 'team1') setTeam1Score(s => s + 10);
        else if (answeringTeam === 'team2') setTeam2Score(s => s + 10);
      } else {
        setScore(s => s + 10);
      }
      setTimeout(() => triggerNextWord(true), 1000);
    } else {
      playSound('error');
      
      let msg = `Ката: Сиз "${transcript}" дедиңиз. Кайра аракет кылыңыз.`;
      let willSkip = wordMistakes + 1 >= 3;
      if (willSkip) {
        msg = `Сиз 3 жолу ката айттыңыз. Кийинки сөзгө өттүк.`;
      }
      
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
      setFeedbackMsg('Туура! 🎉');
      if (mode === 'team') {
        if (answeringTeam === 'team1') setTeam1Score(s => s + 10);
        else if (answeringTeam === 'team2') setTeam2Score(s => s + 10);
      } else {
        setScore(s => s + 10);
      }
      setTimeout(() => triggerNextWord(true), 1000);
    } else {
      playSound('error');
      
      let msg = `Ката: Сиз "${transcript}" деп жаздыңыз. Кайра аракет кылыңыз.`;
      let willSkip = wordMistakes + 1 >= 3;
      if (willSkip) {
        msg = `Сиз 3 жолу ката жаздыңыз. Кийинки сөзгө өттүк.`;
      }

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
      return alert("Сиздин браузериңиз үн чыгарууну колдобойт.");
    }
    const currentWord = gameWords[currentWordIndex].word;
    const utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.lang = getSpeechLangCode(themeLangCode);
    window.speechSynthesis.speak(utterance);
  };

  const endGame = async (finalHistory: any[] = gameHistory) => {
    setStage('finished');
    const timeTakenSec = selectedTimeSec - timeLeft;
    if (gameId) {
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
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Артка
          </button>

          <h1 className="text-3xl font-extrabold text-center text-slate-800 mb-2">{theme.title}</h1>
          <p className="text-center text-slate-500 mb-8">{theme.description}</p>

          <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setMode('solo')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'solo' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Жеке оюн</button>
              <button onClick={() => setMode('team')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'team' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Командалык</button>
            </div>

            {mode === 'solo' ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Атыңызды жазыңыз</label>
                <input value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full px-5 py-3 text-slate-900 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-indigo-400 focus:ring-0 outline-none transition font-medium" placeholder="Мисалы: Асан" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Команда 1</label>
                  <input value={team1Name} onChange={e => setTeam1Name(e.target.value)} className="w-full px-5 py-3 text-slate-900 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-indigo-400 outline-none transition font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Команда 2</label>
                  <input value={team2Name} onChange={e => setTeam2Name(e.target.value)} className="w-full px-5 py-3 text-slate-900 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-indigo-400 outline-none transition font-medium" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Оюндун убактысы</label>
              <select 
                value={selectedTimeSec} 
                onChange={(e) => setSelectedTimeSec(Number(e.target.value))}
                className="w-full px-5 py-3 text-slate-900 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-indigo-400 focus:ring-0 outline-none transition font-medium appearance-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(m => (
                  <option key={m} value={m * 60}>{m} мүнөт</option>
                ))}
              </select>
            </div>

            <button onClick={startGame} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 text-lg">
              Оюнду Баштоо 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'countdown') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col space-y-8">
         <p className="text-slate-400 text-3xl font-bold animate-pulse">Оюн башталууда...</p>
         <div key={countdownValue} className="text-[12rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-400 animate-bounce">
           {countdownValue > 0 ? countdownValue : 'GO!'}
         </div>
      </div>
    );
  }

  if (stage === 'playing') {
    const currentWordInfo = gameWords[currentWordIndex];
    const isTimerRed = timeLeft <= 10;

    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 md:p-10 font-sans relative overflow-hidden">
        {mode === 'team' && turnState === 'next_countdown' && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center flex-col">
            <h2 className="text-4xl text-slate-300 font-bold mb-8">Кийинки сөзгө даярдангыла...</h2>
            <div key={nextWordCountdown} className="text-[15rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-400 animate-bounce">
               {nextWordCountdown}
            </div>
          </div>
        )}

        {/* Header: Score & Timer */}
        <div className="flex justify-between items-center bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl mx-auto w-full max-w-5xl z-10">
          {mode === 'solo' ? (
            <>
              <div className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">Упай: {score}</div>
              <div className={`text-2xl font-black ${isTimerRed ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xl font-bold text-red-400">Каталар: {mistakes}</div>
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-blue-400 flex flex-col items-start leading-tight">
                <span>{team1Name}</span>
                <span className="text-2xl text-blue-300">Упай: {team1Score}</span>
              </div>
              <div className={`text-3xl font-black ${isTimerRed ? 'text-red-500 animate-pulse' : 'text-white'} mx-4`}>
                {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-lg font-bold text-pink-400 flex flex-col items-end leading-tight">
                <span>{team2Name}</span>
                <span className="text-2xl text-pink-300">Упай: {team2Score}</span>
              </div>
            </>
          )}
        </div>

        {/* Word Display as Stacked Cards */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 mb-4 z-10 mt-8">
          <div className="bg-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest border border-indigo-500/30 mb-4 z-20">
            Сөз: {currentWordIndex + 1} / {gameWords.length}
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
              <p className="text-xl md:text-2xl text-slate-400 font-medium mb-2">Кыргызча котормосу:</p>
              <h2 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6 px-4">
                {currentWordInfo.translation}
              </h2>
              
              <div className="h-10 mt-2">
                {mode === 'team' && turnState === 'buzz' ? (
                  <p className="text-lg md:text-xl text-yellow-400 animate-pulse font-bold">Ким биринчи баскычты басса, ошол жооп берет!</p>
                ) : currentWordInfo.is_manual_input ? (
                  <p className="text-lg md:text-xl text-slate-300">Жообун текст менен жазыңыз</p>
                ) : isListening ? (
                  <div className="flex items-center space-x-3 text-indigo-400">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                    </span>
                    <span className="text-lg md:text-xl font-semibold">{mode === 'team' ? (answeringTeam === 'team1' ? team1Name : team2Name) + " угулуп жатат..." : "Угуу режими иштеп жатат..."}</span>
                  </div>
                ) : (
                  <p className="text-lg md:text-xl text-slate-300">{getLangSpeakLabel(themeLangCode)}</p>
                )}
              </div>
            </div>
          </div>

          {currentWordInfo.is_manual_input && (mode === 'solo' || turnState === 'answering') && (
             <form onSubmit={handleManualSubmit} className="mt-8 w-full max-w-md flex flex-row items-center gap-2">
               <input 
                 type="text"
                 value={manualInputText}
                 onChange={e => setManualInputText(e.target.value)}
                 placeholder={`${mode === 'team' ? (answeringTeam === 'team1' ? team1Name : team2Name) + ', жазыңыз...' : 'Котормосун жазыңыз...'}`}
                 className="flex-1 px-4 py-3 bg-white/10 text-white placeholder-slate-400 border border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none backdrop-blur-md font-medium text-lg"
                 autoFocus
               />
               <button 
                 type="submit"
                 className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95 text-lg"
               >
                 Текшерүү
               </button>
             </form>
          )}

          {/* Feedback Msg */}
          <div className="h-16 mt-4 w-full flex items-center justify-center">
            {feedbackMsg && (
              <div className={`px-6 py-3 rounded-full font-bold text-lg animate-in zoom-in w-max ${feedbackMsg.includes('Туура') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
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
                <div className="text-blue-200 font-bold uppercase text-xs md:text-sm tracking-wider bg-blue-900/50 px-3 py-1 rounded-full">Жооп берүү</div>
              </button>
              
              <button 
                onClick={() => handleBuzz('team2')}
                className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-pink-500 to-rose-700 hover:from-pink-400 hover:to-rose-600 border-8 border-pink-900 shadow-[0_0_50px_rgba(236,72,153,0.5)] flex flex-col items-center justify-center active:scale-90 transition-all hover:scale-105"
              >
                <div className="text-white font-black text-2xl md:text-3xl text-center leading-tight mb-2 drop-shadow-md px-2 break-all">{team2Name}</div>
                <div className="text-pink-200 font-bold uppercase text-xs md:text-sm tracking-wider bg-pink-900/50 px-3 py-1 rounded-full">Жооп берүү</div>
              </button>
            </div>
          )}
        </div>

        {/* Actions for Solo or when Answering in Team */}
        {(mode === 'solo' || (mode === 'team' && turnState === 'answering')) && (
          <div className="flex justify-center items-center space-x-4 md:space-x-8 pb-8 z-20">
            <button onClick={speakWord} title="Кантип айтылат? Угуу" className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 flex items-center justify-center transition-all shadow-lg hover:scale-105 text-indigo-400 hover:text-indigo-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>

            {!currentWordInfo.is_manual_input && (
              <button 
                onClick={toggleListening}
                title={isAutoListen ? "Угууну токтотуу" : "Угууну баштоо"}
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all ${
                  isListening || isAutoListen ? 'bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite] scale-110 shadow-red-500/50' : (mode === 'team' ? (answeringTeam === 'team2' ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/50' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/50') : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 shadow-indigo-600/50')
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-white/80 text-xs font-medium uppercase tracking-widest">{isAutoListen ? "Токтотуу" : "Айт"}</span>
              </button>
            )}

            <button onClick={skipWord} title="Өткөрүп жиберүү" className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 flex items-center justify-center transition-all shadow-lg hover:scale-105 text-slate-400 hover:text-white">
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
  let finalWinText = "Оюн Аяктады!";
  let finalWinColor = "text-yellow-400";
  if (mode === 'team') {
    if (team1Score > team2Score) {
      finalWinText = `🎉 ЖЕҢҮҮЧҮ: ${team1Name}!`;
      finalWinColor = "text-blue-400";
    } else if (team2Score > team1Score) {
      finalWinText = `🎉 ЖЕҢҮҮЧҮ: ${team2Name}!`;
      finalWinColor = "text-pink-400";
    } else {
      finalWinText = "🤝 ТЕҢ ЧЫГУУ!";
      finalWinColor = "text-emerald-400";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-2xl w-full bg-slate-800 p-10 rounded-3xl shadow-2xl border border-slate-700 text-center text-white">
        <h2 className={`text-4xl md:text-5xl font-extrabold mb-8 ${finalWinColor}`}>{finalWinText}</h2>
        
        {mode === 'solo' ? (
          <>
            <div className="space-y-4 my-8">
              <p className="text-xl text-slate-300">Жалпы Упай</p>
              <p className="text-6xl font-black text-white">{score}</p>
            </div>
            <div className="flex justify-between bg-slate-700/50 p-6 rounded-2xl mb-8">
              <div>
                <p className="text-slate-400 text-sm mb-1">Туура сөздөр</p>
                <p className="text-3xl font-bold text-green-400">{score / 10}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Убакыт</p>
                <p className="text-3xl font-bold text-blue-400">{selectedTimeSec - timeLeft} сек</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Каталар</p>
                <p className="text-3xl font-bold text-red-400">{mistakes}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-900/40 p-6 rounded-2xl border border-blue-500/30">
              <h3 className="text-xl font-bold text-blue-300 mb-4 truncate">{team1Name}</h3>
              <p className="text-5xl font-black text-white mb-2">{team1Score}</p>
              <p className="text-slate-400 text-sm">Каталар: <span className="text-red-400 font-bold">{team1Mistakes}</span></p>
            </div>
            <div className="bg-pink-900/40 p-6 rounded-2xl border border-pink-500/30">
              <h3 className="text-xl font-bold text-pink-300 mb-4 truncate">{team2Name}</h3>
              <p className="text-5xl font-black text-white mb-2">{team2Score}</p>
              <p className="text-slate-400 text-sm">Каталар: <span className="text-red-400 font-bold">{team2Mistakes}</span></p>
            </div>
            <div className="col-span-2 mt-4 bg-slate-700/50 p-4 rounded-xl">
               <p className="text-slate-400 text-sm">Жалпы кеткен убакыт: <span className="text-white font-bold">{selectedTimeSec - timeLeft} сек</span></p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={startGame} className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black rounded-xl transition shadow-lg text-lg">
            Кайра ойноо 🔄
          </button>
          <button onClick={() => window.location.href = '/'} className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl transition text-lg">
            Башкы бетке
          </button>
        </div>
      </div>
    </div>
  );
}
