
import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';
import { audioService } from '../services/audioService';

interface QuestionModalProps {
  playerName: string;
  question: Question;
  onAnswer: (correct: boolean) => void;
  onSkip: () => void;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ playerName, question, onAnswer, onSkip }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Hàm xử lý Render MathJax chuyên sâu
  const renderMath = async () => {
    if ((window as any).MathJax && containerRef.current) {
      try {
        // Sử dụng typesetPromise trực tiếp để quét lại các thay đổi trong DOM
        await (window as any).MathJax.typesetPromise([containerRef.current]);
      } catch (err) {
        console.error("MathJax error:", err);
      }
    }
  };

  // Re-render Math mỗi khi có bất kỳ thay đổi nào về trạng thái hiển thị
  useEffect(() => {
    // Sử dụng requestAnimationFrame để đảm bảo React đã cập nhật DOM xong
    const frameId = requestAnimationFrame(() => {
      renderMath();
    });
    return () => cancelAnimationFrame(frameId);
  }, [question, selectedIdx, revealed, feedback]);

  const handleAnswer = (idx: number) => {
    if (revealed) return;
    setSelectedIdx(idx);
    
    // Tạo độ trễ nhỏ để người dùng thấy hiệu ứng chọn trước khi hiện kết quả
    setTimeout(() => {
      setRevealed(true);
      const isCorrect = idx === question.correct;
      if (isCorrect) {
        setFeedback('CHÍNH XÁC!');
        audioService.playCorrect();
        audioService.speak("Chúc mừng bạn đã trả lời chính xác");
      } else {
        setFeedback('SAI RỒI!');
        audioService.playWrong();
        audioService.speak("Rất tiếc bạn đã trả lời sai");
      }
      
      setTimeout(() => {
        onAnswer(isCorrect);
      }, 2500);
    }, 800);
  };

  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div ref={containerRef} className="millionaire-modal w-full max-w-4xl rounded-[2.5rem] p-6 md:p-10 flex flex-col items-center border-4 border-white/20">
        <div className="text-xl md:text-3xl text-yellow-400 font-black uppercase mb-8 tracking-widest border-b-2 border-white/10 pb-4 w-full text-center">
          Học Sinh: <span className="text-white ml-2 drop-shadow-md">{playerName}</span>
        </div>

        <div className="bg-gradient-to-b from-blue-900/40 via-blue-800/20 to-transparent border-2 border-white/30 rounded-3xl w-full min-h-[140px] flex items-center justify-center p-8 text-center text-2xl md:text-4xl font-bold shadow-2xl mb-10 leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: question.q }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          {question.options.map((opt, idx) => {
            let statusClass = "border-white/20 hover:border-yellow-400 text-white bg-black/40";
            if (selectedIdx === idx) statusClass = "bg-orange-500 border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]";
            if (revealed) {
              if (idx === question.correct) statusClass = "bg-green-500 border-white animate-pulse text-white shadow-[0_0_30px_rgba(34,197,94,0.6)]";
              else if (selectedIdx === idx) statusClass = "bg-red-600 border-white text-white";
              else statusClass = "opacity-30 border-white/10 text-gray-400";
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={revealed}
                className={`flex items-center p-5 rounded-full border-2 text-left text-xl md:text-2xl font-bold transition-all duration-300 transform active:scale-95 ${statusClass}`}
              >
                <span className="text-yellow-400 font-black mr-5 w-10 text-center text-2xl">{labels[idx]}:</span>
                <span dangerouslySetInnerHTML={{ __html: opt }} />
              </button>
            );
          })}
        </div>

        <div className={`mt-8 h-12 text-3xl font-black tracking-widest drop-shadow-lg ${feedback === 'CHÍNH XÁC!' ? 'text-green-400' : 'text-red-500'}`}>
          {feedback}
        </div>

        <div className="mt-4 w-full flex justify-end">
          <button onClick={onSkip} className="text-gray-400 hover:text-white underline text-sm font-bold transition">
            Bỏ qua câu này
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionModal;
