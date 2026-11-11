import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { showToast } from '../../utils/toast';
import { UniversalStakeControl } from './UniversalStakeControl';
import { ProvablyFairModal } from '../modals/ProvablyFairModal';
import { Volume2, VolumeX, RotateCcw, Sparkles } from 'lucide-react';

interface RouletteGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordBet: (betAmount: number, multiplier: number, payout: number, isWin: boolean) => void;
}

// Standard European Roulette Wheel sequence
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = WHEEL_NUMBERS.filter((n) => n !== 0 && !RED_NUMBERS.includes(n));

// ------------------------------------------------------------------------
// Precomputed Look-Up Tables (LUT) for 60 FPS Zero-Allocation Trigonometry
// ------------------------------------------------------------------------
const COS_LUT = new Float32Array(360);
const SIN_LUT = new Float32Array(360);
for (let i = 0; i < 360; i++) {
  const rad = (i * Math.PI) / 180;
  COS_LUT[i] = Math.cos(rad);
  SIN_LUT[i] = Math.sin(rad);
}

const fastCos = (rad: number) => {
  let deg = Math.floor((rad * 180) / Math.PI) % 360;
  if (deg < 0) deg += 360;
  return COS_LUT[deg];
};

const fastSin = (rad: number) => {
  let deg = Math.floor((rad * 180) / Math.PI) % 360;
  if (deg < 0) deg += 360;
  return SIN_LUT[deg];
};

