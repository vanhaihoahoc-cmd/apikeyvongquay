
import React, { useRef, useEffect, useCallback } from 'react';
import { Segment, SpinSpeed } from '../types';
import { audioService } from '../services/audioService';

interface WheelProps {
  segments: Segment[];
  onSpinEnd: (index: number) => void;
  spinSpeed: SpinSpeed;
  isSpinning: boolean;
  setIsSpinning: (s: boolean) => void;
}

const Wheel: React.FC<WheelProps> = ({ segments, onSpinEnd, spinSpeed, isSpinning, setIsSpinning }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const lastSegmentIndexRef = useRef(-1);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;
    const totalSegments = segments.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (totalSegments === 0) {
      ctx.font = "bold 30px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFF";
      ctx.fillText("HẾT DANH SÁCH", centerX, centerY);
      return;
    }

    const arc = (2 * Math.PI) / totalSegments;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotationRef.current * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    segments.forEach((segment, i) => {
      const angle = i * arc;
      ctx.beginPath();
      ctx.fillStyle = segment.color;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arc);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = segment.textColor;
      
      // Giữ font size cân đối với canvas 800px
      const fontSize = totalSegments > 20 ? 18 : (totalSegments > 12 ? 22 : 28);
      ctx.font = `bold ${fontSize}px Arial`;
      
      let displayText = segment.text;
      if (displayText.length > 15) displayText = displayText.substring(0, 13) + "...";
      ctx.fillText(displayText, radius - 30, 10);
      ctx.restore();
    });
    ctx.restore();

    // Outer Border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 5, 0, 2 * Math.PI);
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.stroke();
    
    // Decorative inner ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 20, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.stroke();
  }, [segments]);

  useEffect(() => {
    draw();
  }, [draw]);

  const spin = () => {
    if (isSpinning || segments.length === 0) return;
    setIsSpinning(true);
    audioService.init();

    const spinAngle = 1800 + Math.random() * 360;
    const startRotation = rotationRef.current;
    const startTime = performance.now();
    const duration = spinSpeed;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); 

      rotationRef.current = startRotation + spinAngle * ease;
      draw();

      const degrees = rotationRef.current % 360;
      const segmentAngle = 360 / segments.length;
      const angleAtPointer = (270 - degrees + 360) % 360;
      const currentSegmentIndex = Math.floor(angleAtPointer / segmentAngle);

      if (currentSegmentIndex !== lastSegmentIndexRef.current && lastSegmentIndexRef.current !== -1) {
        audioService.playTick(() => {
          pointerRef.current?.classList.remove('pointer-tick');
          void pointerRef.current?.offsetWidth;
          pointerRef.current?.classList.add('pointer-tick');
        });
      }
      lastSegmentIndexRef.current = currentSegmentIndex;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        audioService.playWin();
        const winnerIndex = Math.floor(angleAtPointer / segmentAngle) % segments.length;
        onSpinEnd(winnerIndex);
      }
    };
    requestAnimationFrame(animate);
  };

  return (
    <div className="relative w-[74vw] h-[74vw] max-w-[480px] max-h-[480px] mx-auto group aspect-square">
      {/* Pointer adjusted size */}
      <div 
        ref={pointerRef}
        className="absolute top-[-24px] left-1/2 -translate-x-1/2 w-8 h-12 md:w-11 md:h-15 z-20 pointer-events-none"
        style={{
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))',
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
          backgroundColor: '#ff0000',
          borderTop: '3px solid #fff'
        }}
      />
      
      {/* High resolution canvas maintains sharpness */}
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={800} 
        className="w-full h-full rounded-full shadow-[0_0_40px_rgba(0,0,0,0.4)] border-4 md:border-8 border-white/20 bg-black/20 backdrop-blur-sm"
      />

      {/* Center Button adjusted size */}
      <button
        onClick={spin}
        disabled={isSpinning || segments.length === 0}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-22 md:h-22 bg-white rounded-full z-10 flex flex-col items-center justify-center font-black text-red-600 shadow-[inset_0_0_15px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.3)] border-4 border-gray-100 transition active:scale-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-tighter`}
      >
        <span className="text-sm md:text-xl leading-none">QUAY</span>
        <div className="w-6 h-1 bg-red-100 mt-1 rounded-full opacity-50" />
      </button>
    </div>
  );
};

export default Wheel;
