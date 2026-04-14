'use client';

import { useState, useEffect, useRef } from 'react';
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
  const themeLangCode = theme?.language || 'en';
  const [stage, setStage] = useState<'lobby' | 'countdown' | 'playing' | 'finished'>('lobby');
  const [mode, setMode] = useState<'solo' | 'team'>('solo');
  const [playerName, setPlayerName] = useState('');
  const [team1Name, setTeam1Name] = useState('Команда 1');
  const [team2Name, setTeam2Name] = useState('Команда 2');
  const [gameId, setGameId] = useState<string | null>(null);

  // Game Logic state
  const [countdownValue, setCountdownValue] = useState(3);
  const [gameWords, setGameWords] = useState<any[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isListening, setIsListening] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

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
  }, [currentWordIndex, themeLangCode, stage, gameWords]);

  useEffect(() => {
    let timer: any;
    if (stage === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (stage === 'playing' && timeLeft === 0) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [stage, timeLeft]);

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
    setTimeLeft(60);
    setScore(0);
    setMistakes(0);
    setCurrentWordIndex(0);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setFeedbackMsg('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSpeechResult = (transcript: string) => {
    if (stage !== 'playing' || !gameWords[currentWordIndex]) return;
    
    const currentWord = gameWords[currentWordIndex].word.toLowerCase();
    
    // Very basic comparison. In production use fuzzy match (e.g. levenshtein)
    if (transcript.includes(currentWord) || currentWord.includes(transcript)) {
      setFeedbackMsg('Туура! 🎉');
      setScore(s => s + 10);
      setTimeout(() => {
        setFeedbackMsg('');
        if (currentWordIndex + 1 < gameWords.length) {
          setCurrentWordIndex(prev => prev + 1);
        } else {
          endGame();
        }
      }, 1000);
    } else {
      setFeedbackMsg(`Ката: Сиз "${transcript}" дедиңиз. Кайра аракет кылыңыз.`);
      setMistakes(m => m + 1);
    }
  };

  const skipWord = () => {
    setMistakes(m => m + 1); // Count skip as a mistake
    if (currentWordIndex + 1 < gameWords.length) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      endGame();
    }
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

  const endGame = async () => {
    setStage('finished');
    if (gameId) {
      await saveGameResultAction(gameId, themeId, mode === 'solo' ? playerName : `${team1Name} & ${team2Name}`, score, mistakes);
    }
  };

  if (stage === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-white/50 backdrop-blur-sm">
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
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 md:p-10 font-sans">
        {/* Header: Score & Timer */}
        <div className="flex justify-between items-center bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl mx-auto w-full max-w-4xl">
          <div className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Упай: {score}
          </div>
          <div className={`text-2xl font-black ${isTimerRed ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </div>
          <div className="text-xl font-bold text-red-400">
            Каталар: {mistakes}
          </div>
        </div>

        {/* Word Display */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-8">
          <div className="bg-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest border border-indigo-500/30 mb-2">
            Сөз: {currentWordIndex + 1} / {gameWords.length}
          </div>
          <p className="text-xl md:text-2xl text-slate-400 font-medium">Кыргызча котормосу:</p>
          <h2 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            {currentWordInfo.translation}
          </h2>
          <p className="text-lg text-slate-300">{getLangSpeakLabel(themeLangCode)}</p>

          {/* Feedback Msg */}
          {feedbackMsg && (
            <div className={`mt-4 px-6 py-3 rounded-full font-bold text-lg animate-in zoom-in ${feedbackMsg.includes('Туура') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {feedbackMsg}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center items-center space-x-4 md:space-x-8 pb-12">
          {/* Speak Button */}
          <button onClick={speakWord} title="Кантип айтылат? Угуу" className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 flex items-center justify-center transition-all shadow-lg hover:scale-105 text-indigo-400 hover:text-indigo-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>

          {/* Microphone Action */}
          <button 
            onClick={startListening}
            className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center shadow-2xl transition-all ${
              isListening ? 'bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite] scale-110 shadow-red-500/50' : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 shadow-indigo-600/50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* Skip Button */}
          <button onClick={skipWord} title="Өткөрүп жиберүү" className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 flex items-center justify-center transition-all shadow-lg hover:scale-105 text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // finished
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 p-10 rounded-3xl shadow-2xl border border-slate-700 text-center text-white">
        <h2 className="text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Оюн Аяктады!</h2>
        <div className="space-y-4 my-8">
          <p className="text-xl text-slate-300">Жалпы Упай</p>
          <p className="text-6xl font-black text-white">{score}</p>
        </div>
        <div className="flex justify-between bg-slate-700/50 p-4 rounded-2xl mb-8">
          <div>
            <p className="text-slate-400 text-sm">Туура сөздөр</p>
            <p className="text-2xl font-bold text-green-400">{score / 10}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Каталар</p>
            <p className="text-2xl font-bold text-red-400">{mistakes}</p>
          </div>
        </div>
        <div className="space-y-4">
          <button onClick={startGame} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black rounded-xl transition shadow-lg text-lg">
            Кайра ойноо 🔄
          </button>
          <button onClick={() => window.location.href = '/'} className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl transition">
            Башкы бетке кайтуу
          </button>
        </div>
      </div>
    </div>
  );
}
