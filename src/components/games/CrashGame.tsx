import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { ParticleSystem } from '../../utils/particles';
import { showToast } from '../../utils/toast';
import { UniversalStakeControl } from './UniversalStakeControl';
import { ProvablyFairModal } from '../modals/ProvablyFairModal';
import { ProvablyFairService } from '../../services/ProvablyFairService';
import { Volume2, VolumeX, Users } from 'lucide-react';

interface CrashGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordBet: (betAmount: number, multiplier: number, payout: number, isWin: boolean) => void;
}

interface LivePlayerBet {
  user: string;
  bet: number;
  cashedOutAt?: number;
  payout?: number;
}

export const CrashGame: React.FC<CrashGameProps> = ({
  balance,
  onUpdateBalance,
  onRecordBet,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashout, setAutoCashout] = useState<number>(2.0);
  const [gameState, setGameState] = useState<'idle' | 'countdown' | 'running' | 'crashed'>('idle');
  const [countdown, setCountdown] = useState<number>(3);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [hasCashedOut, setHasCashedOut] = useState<boolean>(false);
  const [cashedOutAt, setCashedOutAt] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([1.42, 3.85, 1.15, 14.2, 2.05, 1.02, 5.4, 2.8]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showProvablyFair, setShowProvablyFair] = useState<boolean>(false);
  const [serverSeed, setServerSeed] = useState<string>(() => ProvablyFairService.generateServerSeed());
  const [clientSeed, setClientSeed] = useState<string>('crash_client_33');
  const [nonce, setNonce] = useState<number>(1);

  // Simulated live community betting table for high Stake realism
  const [liveBets, setLiveBets] = useState<LivePlayerBet[]>([
    { user: 'AstedPro', bet: 50 },
    { user: 'Satoshi_99', bet: 25 },
    { user: 'VipWhale', bet: 200 },
    { user: 'NeonRider', bet: 15 },
    { user: 'CryptoKing', bet: 120 },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const crashPointRef = useRef<number>(2.0);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());

  const startRound = () => {
    if (betAmount <= 0) return;
    if (betAmount > balance) {
      showToast('Saldo insuficiente. Añade fondos desde tu cartera.', 'error');
      return;
    }

    onUpdateBalance(balance - betAmount);

    // Cryptographic Provably Fair deterministic calculation (99% RTP)
    const pfOutcome = ProvablyFairService.generateOutcome(serverSeed, clientSeed, nonce);
    const point = ProvablyFairService.getLimboCrashResult(pfOutcome.float, 0.01);
    setNonce((n) => n + 1);
    crashPointRef.current = point;

    // Reset community live bets for the new round
    setLiveBets([
      { user: 'Tú (Asted)', bet: betAmount },
      { user: 'Satoshi_99', bet: 25 },
      { user: 'VipWhale', bet: 200 },
      { user: 'NeonRider', bet: 15 },
      { user: 'CryptoKing', bet: 120 },
    ]);

    setGameState('countdown');
    setCountdown(3);
    setHasCashedOut(false);
    setCashedOutAt(0);

    let count = 3;
    const interval = setInterval(() => {
      count--;
      sounds.playSpinTick();
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setMultiplier(1.0);
        setGameState('running');
        startTimeRef.current = performance.now();
      }
    }, 650);
  };

  const handleCashout = () => {
    if (gameState !== 'running' || hasCashedOut) return;

    const currentM = multiplier;
    const payout = parseFloat((betAmount * currentM).toFixed(2));

    setHasCashedOut(true);
    setCashedOutAt(currentM);
    sounds.playCashout();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    onUpdateBalance(balance + payout);
    onRecordBet(betAmount, currentM, payout, true);

    // Update community table
    setLiveBets((prev) =>
      prev.map((b) => (b.user.startsWith('Tú') ? { ...b, cashedOutAt: currentM, payout } : b))
    );
  };

  // -------------------------------------------------------------
  // Crash Render Loop: Logarithmic Panning Camera + Titanic Multiplier
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = (now: number) => {
      if (!running) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Grid background lines
      ctx.strokeStyle = '#1a2c38';
      ctx.lineWidth = 1;
      for (let x = 40; x < width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 30);
        ctx.stroke();
      }
      for (let y = height - 30; y > 20; y -= 50) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // X and Y Axis lines
      ctx.strokeStyle = '#213743';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 10);
      ctx.lineTo(40, height - 30);
      ctx.lineTo(width - 10, height - 30);
      ctx.stroke();

      if (gameState === 'running') {
        const elapsed = (now - startTimeRef.current) / 1000;
        // Exponential multiplier curve: e^(0.06 * elapsed)
        const currentM = Math.max(1.0, parseFloat(Math.exp(0.075 * elapsed).toFixed(2)));
        setMultiplier(currentM);

        // Community players auto-cashouts
        if (Math.random() < 0.04) {
          setLiveBets((prev) =>
            prev.map((b) => {
              if (!b.cashedOutAt && !b.user.startsWith('Tú') && currentM > 1.3 && Math.random() < 0.25) {
                return { ...b, cashedOutAt: currentM, payout: parseFloat((b.bet * currentM).toFixed(2)) };
              }
              return b;
            })
          );
        }

        // Auto cashout trigger for user
        if (!hasCashedOut && autoCashout > 1.0 && currentM >= autoCashout) {
          handleCashout();
        }

        // Crash check
        if (currentM >= crashPointRef.current) {
          setGameState('crashed');
          sounds.playBombExplosion();
          setHistory((prev) => [crashPointRef.current, ...prev.slice(0, 7)]);
          if (!hasCashedOut) {
            onRecordBet(betAmount, 0, 0, false);
          }
        }

        // ---------------------------------------------------------
        // Logarithmic Zoom-Out & Auto-Panning
        // scaleX = width / log(e + elapsed), scaleY = height / multiplier
        // ---------------------------------------------------------
        const progressT = Math.log(Math.E + elapsed * 0.8) / Math.log(Math.E + 12);
        const normProgress = Math.min(0.9, progressT);

        const startX = 40;
        const startY = height - 30;
        const rocketX = startX + (width - 70) * normProgress;
        const curveHeightRatio = Math.min(0.85, (currentM - 1) / Math.max(currentM * 1.2, 4));
        const rocketY = startY - (height - 60) * curveHeightRatio;

        // Draw translucent green/cyan gradient fill under curve
        const areaGrad = ctx.createLinearGradient(0, rocketY, 0, startY);
        areaGrad.addColorStop(0, 'rgba(0, 231, 1, 0.25)');
        areaGrad.addColorStop(1, 'rgba(0, 231, 1, 0.0)');

        ctx.fillStyle = areaGrad;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(startX + (rocketX - startX) * 0.5, startY, rocketX, rocketY);
        ctx.lineTo(rocketX, startY);
        ctx.closePath();
        ctx.fill();

        // Stroke line
        ctx.strokeStyle = '#00e701';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#00e701';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(startX + (rocketX - startX) * 0.5, startY, rocketX, rocketY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw rocket head with thruster flame
        ctx.beginPath();
        ctx.arc(rocketX, rocketY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00e701';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        particlesRef.current.emitThrusterFlame(rocketX - 2, rocketY + 2, -Math.PI / 4);
      } else if (gameState === 'crashed') {
        // Red dashed line to crash point
        const startX = 40;
        const startY = height - 30;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(startX + (width - 100) * 0.5, startY, width - 80, 50);
        ctx.stroke();
      }

      particlesRef.current.update();
      particlesRef.current.draw(ctx);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, autoCashout, hasCashedOut, betAmount]);

  // Dynamic color for Titanic Multiplier
  const getMultiplierTextColor = () => {
    if (gameState === 'crashed') return 'text-red-500';
    if (multiplier >= 50) return 'text-rose-400 drop-shadow-[0_0_20px_#f43f5e]';
    if (multiplier >= 10) return 'text-amber-300 drop-shadow-[0_0_15px_#facc15]';
    if (multiplier >= 2) return 'text-[#00e701] drop-shadow-[0_0_12px_#00e701]';
    return 'text-white';
  };

  return (
    <div className="flex flex-col lg:flex-row bg-[#0f212e] rounded-2xl overflow-hidden border border-[#213743] shadow-2xl">
      {/* Universal Stake Canonical Control Panel */}
      <UniversalStakeControl
        balance={balance}
        betAmount={betAmount}
        onChangeBetAmount={setBetAmount}
        onAction={() => (gameState === 'running' ? handleCashout() : startRound())}
        actionLabel={
          gameState === 'running'
            ? hasCashedOut
              ? `Retirado (${cashedOutAt.toFixed(2)}x)`
              : `Retirar (US$ ${(betAmount * multiplier).toFixed(2)})`
            : gameState === 'countdown'
            ? `Iniciando en ${countdown}s...`
            : 'Apostar'
        }
        actionDisabled={
          (gameState === 'running' && hasCashedOut) ||
          gameState === 'countdown' ||
          (gameState !== 'running' && (betAmount > balance || betAmount <= 0))
        }
        onOpenProvablyFair={() => setShowProvablyFair(true)}
        enableHotkeys={true}
        gameId="crash"
      >
        {/* Auto Cashout Input */}
        <div>
          <div className="flex justify-between text-xs text-[#b1bad3] mb-1.5 font-semibold">
            <span>Auto-Retiro</span>
            <span className="font-mono text-white tabular-nums">{autoCashout.toFixed(2)}x</span>
          </div>
          <div className="relative flex items-center">
            <input
              type="number"
              min="1.01"
              step="0.1"
              disabled={gameState === 'running'}
              value={autoCashout}
              onChange={(e) => setAutoCashout(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
              className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#00e701] rounded-lg py-2.5 pl-3 pr-8 text-sm font-semibold text-white focus:outline-none transition-colors font-mono tabular-nums disabled:opacity-50"
            />
            <span className="absolute right-3 text-xs text-[#557086] font-bold">x</span>
          </div>
        </div>
      </UniversalStakeControl>

      {/* Arena Canvas + Community Bets Table (Right) */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between relative bg-[#0f212e]">
        {/* Top Bar with History Pills */}
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[#213743]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {history.map((h, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border tabular-nums ${
                  h >= 10
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : h >= 2
                    ? 'bg-[#00e701]/20 text-[#00e701] border-[#00e701]/40'
                    : 'bg-[#213743] text-[#b1bad3] border-[#2f4553]'
                }`}
              >
                {h.toFixed(2)}x
              </span>
            ))}
          </div>

          <button
            onClick={() => {
              sounds.enabled = !soundEnabled;
              setSoundEnabled(!soundEnabled);
            }}
            className="text-[#b1bad3] hover:text-white p-1.5 rounded-lg hover:bg-[#213743] transition-colors ml-2"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        {/* Canvas Display with Centered Titanic Multiplier */}
        <div className="relative w-full aspect-[500/310] rounded-2xl overflow-hidden border border-[#213743] bg-[#0f212e] shadow-inner flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={500}
            height={310}
            className="absolute inset-0 w-full h-full block"
          />

          {/* Titanic Multiplier with Anti-Jitter Tabular Numerals */}
          <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none select-none">
            {gameState === 'countdown' ? (
              <div className="text-center animate-in zoom-in-75">
                <span className="text-xs uppercase font-black tracking-widest text-[#557086] block">
                  Próxima ronda en
                </span>
                <span className="text-6xl font-black font-mono text-[#00e701] tabular-nums">
                  {countdown}s
                </span>
              </div>
            ) : (
              <div className="text-center">
                <span className={`text-6xl sm:text-7xl font-black font-mono tabular-nums tracking-tighter ${getMultiplierTextColor()}`}>
                  {gameState === 'crashed'
                    ? `${crashPointRef.current.toFixed(2)}x`
                    : `${multiplier.toFixed(2)}x`}
                </span>
                {gameState === 'crashed' && (
                  <span className="text-xs uppercase font-black tracking-widest text-red-400 block mt-1 animate-pulse">
                    ¡ESTRELLADO!
                  </span>
                )}
                {hasCashedOut && (
                  <span className="text-xs uppercase font-black tracking-widest text-[#00e701] block mt-1">
                    Retiraste a {cashedOutAt.toFixed(2)}x
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live Community Table */}
        <div className="mt-3 bg-[#1a2c38] rounded-xl border border-[#213743] p-2.5">
          <div className="flex items-center justify-between text-xs text-[#557086] font-semibold px-2 pb-1.5 border-b border-[#213743]">
            <span className="flex items-center gap-1.5"><Users size={12} /> Jugadores en Vivo ({liveBets.length})</span>
            <span>Multiplicador / Cobro</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5">
            {liveBets.map((p, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between text-xs px-2.5 py-1 rounded-lg tabular-nums border ${
                  p.cashedOutAt
                    ? 'bg-[#00e701]/10 border-[#00e701]/30 text-white'
                    : 'bg-[#0f212e] border-transparent text-[#b1bad3]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e701]" />
                  <span className="font-medium text-[11px] truncate max-w-[90px]">{p.user}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span>US$ {p.bet}</span>
                  {p.cashedOutAt ? (
                    <span className="text-[#00e701] font-bold">
                      {p.cashedOutAt.toFixed(2)}x (+US$ {p.payout?.toFixed(2)})
                    </span>
                  ) : (
                    <span className="text-[#557086]">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provably Fair Modal */}
      <ProvablyFairModal
        isOpen={showProvablyFair}
        onClose={() => setShowProvablyFair(false)}
        gameTitle="Crash Stake Original"
      />
    </div>
  );
};
