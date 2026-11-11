import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { ParticleSystem } from '../../utils/particles';
import { showToast } from '../../utils/toast';
import {
  Volume2,
  VolumeX,
  ShieldCheck,
  Play,
  Sparkles,
  Zap,
  Flame,
  Crown,
  Trophy,
  RotateCw,
  Compass,
  ArrowRight,
  Info,
  X,
  Star,
  Coins,
} from 'lucide-react';
import { SlotSymbolVector } from './SlotSymbolsVector';
import { ProvablyFairModal } from '../modals/ProvablyFairModal';

interface SlotsGameProps {
  balance: number;
  gameTitle?: string;
  onUpdateBalance: (newBalance: number) => void;
  onRecordBet: (betAmount: number, multiplier: number, payout: number, isWin: boolean) => void;
}

type SlotTheme = 'buffalo' | 'anubis' | 'zeus';

interface SlotSymbol {
  id: string;
  name: string;
  char: string;
  mult: number;
  color: string;
  glow: string;
}

const THEME_SYMBOLS: Record<SlotTheme, SlotSymbol[]> = {
  buffalo: [
    { id: 'buffalo', name: 'Búfalo Dorado', char: '🦬', mult: 50, color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.8)' },
    { id: 'eagle', name: 'Águila Calva', char: '🦅', mult: 25, color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.7)' },
    { id: 'cougar', name: 'Puma del Cañón', char: '🐆', mult: 15, color: '#ea580c', glow: 'rgba(234, 88, 12, 0.6)' },
    { id: 'wolf', name: 'Lobo Solitario', char: '🐺', mult: 10, color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.6)' },
    { id: 'cactus', name: 'Cactus del Desierto', char: '🌵', mult: 6, color: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)' },
    { id: 'horseshoe', name: 'Herradura de Oro', char: '🧲', mult: 4, color: '#eab308', glow: 'rgba(234, 179, 8, 0.5)' },
    { id: 'skull', name: 'Cráneo Ancestral', char: '💀', mult: 3, color: '#f8fafc', glow: 'rgba(248, 250, 252, 0.4)' },
    { id: 'coin', name: 'Moneda Hold&Win', char: '🪙', mult: 2, color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.9)' },
  ],
  anubis: [
    { id: 'anubis', name: 'Furia de Anubis', char: '🏺', mult: 50, color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.9)' },
    { id: 'scarab', name: 'Escarabajo Alado', char: '🪲', mult: 25, color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.7)' },
    { id: 'eye', name: 'Ojo de Horus', char: '👁️', mult: 15, color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.6)' },
    { id: 'pyramid', name: 'Pirámide Dorada', char: '🔺', mult: 10, color: '#facc15', glow: 'rgba(250, 204, 21, 0.6)' },
    { id: 'scepter', name: 'Cetro Faraónico', char: '🪄', mult: 6, color: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' },
    { id: 'scroll', name: 'Papiro Sagrado', char: '📜', mult: 4, color: '#fed7aa', glow: 'rgba(254, 215, 170, 0.5)' },
    { id: 'ankh', name: 'Cruz Anj de Vida', char: '☥', mult: 3, color: '#e2e8f0', glow: 'rgba(226, 232, 240, 0.5)' },
    { id: 'ruby', name: 'Rubí del Faraón', char: '💎', mult: 2, color: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
  ],
  zeus: [
    { id: 'zeus', name: 'Rayo de Zeus', char: '⚡', mult: 50, color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.9)' },
    { id: 'crown', name: 'Corona del Olimpo', char: '👑', mult: 25, color: '#facc15', glow: 'rgba(250, 204, 21, 0.7)' },
    { id: 'hourglass', name: 'Reloj del Destino', char: '⌛', mult: 15, color: '#fb923c', glow: 'rgba(251, 146, 60, 0.6)' },
    { id: 'ring', name: 'Sortija Mágica', char: '💍', mult: 10, color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.6)' },
    { id: 'chalice', name: 'Cáliz Sagrado', char: '🏆', mult: 6, color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)' },
    { id: 'ruby', name: 'Gema Roja', char: '🔴', mult: 4, color: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
    { id: 'amethyst', name: 'Gema Púrpura', char: '🟣', mult: 3, color: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
    { id: 'sapphire', name: 'Gema Azul', char: '🔷', mult: 2, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
  ],
};

const THEME_CONFIGS: Record<SlotTheme, {
  title: string;
  provider: string;
  rtp: number;
  bgGradient: string;
  accentColor: string;
  bannerTitle: string;
  story: string;
  jackpots: { grand: string; major: string; mini: string };
}> = {
  buffalo: {
    title: 'Booming Buffalo Hold & Win Extreme',
    provider: 'Booming Games',
    rtp: 96.7,
    bgGradient: 'from-amber-950/80 via-[#1a2c38] to-[#0f212e]',
    accentColor: '#f59e0b',
    bannerTitle: 'HOLD AND WIN EXTREME 10,000×',
    story: 'Los majestuosos búfalos dorados recorren las llanuras ardientes del Gran Cañón. Desbloquea la Rueda Buffalo Bonus y llena la cuadrícula con monedas de oro para llevarte el Grand Jackpot de 10,000× tu apuesta.',
    jackpots: { grand: '10,000×', major: '100×', mini: '25×' },
  },
  anubis: {
    title: 'Fury of Anubis Ancient Tomb',
    provider: 'Pragmatic Play',
    rtp: 96.5,
    bgGradient: 'from-yellow-950/80 via-[#1a2c38] to-[#0f212e]',
    accentColor: '#eab308',
    bannerTitle: 'TUMBA DORADA DEL FARAÓN',
    story: 'En las cámaras secretas bajo las arenas de Giza, el dios Anubis custodia tesoros milenarios. Los cetros y escarabajos desatan orbes multiplicadores que caen en cascada sobre los rodillos.',
    jackpots: { grand: '5,000×', major: '250×', mini: '50×' },
  },
  zeus: {
    title: 'Gates of Asted 1000',
    provider: 'Asted Originals',
    rtp: 96.8,
    bgGradient: 'from-sky-950/80 via-[#1a2c38] to-[#0f212e]',
    accentColor: '#38bdf8',
    bannerTitle: 'PODER DE LOS DIOSES DEL OLIMPO',
    story: 'Zeus asciende con truenos deslumbrantes en las puertas sagradas del Olimpo. Cada caída acumula orbes multiplicadores de hasta 100× en la función de tiradas gratuitas.',
    jackpots: { grand: '15,000×', major: '500×', mini: '100×' },
  },
};

// 12 Slices on Buffalo Bonus Wheel
const WHEEL_SLICES = [
  { label: 'GRAND', mult: 10000, color: '#dc2626', bg: '#991b1b', text: '#ffffff' },
  { label: '4×', mult: 4, color: '#f59e0b', bg: '#78350f', text: '#fef08a' },
  { label: 'HOLD & WIN', mult: 50, color: '#fbbf24', bg: '#b45309', text: '#000000' },
  { label: '1×', mult: 1, color: '#94a3b8', bg: '#334155', text: '#ffffff' },
  { label: 'MAJOR', mult: 100, color: '#2563eb', bg: '#1e3a8a', text: '#ffffff' },
  { label: '3×', mult: 3, color: '#f59e0b', bg: '#78350f', text: '#fef08a' },
  { label: 'ALL COINS', mult: 20, color: '#10b981', bg: '#065f46', text: '#ffffff' },
  { label: 'MINI', mult: 25, color: '#16a34a', bg: '#14532d', text: '#ffffff' },
  { label: '2×', mult: 2, color: '#f59e0b', bg: '#78350f', text: '#fef08a' },
  { label: 'ALL COINS', mult: 20, color: '#10b981', bg: '#065f46', text: '#ffffff' },
  { label: '10×', mult: 10, color: '#f59e0b', bg: '#78350f', text: '#fef08a' },
  { label: 'EXTREME', mult: 250, color: '#a855f7', bg: '#581c87', text: '#ffffff' },
];

export const SlotsGame: React.FC<SlotsGameProps> = ({
  balance,
  gameTitle,
  onUpdateBalance,
  onRecordBet,
}) => {
  const initialTheme: SlotTheme = gameTitle?.toLowerCase().includes('anubis')
    ? 'anubis'
    : 'buffalo';

  const [activeTheme, setActiveTheme] = useState<SlotTheme>(initialTheme);
  const [betAmount, setBetAmount] = useState<number>(5);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [showSplashIntro, setShowSplashIntro] = useState<boolean>(true);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Bonus Game Modals
  const [showWheelBonus, setShowWheelBonus] = useState<boolean>(false);
  const [isWheelSpinning, setIsWheelSpinning] = useState<boolean>(false);
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [wheelWinSlice, setWheelWinSlice] = useState<typeof WHEEL_SLICES[0] | null>(null);

  // Hold and Win Extreme 4x5 Matrix mode
  const [showHoldAndWin, setShowHoldAndWin] = useState<boolean>(false);
  const [holdAndWinRespins, setHoldAndWinRespins] = useState<number>(3);
  const [holdAndWinGrid, setHoldAndWinGrid] = useState<(string | null)[]>(Array(20).fill(null));

  // Big Win Event overlay
  const [bigWinAmount, setBigWinAmount] = useState<number | null>(null);
  const [showProvablyFair, setShowProvablyFair] = useState<boolean>(false);

  const symbols = THEME_SYMBOLS[activeTheme];
  const config = THEME_CONFIGS[activeTheme];

  const [grid, setGrid] = useState<SlotSymbol[][]>([
    [symbols[1], symbols[4], symbols[7]],
    [symbols[2], symbols[0], symbols[5]],
    [symbols[3], symbols[1], symbols[6]],
    [symbols[4], symbols[5], symbols[2]],
    [symbols[0], symbols[3], symbols[1]],
  ]);

  const [lastWin, setLastWin] = useState<number>(0);
  const [multiplierBomb, setMultiplierBomb] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());
  const animFrameRef = useRef<number | null>(null);
  const wheelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync grid when theme changes
  useEffect(() => {
    const syms = THEME_SYMBOLS[activeTheme];
    setGrid([
      [syms[1], syms[4], syms[7]],
      [syms[2], syms[0], syms[5]],
      [syms[3], syms[1], syms[6]],
      [syms[4], syms[5], syms[2]],
      [syms[0], syms[3], syms[1]],
    ]);
  }, [activeTheme]);

  // Ambient VFX particles loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let active = true;
    const render = () => {
      if (!active) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.update();
      particlesRef.current.draw(ctx);
      animFrameRef.current = requestAnimationFrame(render);
    };
    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Draw 3D Buffalo Bonus Wheel on Canvas
  const drawWheel = useCallback((angle: number) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w * 0.45;

    ctx.clearRect(0, 0, w, h);

    // Outer 3D Gold Rim with metallic sheen
    ctx.save();
    ctx.translate(cx, cy);

    // Rim Outer Shadow
    ctx.beginPath();
    ctx.arc(0, 0, radius + 12, 0, Math.PI * 2);
    ctx.fillStyle = '#1e1b18';
    ctx.fill();

    // Metallic Gold Border
    const goldGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    goldGrad.addColorStop(0, '#fef08a');
    goldGrad.addColorStop(0.3, '#ca8a04');
    goldGrad.addColorStop(0.6, '#fef08a');
    goldGrad.addColorStop(1, '#854d0e');
    ctx.beginPath();
    ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = goldGrad;
    ctx.fill();

    // Slices
    const numSlices = WHEEL_SLICES.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    for (let i = 0; i < numSlices; i++) {
      const slice = WHEEL_SLICES[i];
      const startA = angle + i * sliceAngle;
      const endA = startA + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startA, endA);
      ctx.closePath();
      ctx.fillStyle = slice.bg;
      ctx.fill();

      // Slice inner bevel border
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Slice Text Label (Event-Driven Casino Typography)
      ctx.save();
      ctx.rotate(startA + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = slice.text;
      ctx.font = '900 13px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(slice.label, radius - 16, 5);
      ctx.restore();

      // Pegs on border
      const pegX = Math.cos(startA) * (radius + 2);
      const pegY = Math.sin(startA) * (radius + 2);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    // Center Golden Bull Cap
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fillStyle = goldGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#0f212e';
    ctx.fill();

    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦬', 0, 2);

    ctx.restore();

    // Top Golden Indicator Arrow
    ctx.save();
    ctx.translate(cx, cy - radius - 6);
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(-10, -6);
    ctx.lineTo(10, -6);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }, []);

  useEffect(() => {
    if (showWheelBonus) {
      drawWheel(wheelAngle);
    }
  }, [showWheelBonus, wheelAngle, drawWheel]);

  // Spin the 3D Buffalo Wheel with Inertial Physics
  const spinWheel = () => {
    if (isWheelSpinning) return;
    setIsWheelSpinning(true);
    setWheelWinSlice(null);

    const fullRotations = (5 + Math.floor(Math.random() * 4)) * Math.PI * 2;
    const targetSliceIndex = Math.floor(Math.random() * WHEEL_SLICES.length);
    const sliceAngle = (Math.PI * 2) / WHEEL_SLICES.length;
    // Arrow is at -Math.PI / 2
    const targetAngle = fullRotations + (-Math.PI / 2 - (targetSliceIndex * sliceAngle + sliceAngle / 2));

    const startTime = performance.now();
    const duration = 5000;
    const startAngle = wheelAngle % (Math.PI * 2);

    const animateWheel = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Quintic ease out for authentic casino deceleration
      const ease = 1 - Math.pow(1 - progress, 5);

      const currentA = startAngle + (targetAngle - startAngle) * ease;
      setWheelAngle(currentA);
      drawWheel(currentA);

      if (Math.floor(currentA * 4) !== Math.floor((currentA - 0.05) * 4)) {
        sounds.playSpinTick();
      }

      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      } else {
        setIsWheelSpinning(false);
        const winSlice = WHEEL_SLICES[targetSliceIndex];
        setWheelWinSlice(winSlice);

        const payout = parseFloat((betAmount * winSlice.mult).toFixed(2));
        sounds.playGoldenJackpot();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });

        onUpdateBalance(balance + payout);
        onRecordBet(betAmount, winSlice.mult, payout, true);

        if (winSlice.mult >= 50) {
          setBigWinAmount(payout);
        }
      }
    };

    requestAnimationFrame(animateWheel);
  };

  // Trigger Hold & Win Extreme 4x5 Bonus Respin Round
  const startHoldAndWinRound = () => {
    setShowHoldAndWin(true);
    setHoldAndWinRespins(3);
    const initialCoins = Array(20).fill(null);
    // Seed 4 initial gold coins
    const seedIndices = [2, 7, 11, 14];
    seedIndices.forEach((idx) => {
      initialCoins[idx] = ['4×', '10×', '16×', 'MINI'][Math.floor(Math.random() * 4)];
    });
    setHoldAndWinGrid(initialCoins);
  };

  const spinHoldAndWin = () => {
    if (holdAndWinRespins <= 0) return;

    sounds.playSpinTick();
    const newGrid = [...holdAndWinGrid];
    let newCoinAdded = false;

    // Check empty slots and randomly drop coins
    for (let i = 0; i < 20; i++) {
      if (!newGrid[i] && Math.random() < 0.28) {
        const coinTypes = ['2×', '4×', '8×', '10×', '16×', '20×', '30×', 'MINI 25×', 'MAJOR 100×'];
        if (Math.random() < 0.02) coinTypes.push('GRAND 10,000×');
        newGrid[i] = coinTypes[Math.floor(Math.random() * coinTypes.length)];
        newCoinAdded = true;
      }
    }

    if (newCoinAdded) {
      sounds.playCashout();
      setHoldAndWinRespins(3); // Reset lives!
    } else {
      setHoldAndWinRespins((r) => r - 1);
    }

    setHoldAndWinGrid(newGrid);

    // If out of respins or board full
    const totalCoins = newGrid.filter(Boolean).length;
    if (holdAndWinRespins - (newCoinAdded ? 0 : 1) === 0 || totalCoins === 20) {
      // Calculate total payout from all coins
      let totalMult = 0;
      newGrid.forEach((coin) => {
        if (!coin) return;
        if (coin.includes('GRAND')) totalMult += 10000;
        else if (coin.includes('MAJOR')) totalMult += 100;
        else if (coin.includes('MINI')) totalMult += 25;
        else totalMult += parseInt(coin) || 4;
      });

      const totalPayout = parseFloat((betAmount * totalMult).toFixed(2));
      setTimeout(() => {
        sounds.playGoldenJackpot();
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
        onUpdateBalance(balance + totalPayout);
        onRecordBet(betAmount, totalMult, totalPayout, true);
        setBigWinAmount(totalPayout);
      }, 500);
    }
  };

  // Standard Main Slot Spin
  const spin = () => {
    if (betAmount <= 0) return;
    if (betAmount > balance && freeSpinsLeft === 0) {
      showToast('Saldo insuficiente. Añade fondos desde tu cartera de Asted.', 'error');
      return;
    }

    if (freeSpinsLeft === 0) {
      onUpdateBalance(balance - betAmount);
    } else {
      setFreeSpinsLeft((prev) => prev - 1);
    }

    setIsSpinning(true);
    setLastWin(0);
    setMultiplierBomb(null);
    sounds.playSpinTick();

    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      sounds.playSpinTick();
      const randomGrid = Array(5).fill(null).map(() =>
        Array(3).fill(null).map(() => symbols[Math.floor(Math.random() * symbols.length)])
      );
      setGrid(randomGrid);

      if (ticks >= 10) {
        clearInterval(interval);

        const finalGrid = Array(5).fill(null).map(() =>
          Array(3).fill(null).map(() => symbols[Math.floor(Math.random() * symbols.length)])
        );

        const counts: Record<string, number> = {};
        finalGrid.forEach((col) => col.forEach((sym) => {
          counts[sym.id] = (counts[sym.id] || 0) + 1;
        }));

        let baseWinMult = 0;
        const topSymbolCount = counts[symbols[0].id] || 0;
        const coinCount = counts['coin'] || 0;

        Object.entries(counts).forEach(([symId, count]) => {
          const sym = symbols.find((s) => s.id === symId);
          if (sym && count >= 4) {
            baseWinMult += (sym.mult * (count - 3) * 0.85);
          }
        });

        // 3D Multiplier Orbs
        let bomb: number | null = null;
        if (Math.random() < 0.35 || baseWinMult > 0) {
          const bombs = [2, 3, 5, 10, 25, 50, 100];
          bomb = bombs[Math.floor(Math.random() * bombs.length)];
          setMultiplierBomb(bomb);
        }

        // Trigger Free Spins
        if (topSymbolCount >= 4) {
          setFreeSpinsLeft((prev) => prev + 10);
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        }

        // Trigger Buffalo Bonus Wheel or Hold & Win
        if (coinCount >= 3 && activeTheme === 'buffalo') {
          setTimeout(() => {
            setShowWheelBonus(true);
          }, 600);
        }

        if (baseWinMult === 0 && Math.random() < 0.45) {
          baseWinMult = parseFloat((1.6 + Math.random() * 3.5).toFixed(2));
        }

        const finalTotalMult = bomb ? baseWinMult * bomb : baseWinMult;
        const payout = parseFloat((betAmount * finalTotalMult).toFixed(2));

        setGrid(finalGrid);
        setIsSpinning(false);
        setLastWin(payout);

        const canvas = canvasRef.current;
        if (canvas) {
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          if (bomb) {
            particlesRef.current.emitSparkles(cx, cy, 35, [config.accentColor, '#fef08a', '#ffffff']);
          }
          if (finalTotalMult > 0) {
            particlesRef.current.emitCoins(cx, cy, 35);
            particlesRef.current.emitSparkles(cx, cy, 30, [config.accentColor, '#00e701', '#ffffff']);
          }
        }

        if (finalTotalMult > 0) {
          sounds.playCashout();
          if (finalTotalMult >= 20) {
            setBigWinAmount(payout);
          }
          onUpdateBalance(balance - (freeSpinsLeft > 0 ? 0 : betAmount) + payout);
          onRecordBet(betAmount, finalTotalMult, payout, true);
        } else {
          onRecordBet(betAmount, 0, 0, false);
        }
      }
    }, 90);
  };

  return (
    <div className="relative flex flex-col bg-[#0f212e] rounded-2xl overflow-hidden border border-[#213743] shadow-2xl">
      {/* Event-Driven Big Win Casino Celebration Modal */}
      {bigWinAmount !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in zoom-in-95">
          <div className="relative max-w-lg w-full bg-gradient-to-b from-amber-600 via-[#1a2c38] to-[#0f212e] p-8 rounded-3xl border-4 border-amber-400 text-center shadow-[0_0_60px_rgba(245,158,11,0.6)]">
            <div className="animate-bounce">
              <span className="text-amber-300 font-black text-2xl uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(245,158,11,0.8)]">
                ★ ¡GRAN PREMIO ÉPICO! ★
              </span>
            </div>

            <p className="text-4xl sm:text-5xl font-black text-white font-mono my-4 tracking-tight filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              +US$ {bigWinAmount.toFixed(2)}
            </p>

            <p className="text-xs text-amber-200 uppercase tracking-widest font-bold mb-6">
              ¡RECOMPENSA DE ORO ACREDITADA A TU CARTERA ASTED!
            </p>

            <button
              onClick={() => setBigWinAmount(null)}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-base uppercase rounded-2xl tracking-wider shadow-xl transition-all transform active:scale-95"
            >
              Recoger Ganancias
            </button>
          </div>
        </div>
      )}

      {/* Interactive Buffalo Bonus Wheel Modal */}
      {showWheelBonus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-xl w-full bg-gradient-to-b from-amber-950 via-[#1a2c38] to-[#0f212e] p-6 rounded-3xl border-2 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.4)] flex flex-col items-center">
            <button
              onClick={() => setShowWheelBonus(false)}
              className="absolute top-4 right-4 text-[#b1bad3] hover:text-white p-1 rounded-lg"
            >
              <X size={22} />
            </button>

            <div className="text-center mb-4">
              <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-widest shadow">
                BONUS ACTIVADO
              </span>
              <h3 className="text-2xl font-black text-amber-300 uppercase tracking-wider mt-1 drop-shadow">
                RUEDA BUFFALO BONUS 10,000×
              </h3>
              <p className="text-xs text-[#b1bad3]">
                Haz girar la rueda para ganar multiplicadores instantáneos o desbloquear el Hold & Win Extreme.
              </p>
            </div>

            {/* 3D Wheel Canvas */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 my-2">
              <canvas
                ref={wheelCanvasRef}
                width={320}
                height={320}
                className="w-full h-full block"
              />
            </div>

            {/* Win announcement */}
            {wheelWinSlice && (
              <div className="my-3 p-3 bg-amber-400/20 border border-amber-400 rounded-xl text-center animate-pulse">
                <span className="text-xs text-amber-300 font-bold block uppercase">
                  Premio Obtenido:
                </span>
                <span className="text-xl font-black text-white font-mono">
                  {wheelWinSlice.label} ({wheelWinSlice.mult}×)
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="w-full flex gap-3 mt-3">
              <button
                onClick={spinWheel}
                disabled={isWheelSpinning}
                className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-base uppercase rounded-2xl tracking-wider transition-all transform active:scale-95 shadow-lg shadow-amber-500/40 disabled:opacity-50"
              >
                {isWheelSpinning ? 'Girando la Rueda...' : 'GIRAR LA RUEDA'}
              </button>
              <button
                onClick={startHoldAndWinRound}
                className="px-4 py-4 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white font-bold text-xs uppercase rounded-2xl transition-colors"
                title="Probar función Hold & Win"
              >
                Hold & Win
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold and Win Extreme 4x5 Matrix Modal */}
      {showHoldAndWin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-gradient-to-b from-amber-950 via-[#1a2c38] to-[#0f212e] p-6 rounded-3xl border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)] flex flex-col items-center">
            <button
              onClick={() => setShowHoldAndWin(false)}
              className="absolute top-4 right-4 text-[#b1bad3] hover:text-white p-1 rounded-lg"
            >
              <X size={22} />
            </button>

            {/* Jackpots Ticker */}
            <div className="flex gap-2 sm:gap-3 mb-4">
              <div className="bg-red-600 px-3 py-1 rounded-xl text-center shadow">
                <span className="block text-[9px] font-black text-red-200">GRAND</span>
                <span className="font-mono text-xs font-black text-white">10,000×</span>
              </div>
              <div className="bg-blue-600 px-3 py-1 rounded-xl text-center shadow">
                <span className="block text-[9px] font-black text-blue-200">MAJOR</span>
                <span className="font-mono text-xs font-black text-white">100×</span>
              </div>
              <div className="bg-emerald-600 px-3 py-1 rounded-xl text-center shadow">
                <span className="block text-[9px] font-black text-emerald-200">MINI</span>
                <span className="font-mono text-xs font-black text-white">25×</span>
              </div>
            </div>

            <div className="text-center mb-3">
              <h3 className="text-xl sm:text-2xl font-black text-amber-300 uppercase tracking-wider drop-shadow">
                HOLD AND WIN EXTREME
              </h3>
              <p className="text-xs text-[#b1bad3]">
                Respins restantes: <span className="text-amber-400 font-black text-sm">{holdAndWinRespins}</span> (cada moneda reinicia a 3)
              </p>
            </div>

            {/* 4x5 Metallic Gold Coin Matrix */}
            <div className="grid grid-cols-5 gap-2 p-3 bg-black/60 rounded-2xl border-2 border-amber-500/40 w-full max-w-lg my-2">
              {holdAndWinGrid.map((coin, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center transition-all ${
                    coin
                      ? 'bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 text-black border-amber-300 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-in zoom-in-75 font-black text-xs font-mono'
                      : 'bg-[#1a2c38]/40 border-[#2f4553]/40'
                  }`}
                >
                  {coin ? (
                    <>
                      <SlotSymbolVector id="coin" size={28} />
                      <span className="text-[10px] leading-none mt-0.5 font-black text-amber-200">{coin}</span>
                    </>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  )}
                </div>
              ))}
            </div>

            {/* Action */}
            <button
              onClick={spinHoldAndWin}
              disabled={holdAndWinRespins <= 0}
              className="w-full max-w-xs mt-4 py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-sm uppercase rounded-2xl tracking-wider transition-all transform active:scale-95 shadow-xl disabled:opacity-50"
            >
              {holdAndWinRespins > 0 ? 'TIRAR RESPINS' : 'RONDA FINALIZADA'}
            </button>
          </div>
        </div>
      )}

      {/* Cinematic Splash / Intro Lore Screen */}
      {showSplashIntro && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-between p-6 sm:p-8 bg-gradient-to-b from-[#1a2c38] via-[#0f212e] to-[#07131b] animate-in fade-in duration-300">
          <div className="w-full max-w-4xl flex items-center justify-between pb-4 border-b border-[#213743]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-pulse" />
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider drop-shadow-md">
                  {config.title}
                </h2>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">
                  {config.provider} · {config.bannerTitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0f212e] p-1 rounded-xl border border-[#213743]">
              <button
                onClick={() => setActiveTheme('buffalo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTheme === 'buffalo'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-[#b1bad3] hover:text-white'
                }`}
              >
                🦬 Buffalo 10,000×
              </button>
              <button
                onClick={() => setActiveTheme('anubis')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTheme === 'anubis'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-[#b1bad3] hover:text-white'
                }`}
              >
                🏺 Anubis
              </button>
              <button
                onClick={() => setActiveTheme('zeus')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTheme === 'zeus'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-[#b1bad3] hover:text-white'
                }`}
              >
                ⚡ Gates 1000
              </button>
            </div>
          </div>

          {/* Cards Display */}
          <div className="w-full max-w-4xl my-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="relative p-5 rounded-2xl bg-gradient-to-b from-amber-600/20 via-[#1a2c38] to-[#0f212e] border-2 border-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.2)] flex flex-col items-center text-center overflow-hidden">
              <div className="absolute top-2 left-2 flex gap-1">
                <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow">
                  GRAND {config.jackpots.grand}
                </span>
                <span className="bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow">
                  MAJOR {config.jackpots.major}
                </span>
                <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow">
                  MINI {config.jackpots.mini}
                </span>
              </div>

              <div className="w-36 h-36 my-4 rounded-full border-4 border-amber-400 bg-gradient-to-tr from-amber-700 via-yellow-500 to-amber-300 flex items-center justify-center relative shadow-2xl animate-[spin_25s_linear_infinite]">
                <div className="w-16 h-16 rounded-full bg-[#0f212e] border-2 border-amber-300 flex items-center justify-center p-1 shadow-inner">
                  <SlotSymbolVector id={symbols[0].id} size={36} />
                </div>
              </div>

              <h3 className="text-lg font-black text-amber-300 tracking-wider uppercase mb-1">
                {activeTheme === 'buffalo' ? 'BUFFALO BONUS WHEEL' : activeTheme === 'anubis' ? 'LA RUEDA DE ANUBIS' : 'RUEDA DEL OLIMPO'}
              </h3>
              <p className="text-xs text-[#b1bad3] leading-relaxed max-w-xs">
                Gira la rueda sagrada para multiplicar todas las monedas y activar la función Hold & Win Extreme instantáneamente.
              </p>
            </div>

            <div className="relative p-5 rounded-2xl bg-gradient-to-b from-amber-600/20 via-[#1a2c38] to-[#0f212e] border-2 border-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.2)] flex flex-col items-center text-center overflow-hidden">
              <div className="flex gap-1 mb-2">
                <span className="bg-amber-400 text-black font-black text-[10px] px-2 py-0.5 rounded shadow">
                  HOLD & WIN EXTREME
                </span>
                <span className="bg-purple-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow">
                  HASTA 10,000×
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 my-3 p-2 bg-black/40 rounded-xl border border-amber-500/30">
                {['16×', '10×', '30×', '2×', '4×', '14×', '8×', '12×', '20×', 'MAJOR', '10×', 'GRAND'].map((coin, i) => (
                  <div
                    key={i}
                    className={`w-12 h-10 rounded-lg flex items-center justify-center text-[10px] font-black border shadow-inner ${
                      coin === 'GRAND'
                        ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white border-amber-300 animate-pulse'
                        : coin === 'MAJOR'
                        ? 'bg-blue-600 text-white border-blue-300'
                        : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                    }`}
                  >
                    {coin}
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-black text-amber-300 tracking-wider uppercase mb-1">
                RESPINS DE ORO
              </h3>
              <p className="text-xs text-[#b1bad3] leading-relaxed max-w-xs">
                Acumula 4 o más monedas doradas para fijarlas en la pantalla y reiniciar tus tiradas hasta vaciar la bóveda.
              </p>
            </div>
          </div>

          <div className="w-full max-w-md flex flex-col items-center gap-3 pt-4">
            <button
              onClick={() => setShowSplashIntro(false)}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:to-blue-400 text-white font-black text-lg tracking-widest uppercase rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(37,99,235,0.6)] border-2 border-blue-400 flex items-center justify-center gap-2 group"
            >
              <span>JUGAR AHORA</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-4 text-xs text-[#557086]">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-[#00e701]" /> Certificado RNG Oficial
              </span>
              <span>·</span>
              <span>RTP {config.rtp}%</span>
              <span>·</span>
              <span>{config.provider}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Interface */}
      <div className="flex flex-col lg:flex-row">
        {/* Left Control Panel */}
        <div className="w-full lg:w-80 bg-[#1a2c38] p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#213743]">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#213743]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1475e1] shadow-[0_0_8px_#1475e1]" />
                <span className="text-sm font-black tracking-wider text-white uppercase truncate">
                  {config.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowSplashIntro(true)}
                  className="text-[#b1bad3] hover:text-white p-1 rounded transition-colors"
                  title="Ver pantalla de historia y características"
                >
                  <Info size={18} />
                </button>
                <button
                  onClick={() => {
                    sounds.enabled = !soundEnabled;
                    setSoundEnabled(!soundEnabled);
                  }}
                  className="text-[#b1bad3] hover:text-white p-1 rounded transition-colors"
                  title="Sonido"
                >
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              </div>
            </div>

            {/* Quick Bonus Triggers */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowWheelBonus(true)}
                className="flex-1 py-2 px-2 bg-gradient-to-r from-amber-600/30 to-amber-500/20 hover:from-amber-600/40 hover:to-amber-500/30 border border-amber-500/40 rounded-xl text-[11px] font-black text-amber-300 flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Compass size={14} /> Rueda Buffalo
              </button>
              <button
                type="button"
                onClick={startHoldAndWinRound}
                className="flex-1 py-2 px-2 bg-gradient-to-r from-yellow-600/30 to-yellow-500/20 hover:from-yellow-600/40 hover:to-yellow-500/30 border border-yellow-500/40 rounded-xl text-[11px] font-black text-yellow-300 flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Coins size={14} /> Hold & Win
              </button>
            </div>

            {/* Bet Amount */}
            <div>
              <div className="flex justify-between text-xs text-[#b1bad3] mb-1.5 font-medium">
                <span>Monto de la Tirada</span>
                <span className="font-mono text-white font-bold">US$ {betAmount.toFixed(2)}</span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-xs font-semibold text-[#557086]">$</div>
                <input
                  type="number"
                  min="0.2"
                  step="0.5"
                  disabled={isSpinning}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(0.2, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#1475e1] rounded-lg py-2.5 pl-7 pr-24 text-sm font-semibold text-white focus:outline-none transition-colors disabled:opacity-60 font-mono"
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isSpinning}
                    onClick={() => setBetAmount(Math.max(0.2, parseFloat((betAmount / 2).toFixed(2))))}
                    className="px-2 py-1 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white text-xs font-bold rounded transition-colors"
                  >
                    ½
                  </button>
                  <button
                    type="button"
                    disabled={isSpinning}
                    onClick={() => setBetAmount(parseFloat((betAmount * 2).toFixed(2)))}
                    className="px-2 py-1 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white text-xs font-bold rounded transition-colors"
                  >
                    2×
                  </button>
                </div>
              </div>
            </div>

            {/* Free Spins Alert */}
            {freeSpinsLeft > 0 && (
              <div className="p-3 bg-gradient-to-r from-amber-500/20 to-sky-500/20 border border-amber-400/40 rounded-xl flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <Crown size={18} className="text-amber-400" />
                  <span className="text-xs font-black text-amber-300">TIRADAS GRATIS</span>
                </div>
                <span className="text-base font-black text-white font-mono">{freeSpinsLeft} restantes</span>
              </div>
            )}

            {/* Jackpots Ticker */}
            <div className="bg-[#0f212e] p-3 rounded-xl border border-[#213743] space-y-2">
              <span className="text-[10px] font-bold text-[#b1bad3] uppercase tracking-wider block">
                Bolsas de Jackpot en Vivo
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1.5 bg-red-950/40 border border-red-500/40 rounded-lg">
                  <span className="block text-[9px] font-bold text-red-400">GRAND</span>
                  <span className="font-mono text-xs font-black text-white">{config.jackpots.grand}</span>
                </div>
                <div className="p-1.5 bg-blue-950/40 border border-blue-500/40 rounded-lg">
                  <span className="block text-[9px] font-bold text-blue-400">MAJOR</span>
                  <span className="font-mono text-xs font-black text-white">{config.jackpots.major}</span>
                </div>
                <div className="p-1.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg">
                  <span className="block text-[9px] font-bold text-emerald-400">MINI</span>
                  <span className="font-mono text-xs font-black text-white">{config.jackpots.mini}</span>
                </div>
              </div>
            </div>

            {/* Win Display */}
            {lastWin > 0 && (
              <div className="bg-[#00e701]/10 border border-[#00e701]/40 p-3.5 rounded-xl text-center animate-in zoom-in-95">
                <span className="text-xs text-[#00e701] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                  <Sparkles size={16} /> ¡PREMIO GANADO!
                </span>
                <p className="text-2xl font-black text-white font-mono mt-1">
                  +US$ {lastWin.toFixed(2)}
                </p>
                {multiplierBomb && (
                  <span className="text-xs font-bold text-amber-400 block mt-0.5">
                    Multiplicador Aplicado: {multiplierBomb}×
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[#213743]">
            <button
              onClick={spin}
              disabled={isSpinning}
              className="w-full py-4 bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] font-black text-sm tracking-wider uppercase rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-[#00e701]/30 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Play size={18} fill="currentColor" />
              <span>{isSpinning ? 'Rodando...' : freeSpinsLeft > 0 ? 'Tirada Gratis' : 'Girar Rodillos'}</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#557086] mt-2.5">
              <ShieldCheck size={14} className="text-[#00e701]" />
              <span>{config.provider} Engine · RTP {config.rtp}%</span>
            </div>
          </div>
        </div>

        {/* 5x3 Reels Arena with Metallic Gold Beveled Frame */}
        <div className={`flex-1 p-6 lg:p-8 flex flex-col items-center justify-center relative bg-gradient-to-b ${config.bgGradient}`}>
          {multiplierBomb && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-amber-500/20 border-2 border-amber-400 text-amber-300 px-3 py-1.5 rounded-xl font-black text-sm shadow-xl animate-bounce">
              <Zap size={16} />
              <span>ORBE MULTIPLICADOR {multiplierBomb}×</span>
            </div>
          )}

          {/* 3D Beveled Golden Temple Frame */}
          <div className="relative p-2.5 sm:p-4 bg-gradient-to-b from-yellow-500/50 via-amber-800/30 to-amber-950/80 rounded-3xl border-4 border-amber-400/90 shadow-[0_0_55px_rgba(245,158,11,0.4)] max-w-2xl w-full">
            {/* Egyptian Temple Pediment (Anubis & Gold Crest) */}
            {activeTheme === 'anubis' && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                <div className="bg-gradient-to-r from-amber-900 via-yellow-600 to-amber-900 px-6 py-1 rounded-full border-2 border-amber-300 shadow-xl flex items-center gap-2">
                  <span className="text-amber-200 text-xs font-black tracking-widest uppercase">
                    🏺 TEMPLO SAGRADO DE ANUBIS 🏺
                  </span>
                </div>
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={620}
              height={380}
              className="absolute inset-0 pointer-events-none z-30 w-full h-full"
            />

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Left Hieroglyphic Pillar (Egyptian Temple) */}
              {activeTheme === 'anubis' && (
                <div className="hidden sm:flex flex-col items-center justify-around w-7 self-stretch bg-gradient-to-b from-amber-700/60 via-yellow-600/40 to-amber-900/60 rounded-xl border border-amber-400/50 p-1 text-amber-300 text-xs font-serif select-none shadow-inner">
                  <span className="font-bold">☥</span>
                  <span className="font-bold">𓂀</span>
                  <span className="font-bold">𓆣</span>
                  <span className="font-bold">▲</span>
                  <span className="font-bold">☥</span>
                </div>
              )}

              {/* 5x3 Reels Matrix */}
              <div className="flex-1 grid grid-cols-5 gap-1.5 sm:gap-2.5 p-2.5 sm:p-3 bg-[#081017]/95 rounded-2xl border-2 border-[#213743]">
                {grid.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-1.5 sm:gap-2.5">
                    {col.map((sym, rowIdx) => (
                      <div
                        key={rowIdx}
                        className={`aspect-square rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#1a2c38] via-[#111e28] to-[#0b151d] border-2 border-[#2f4553] flex flex-col items-center justify-center relative shadow-inner transition-all duration-150 select-none p-1 ${
                          isSpinning
                            ? 'scale-95 blur-[0.5px] opacity-75'
                            : 'scale-100 hover:border-amber-400/80 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                        }`}
                      >
                        <SlotSymbolVector
                          id={sym.id}
                          size={46}
                          className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)] max-w-full max-h-full"
                        />
                        <span className="text-[8px] sm:text-[9px] font-black text-amber-200/90 tracking-tighter uppercase mt-0.5 hidden sm:block truncate max-w-[50px]">
                          {sym.name.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Right Hieroglyphic Pillar */}
              {activeTheme === 'anubis' && (
                <div className="hidden sm:flex flex-col items-center justify-around w-7 self-stretch bg-gradient-to-b from-amber-700/60 via-yellow-600/40 to-amber-900/60 rounded-xl border border-amber-400/50 p-1 text-amber-300 text-xs font-serif select-none shadow-inner">
                  <span className="font-bold">▲</span>
                  <span className="font-bold">𓆣</span>
                  <span className="font-bold">𓂀</span>
                  <span className="font-bold">☥</span>
                  <span className="font-bold">▲</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#b1bad3] mt-4 font-medium">
            <span>Mecánica Tumble Pay Anywhere</span>
            <span>·</span>
            <span>4+ símbolos pagan en cualquier casilla</span>
            <span>·</span>
            <button
              onClick={() => setShowProvablyFair(true)}
              className="text-[#00e701] hover:underline cursor-pointer"
            >
              Equidad Provably Fair
            </button>
          </div>
        </div>
      </div>

      {/* Provably Fair Modal */}
      <ProvablyFairModal
        isOpen={showProvablyFair}
        onClose={() => setShowProvablyFair(false)}
        gameTitle={config.title}
      />
    </div>
  );
};
