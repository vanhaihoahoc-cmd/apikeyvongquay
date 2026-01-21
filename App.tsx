
import React, { useState, useCallback, useEffect } from 'react';
import { Settings, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import Wheel from './components/Wheel';
import QuestionModal from './components/QuestionModal';
import SettingsModal from './components/SettingsModal';
import ApiKeyModal from './components/ApiKeyModal';
import { Segment, Question, SpinSpeed, GameState } from './types';
import { PALETTE, DEFAULT_NAMES, DEFAULT_QUESTIONS } from './constants';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [names, setNames] = useState<string[]>(DEFAULT_NAMES);
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [spinSpeed, setSpinSpeed] = useState<SpinSpeed>(3000);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [confetti, setConfetti] = useState<{ id: number, left: string, color: string, duration: string }[]>([]);

  // Kiểm tra API Key khi khởi chạy
  useEffect(() => {
    const checkKey = () => {
      const saved = localStorage.getItem('VANHAI_API_KEY');
      setHasKey(!!saved);
    };
    checkKey();
  }, []);

  const segments: Segment[] = names.map((name, i) => ({
    text: name,
    color: PALETTE[i % PALETTE.length],
    textColor: PALETTE[i % PALETTE.length] === "#FFCA28" ? "#333" : "#FFF"
  }));

  const toggleSound = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    audioService.setEnabled(next);
  };

  const handleSpinEnd = (index: number) => {
    setWinnerIndex(index);
    setGameState(GameState.QUESTION);
    audioService.speak(`Xin mời bạn ${names[index]}`);
    setTimeout(() => setShowQuestion(true), 1000);
  };

  const createConfetti = useCallback(() => {
    const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff'];
    const newConfetti = Array.from({ length: 50 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100 + 'vw',
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: (Math.random() * 2 + 1) + 's'
    }));
    setConfetti(newConfetti);
    setTimeout(() => setConfetti([]), 3000);
  }, []);

  const handleAnswer = (correct: boolean) => {
    if (correct) createConfetti();
    setShowQuestion(false);
    setShowConfirmDelete(true);
  };

  const handleSaveSettings = (newNames: string[], newQuestions: Question[], newSpeed: SpinSpeed) => {
    setNames(newNames);
    setQuestions(newQuestions);
    setSpinSpeed(newSpeed);
    setShowSettings(false);
  };

  const removeCurrentWinner = () => {
    if (winnerIndex !== null) {
      const updated = [...names];
      updated.splice(winnerIndex, 1);
      setNames(updated);
      setWinnerIndex(null);
    }
    setShowConfirmDelete(false);
    setGameState(GameState.IDLE);
  };

  const keepCurrentWinner = () => {
    setShowConfirmDelete(false);
    setGameState(GameState.IDLE);
    setWinnerIndex(null);
  };

  if (hasKey === false) {
    return <ApiKeyModal onKeySelected={() => setHasKey(true)} />;
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start overflow-y-auto pt-24 pb-32 px-4 bg-gradient-to-br from-[#001a1a] via-[#00332e] to-[#004d40]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="fixed top-4 left-4 md:top-8 md:left-8 flex items-center z-50">
        <div className="flex items-center gap-3 bg-black/60 p-2 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 17.18 6.92 19 12 19C17.08 19 19 17.18 19 17.18V13.18L12 17L5 13.18Z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm md:text-lg font-black tracking-tighter gold-metallic-text leading-none">VANHAI</span>
            <span className="text-[7px] tracking-[0.4em] text-yellow-500/80 font-black uppercase leading-tight">Education</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-8 md:mb-16 z-10 space-y-3">
        <h1 className="text-3xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter gold-metallic-text drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
          Vòng Quay Học Tập
        </h1>
        <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent mx-auto rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-full flex justify-center transform hover:scale-[1.01] transition-transform duration-500">
        <Wheel 
          segments={segments} 
          spinSpeed={spinSpeed}
          isSpinning={gameState === GameState.SPINNING}
          setIsSpinning={(s) => setGameState(s ? GameState.SPINNING : GameState.IDLE)}
          onSpinEnd={handleSpinEnd}
        />
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-40">
        <button 
          onClick={() => setShowSettings(true)}
          className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-90 group border-2 border-white/20"
        >
          <Settings className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md border border-white/10 shadow-xl transition-all hover:scale-110 active:scale-90"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      <button 
        onClick={toggleSound}
        className="fixed top-4 right-4 md:top-10 md:right-10 p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl backdrop-blur-md border border-white/5 shadow-lg transition-all hover:scale-110 z-40"
      >
        {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>

      {showQuestion && winnerIndex !== null && (
        <QuestionModal
          playerName={names[winnerIndex]}
          question={questions[Math.floor(Math.random() * questions.length)]}
          onAnswer={handleAnswer}
          onSkip={() => { setShowQuestion(false); setShowConfirmDelete(true); }}
        />
      )}

      {showConfirmDelete && winnerIndex !== null && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-md w-full text-center shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 uppercase">Lượt Chơi Kết Thúc</h2>
            <p className="text-gray-500 mb-8 font-medium">Bạn <span className="font-bold text-blue-600">{names[winnerIndex]}</span> đã hoàn thành thử thách.</p>
            <div className="flex flex-col gap-3">
              <button onClick={removeCurrentWinner} className="w-full bg-red-500 text-white font-black py-4 rounded-xl shadow-lg">Xóa tên học sinh</button>
              <button onClick={keepCurrentWinner} className="w-full bg-gray-100 text-gray-700 font-black py-4 rounded-xl">Giữ lại danh sách</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsModal 
          names={names}
          questions={questions}
          currentSpeed={spinSpeed}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {confetti.map(c => (
        <div key={c.id} className="confetti" style={{ left: c.left, backgroundColor: c.color, animationDuration: c.duration, top: '-20px' }} />
      ))}
    </div>
  );
};

export default App;