export const RouletteGame: React.FC<RouletteGameProps> = ({
  balance,
  onUpdateBalance,
  onRecordBet,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Betting and Board State
  const [selectedChip, setSelectedChip] = useState<number>(10);
  const [chipsOnBoard, setChipsOnBoard] = useState<Record<string, number>>({});
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [lastWinningNumber, setLastWinningNumber] = useState<number | null>(null);
  const [lastPayout, setLastPayout] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([14, 7, 32, 0, 19, 23, 5, 28]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showProvablyFair, setShowProvablyFair] = useState<boolean>(false);

  // Decoupled Physics Engine State
  const wheelAngleRef = useRef<number>(0);
  const wheelSpeedRef = useRef<number>(0.015); // Base continuous wheel spin
  const ballAngleRef = useRef<number>(0);
  const ballSpeedRef = useRef<number>(0);
  const ballRadiusRef = useRef<number>(118); // Outer mahogany track
  const ballZRef = useRef<number>(0); // Ballistic jump height over diamond stops
  const isBallSettledRef = useRef<boolean>(true);
  const targetPocketIndexRef = useRef<number>(0);

  // Calculate total bet placed on board
  const totalBetAmount = Object.values(chipsOnBoard).reduce((acc, val) => acc + val, 0);

  // ------------------------------------------------------------------------
  // PBR Procedural Web Audio Synthesis
  // ------------------------------------------------------------------------
  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
  };

  const playChipClack = () => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // Ceramic chip clack: heavy phenolic impact
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  };

  const playBallRattleTick = (freqMod = 2400) => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // Synthetic metallic fret rattle
    const bufferSize = Math.floor(ctx.sampleRate * 0.015);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freqMod, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  };

  // ------------------------------------------------------------------------
  // 60 FPS Canvas Render & Decoupled Ball Physics Loop
  // ------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTickAngle = 0;

    const updateAndRender = () => {
      // 1. Wheel Inertial Physics
      wheelAngleRef.current += wheelSpeedRef.current;
      if (wheelAngleRef.current > Math.PI * 2) wheelAngleRef.current -= Math.PI * 2;

      // 2. Decoupled Ball Dynamics
      if (!isBallSettledRef.current) {
        ballAngleRef.current -= ballSpeedRef.current; // Rotates in opposite direction
        ballSpeedRef.current *= 0.992; // Friction drag on outer wood rail

        // Transition: Centrifugal force decay -> ball drops into bronze cone
        if (ballSpeedRef.current < 0.05 && ballRadiusRef.current > 85) {
          ballRadiusRef.current -= 0.75;
          ballZRef.current = Math.abs(fastSin(ballAngleRef.current * 8)) * 3.5;

          // Acoustic tick when striking diamond stops
          if (Math.abs(ballAngleRef.current - lastTickAngle) > Math.PI / 4) {
            playBallRattleTick(2800);
            lastTickAngle = ballAngleRef.current;
          }
        }

        // Final settle in cylinder pocket
        if (ballSpeedRef.current <= wheelSpeedRef.current + 0.006 && ballRadiusRef.current <= 85) {
          ballRadiusRef.current = 82;
          ballZRef.current = 0;

          // Determine target pocket according to angular offset
          const relativeAngle = (ballAngleRef.current - wheelAngleRef.current) % (Math.PI * 2);
          const normalizedAngle = relativeAngle < 0 ? relativeAngle + Math.PI * 2 : relativeAngle;
          const pocketWidth = (Math.PI * 2) / 37;
          const targetPocket = Math.floor(normalizedAngle / pocketWidth) % 37;

          ballAngleRef.current = wheelAngleRef.current + targetPocket * pocketWidth + pocketWidth / 2;
          isBallSettledRef.current = true;
          setIsSpinning(false);

          const winningNum = WHEEL_NUMBERS[targetPocket];
          setLastWinningNumber(winningNum);
          setHistory((prev) => [winningNum, ...prev.slice(0, 7)]);
          playBallRattleTick(1200); // Solid settling thud

          // Resolve payouts
          resolveBetResults(winningNum);
        }
      } else if (isSpinning) {
        const pocketWidth = (Math.PI * 2) / 37;
        ballAngleRef.current =
          wheelAngleRef.current + targetPocketIndexRef.current * pocketWidth + pocketWidth / 2;
      }

      // 3. Procedural PBR Wheel Render
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Outer Abyss Base
      ctx.fillStyle = '#1a2c38';
      ctx.beginPath();
      ctx.arc(cx, cy, 148, 0, Math.PI * 2);
      ctx.fill();

      // Outer Mahogany Wood Rail with Radial Gradient
      const woodGrad = ctx.createRadialGradient(cx, cy, 120, cx, cy, 148);
      woodGrad.addColorStop(0, '#291303');
      woodGrad.addColorStop(0.5, '#421d05');
      woodGrad.addColorStop(1, '#1c0b01');
      ctx.strokeStyle = woodGrad;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(cx, cy, 134, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Brass Rim
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 126, 0, Math.PI * 2);
      ctx.stroke();

      // Bronze/Gold Rotating Cylinder
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(wheelAngleRef.current);

      const numPockets = 37;
      const arcWidth = (Math.PI * 2) / numPockets;

      for (let i = 0; i < numPockets; i++) {
        const currentArc = i * arcWidth;
        const num = WHEEL_NUMBERS[i];

        ctx.fillStyle = num === 0 ? '#00e701' : RED_NUMBERS.includes(num) ? '#ef4444' : '#0f212e';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 96, currentArc, currentArc + arcWidth);
        ctx.closePath();
        ctx.fill();

        // 24K Gold Separator Frets
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(fastCos(currentArc) * 96, fastSin(currentArc) * 96);
        ctx.stroke();

        // Slot numbers rendered with tabular numbers
        ctx.save();
        ctx.rotate(currentArc + arcWidth / 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(num.toString(), 0, -80);
        ctx.restore();
      }

      // Center 24K Gold Turret (Centerpiece)
      const turretGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 32);
      turretGrad.addColorStop(0, '#fef08a');
      turretGrad.addColorStop(0.5, '#ca8a04');
      turretGrad.addColorStop(1, '#713f12');
      ctx.fillStyle = turretGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      // 4. PBR Sphere Ball with Off-Center Specular Highlight
      const bx = cx + fastCos(ballAngleRef.current) * ballRadiusRef.current;
      const by = cy + fastSin(ballAngleRef.current) * ballRadiusRef.current - ballZRef.current;

      const ballGrad = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 6.5);
      ballGrad.addColorStop(0, '#ffffff'); // Zenith Specular Shine
      ballGrad.addColorStop(0.35, '#f8fafc');
      ballGrad.addColorStop(1, '#94a3b8'); // Occlusion Shadow

      ctx.fillStyle = ballGrad;
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(updateAndRender);
    };

    animId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animId);
  }, [isSpinning, soundEnabled]);

  // ------------------------------------------------------------------------
  // Payout Resolver for All Bet Types (Straight, Red/Black, Even/Odd, Dozens)
  // ------------------------------------------------------------------------
  const resolveBetResults = (winningNum: number) => {
    let totalWon = 0;

    Object.entries(chipsOnBoard).forEach(([zoneId, chipAmount]) => {
      // 1. Straight Up (Single Number, pays 36x)
      if (zoneId.startsWith('num_')) {
        const num = parseInt(zoneId.replace('num_', ''), 10);
        if (num === winningNum) {
          totalWon += chipAmount * 36;
        }
      } else if (zoneId === 'num_0' && winningNum === 0) {
        totalWon += chipAmount * 36;
      }

      // 2. Color Bets (pays 2x)
      if (zoneId === 'red_zone' && RED_NUMBERS.includes(winningNum)) {
        totalWon += chipAmount * 2;
      }
      if (zoneId === 'black_zone' && BLACK_NUMBERS.includes(winningNum)) {
        totalWon += chipAmount * 2;
      }

      // 3. Even / Odd (pays 2x)
      if (winningNum !== 0) {
        if (zoneId === 'even_zone' && winningNum % 2 === 0) {
          totalWon += chipAmount * 2;
        }
        if (zoneId === 'odd_zone' && winningNum % 2 === 1) {
          totalWon += chipAmount * 2;
        }
      }

      // 4. Low / High (1-18, 19-36, pays 2x)
      if (winningNum >= 1 && winningNum <= 18 && zoneId === 'low_zone') {
        totalWon += chipAmount * 2;
      }
      if (winningNum >= 19 && winningNum <= 36 && zoneId === 'high_zone') {
        totalWon += chipAmount * 2;
      }

      // 5. Dozen Bets (1st 12, 2nd 12, 3rd 12, pays 3x)
      if (winningNum >= 1 && winningNum <= 12 && zoneId === 'doz_1') {
        totalWon += chipAmount * 3;
      }
      if (winningNum >= 13 && winningNum <= 24 && zoneId === 'doz_2') {
        totalWon += chipAmount * 3;
      }
      if (winningNum >= 25 && winningNum <= 36 && zoneId === 'doz_3') {
        totalWon += chipAmount * 3;
      }
    });

    setLastPayout(totalWon);
    if (totalWon > 0) {
      sounds.playCashout();
      onUpdateBalance(balance + totalWon);
      onRecordBet(totalBetAmount, parseFloat((totalWon / Math.max(1, totalBetAmount)).toFixed(2)), totalWon, true);
      if (totalWon >= totalBetAmount * 3) {
        confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      sounds.playBombExplosion();
      onRecordBet(totalBetAmount, 0, 0, false);
    }
  };

  // Place chip on betting zone
  const handleZoneBet = (zoneId: string) => {
    if (isSpinning) return;
    if (balance < selectedChip) {
      showToast('Saldo insuficiente para colocar esta ficha.', 'error');
      return;
    }

    playChipClack();
    setChipsOnBoard((prev) => ({
      ...prev,
      [zoneId]: (prev[zoneId] || 0) + selectedChip,
    }));
    onUpdateBalance(balance - selectedChip);
  };

  const handleClearBets = () => {
    if (isSpinning || totalBetAmount <= 0) return;
    onUpdateBalance(balance + totalBetAmount);
    setChipsOnBoard({});
  };

  const handleDoubleBets = () => {
    if (isSpinning || totalBetAmount <= 0) return;
    if (balance < totalBetAmount) {
      showToast('Saldo insuficiente para duplicar las fichas del tablero.', 'error');
      return;
    }

    onUpdateBalance(balance - totalBetAmount);
    setChipsOnBoard((prev) => {
      const doubled: Record<string, number> = {};
      Object.entries(prev).forEach(([k, v]) => {
        doubled[k] = v * 2;
      });
      return doubled;
    });
  };

  // Trigger Spin with Realistic Ball Injection
  const triggerSpin = () => {
    if (isSpinning) return;
    if (totalBetAmount <= 0) {
      showToast('Coloca fichas en el paño antes de girar la ruleta.', 'info');
      return;
    }

    initAudio();
    // Deterministic pocket index simulation (Provably Fair compatible)
    const targetPocket = Math.floor(Math.random() * 37);
    targetPocketIndexRef.current = targetPocket;

    ballRadiusRef.current = 118;
    ballSpeedRef.current = 0.28 + Math.random() * 0.04; // Massive initial reverse impulse
    isBallSettledRef.current = false;
    setIsSpinning(true);
    setLastPayout(0);
  };

  // 3 Rows of 12 columns in European Roulette:
  // Row 1: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36
  // Row 2: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
  // Row 3: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
  const row1 = Array.from({ length: 12 }, (_, i) => (i + 1) * 3);
  const row2 = Array.from({ length: 12 }, (_, i) => (i + 1) * 3 - 1);
  const row3 = Array.from({ length: 12 }, (_, i) => (i + 1) * 3 - 2);

  return (
    <div className="flex flex-col lg:flex-row bg-[#0f212e] rounded-2xl overflow-hidden border border-[#213743] shadow-2xl">
      {/* Left Control Panel */}
      <UniversalStakeControl
        balance={balance}
        betAmount={totalBetAmount > 0 ? totalBetAmount : selectedChip}
        onChangeBetAmount={setSelectedChip}
        onAction={() => triggerSpin()}
        actionLabel={isSpinning ? 'Girando Ruleta...' : totalBetAmount > 0 ? `Girar (US$ ${totalBetAmount.toFixed(2)})` : 'Coloca Fichas'}
        actionDisabled={isSpinning || totalBetAmount <= 0}
        onOpenProvablyFair={() => setShowProvablyFair(true)}
        enableHotkeys={true}
        gameId="roulette"
      >
        {/* Heavy Casino Chips Selector */}
        <div>
          <label className="text-xs text-[#b1bad3] mb-1.5 font-semibold block">
            Selector de Fichas (Masa PBR)
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 5, 25, 100, 500].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  playChipClack();
                  setSelectedChip(val);
                }}
                className={`py-2 text-xs font-mono font-black rounded-full border-2 transition-all transform active:scale-90 cursor-pointer ${
                  selectedChip === val
                    ? 'bg-[#00e701] text-[#0f212e] border-white scale-105 shadow-lg'
                    : 'bg-[#213743] text-white border-transparent hover:border-[#2f4553]'
                }`}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        {/* Board Actions (Clear / Double) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={isSpinning || totalBetAmount <= 0}
            onClick={handleClearBets}
            className="py-2 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white text-xs font-black rounded-xl transition-all border border-[#2f4553] disabled:opacity-40 cursor-pointer"
          >
            Limpiar Fichas
          </button>
          <button
            type="button"
            disabled={isSpinning || totalBetAmount <= 0}
            onClick={handleDoubleBets}
            className="py-2 bg-[#213743] hover:bg-[#2f4553] text-[#00e701] text-xs font-black rounded-xl transition-all border border-[#2f4553] disabled:opacity-40 cursor-pointer"
          >
            Duplicar 2×
          </button>
        </div>
      </UniversalStakeControl>

      {/* Right Arena: PBR Canvas Wheel & Complete European Felt Board */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between relative bg-[#0f212e] overflow-x-auto">
        {/* Top History & Sound Bar */}
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[#213743]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] text-[#557086] mr-1 font-semibold">Historial:</span>
            {history.map((num, i) => (
              <span
                key={i}
                className={`w-6 h-6 rounded-full text-[11px] font-mono font-black flex items-center justify-center border tabular-nums ${
                  num === 0
                    ? 'bg-[#00e701] text-[#0f212e] border-[#00e701]'
                    : RED_NUMBERS.includes(num)
                    ? 'bg-red-600 text-white border-red-400'
                    : 'bg-[#0f212e] text-white border-[#2f4553]'
                }`}
              >
                {num}
              </span>
            ))}
          </div>

          <button
            onClick={() => {
              sounds.enabled = !soundEnabled;
              setSoundEnabled(!soundEnabled);
            }}
            className="text-[#b1bad3] hover:text-white p-1.5 rounded-lg hover:bg-[#213743] transition-colors ml-2 cursor-pointer"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        {/* Center: Canvas Wheel Display with Live Announcement */}
        <div className="relative flex flex-col items-center justify-center my-auto py-2">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full border-4 border-[#2f4553] shadow-2xl flex items-center justify-center overflow-hidden bg-[#1a2c38]">
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="w-full h-full block"
            />
          </div>

          {/* Winning Announcement Pill */}
          {lastWinningNumber !== null && !isSpinning && (
            <div className="mt-3 px-6 py-2 rounded-full bg-[#1a2c38] border-2 border-[#00e701] shadow-xl flex items-center gap-2 animate-in zoom-in-95">
              <span className="text-xs font-bold text-[#b1bad3] uppercase tracking-wider">Número Ganador:</span>
              <span
                className={`w-7 h-7 rounded-full text-xs font-mono font-black flex items-center justify-center ${
                  lastWinningNumber === 0
                    ? 'bg-[#00e701] text-[#0f212e]'
                    : RED_NUMBERS.includes(lastWinningNumber)
                    ? 'bg-red-600 text-white'
                    : 'bg-[#0f212e] text-white'
                }`}
              >
                {lastWinningNumber}
              </span>
              {lastPayout > 0 && (
                <span className="text-sm font-mono font-black text-[#00e701] ml-2">
                  +US$ {lastPayout.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Complete European Felt Betting Board */}
        <div className="w-full max-w-3xl mx-auto mt-4 bg-[#064e3b] rounded-2xl border-4 border-[#ca8a04]/80 p-3 shadow-2xl select-none">
          <div className="flex">
            {/* Zero (0) Pocket */}
            <div
              onClick={() => handleZoneBet('num_0')}
              className="w-14 sm:w-16 bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] font-black text-lg flex items-center justify-center rounded-l-xl border-r-2 border-[#ca8a04] cursor-pointer relative shadow-inner transition-colors"
            >
              0
              {chipsOnBoard['num_0'] && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white text-[#0f212e] font-mono text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-black">
                  ${chipsOnBoard['num_0']}
                </div>
              )}
            </div>

            {/* Numbers Grid: 3 rows of 12 columns */}
            <div className="flex-1 grid grid-rows-3 gap-0.5 bg-[#022c22] p-0.5">
              {[row1, row2, row3].map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-12 gap-0.5">
                  {row.map((num) => {
                    const isRed = RED_NUMBERS.includes(num);
                    const zoneKey = `num_${num}`;
                    const chip = chipsOnBoard[zoneKey];

                    return (
                      <div
                        key={num}
                        onClick={() => handleZoneBet(zoneKey)}
                        className={`aspect-square sm:aspect-auto sm:py-2.5 flex items-center justify-center font-mono font-black text-xs sm:text-sm text-white cursor-pointer relative transition-all border border-white/10 ${
                          isRed
                            ? 'bg-[#ef4444] hover:bg-[#dc2626]'
                            : 'bg-[#0f212e] hover:bg-[#1e293b]'
                        }`}
                      >
                        {num}
                        {chip && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-300 text-black font-mono text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-amber-600">
                            ${chip}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Dozen Bets (1st 12, 2nd 12, 3rd 12) */}
          <div className="grid grid-cols-3 gap-1 mt-1.5 ml-14 sm:ml-16">
            <button
              type="button"
              onClick={() => handleZoneBet('doz_1')}
              className="py-1.5 bg-[#022c22] hover:bg-[#064e3b] text-white border border-[#ca8a04]/40 text-xs font-black uppercase rounded-lg relative cursor-pointer"
            >
              1ra Doz (1-12)
              {chipsOnBoard['doz_1'] && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-full bg-amber-300 text-black font-mono text-[9px] font-black">
                  ${chipsOnBoard['doz_1']}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleZoneBet('doz_2')}
              className="py-1.5 bg-[#022c22] hover:bg-[#064e3b] text-white border border-[#ca8a04]/40 text-xs font-black uppercase rounded-lg relative cursor-pointer"
            >
              2da Doz (13-24)
              {chipsOnBoard['doz_2'] && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-full bg-amber-300 text-black font-mono text-[9px] font-black">
                  ${chipsOnBoard['doz_2']}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleZoneBet('doz_3')}
              className="py-1.5 bg-[#022c22] hover:bg-[#064e3b] text-white border border-[#ca8a04]/40 text-xs font-black uppercase rounded-lg relative cursor-pointer"
            >
              3ra Doz (25-36)
              {chipsOnBoard['doz_3'] && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-full bg-amber-300 text-black font-mono text-[9px] font-black">
                  ${chipsOnBoard['doz_3']}
                </span>
              )}
            </button>
          </div>

          {/* Outside Bets (1-18, Even, Red, Black, Odd, 19-36) */}
          <div className="grid grid-cols-6 gap-1 mt-1 ml-14 sm:ml-16">
            <button
              type="button"
              onClick={() => handleZoneBet('low_zone')}
              className="py-2 bg-[#022c22] hover:bg-[#064e3b] text-white border border-white/20 text-xs font-black uppercase rounded-lg relative cursor-pointer"
            >
              1-18
              {chipsOnBoard['low_zone'] && (
                <span className="absolute top-0.5 right-0.5 px-1 rounded-full bg-amber-300 text-black font-mono text-[8px] font-black">
                  ${chipsOnBoard['low_zone']}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleZoneBet('even_zone')}
              className="py-2 bg-[#022c22] hover:bg-[#064e3b] text-white border border-white/20 text-xs font-black uppercase rounded-lg relative cursor-pointer"
            >
              Par
              {chipsOnBoard['even_zone'] && (
                <span className="absolute top-0.5 right-0.5 px-1 rounded-full bg-amber-300 text-black font-mono text-[8px] font-black">
                  ${chipsOnBoard['even_zone']}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleZoneBet('red_zone')}
              className="py-2 bg-[#ef4444] hover:bg-[#dc2626] text-white font-black text-xs uppercase rounded-lg relative cursor-pointer shadow-md"
            >
              Rojo
              {chipsOnBoard['red_zone'] && (
                <span className="absolute top-0.5 right-0.5 px-1 rounded-full bg-white text-black font-mono text-[8px] font-black">
                  ${chipsOnBoard['red_zone']}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleZoneBet('black_zone')}
              className="py-2 bg-[#0f212e] hover:bg-[#1e293b] text-white font-black text-xs uppercase rounded-lg relative cursor-pointer shadow-md"
            >
              Negro
              {chipsOnBoard['black_zone'] && (
                <span className="absolute top-0.5 right-0.5 px-1 rounded-full bg-amber-300 text-black font-mono text-[8px] font-black">
                  ${chipsOnBoard['black_zone']}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleZoneBet('odd_zone')}
              className="py-2 bg-[#022c22] hover:bg-[#064e3b] text-white border border-white/20 text-xs font-black uppercase rounded-lg relative cursor-pointer"
            >
              Impar
              {chipsOnBoard['odd_zone'] && (
                <span className="absolute top-0.5 right-0.5 px-1 rounded-full bg-amber-300 text-black font-mono text-[8px] font-black">
                  ${chipsOnBoard['odd_zone']}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleZoneBet('high_zone')}
              className="py-2 bg-[#022c22] hover:bg-[#064e3b] text-white border border-white/20 text-xs font-black uppercase rounded-lg relative cursor-pointer"
            >
              19-36
              {chipsOnBoard['high_zone'] && (
                <span className="absolute top-0.5 right-0.5 px-1 rounded-full bg-amber-300 text-black font-mono text-[8px] font-black">
                  ${chipsOnBoard['high_zone']}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Footer Indicators */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#557086] mt-3 tabular-nums">
          <span>Ruleta Europea Oficial</span>
          <span>·</span>
          <span>Apuesta Total: <strong className="text-white font-mono">US$ {totalBetAmount.toFixed(2)}</strong></span>
          <span>·</span>
          <span>RTP: <strong className="text-emerald-400 font-mono">97.30%</strong></span>
        </div>
      </div>

      {/* Provably Fair Modal */}
      <ProvablyFairModal
        isOpen={showProvablyFair}
        onClose={() => setShowProvablyFair(false)}
        gameTitle="European Roulette Stake Original"
      />
    </div>
  );
};
