import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { ParticleSystem } from '../../utils/particles';
import { showToast } from '../../utils/toast';
import { Volume2, VolumeX, Sparkles, Bomb, Dices } from 'lucide-react';
import { drawCasinoSpecularFlare, StarFlare } from './Engine';
import { UniversalStakeControl } from './UniversalStakeControl';
import { ProvablyFairModal } from '../modals/ProvablyFairModal';
import { ProvablyFairService } from '../../services/ProvablyFairService';
import { SlotSymbolVector } from './SlotSymbolsVector';

interface MinesGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordBet: (betAmount: number, multiplier: number, payout: number, isWin: boolean) => void;
}

interface TileState {
  revealed: boolean;
  isMine: boolean;
  isTriggerMine?: boolean; // the exact one user clicked
  revealDelay?: number;
}

interface FloatingWin {
  id: number;
  tileIndex: number;
  text: string;
}

export const MinesGame: React.FC<MinesGameProps> = ({
  balance,
  onUpdateBalance,
  onRecordBet,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [mineCount, setMineCount] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [grid, setGrid] = useState<TileState[]>(() =>
    Array(25).fill(null).map(() => ({ revealed: false, isMine: false }))
  );
  const [gemsFound, setGemsFound] = useState<number>(0);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [won, setWon] = useState<boolean | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showProvablyFair, setShowProvablyFair] = useState<boolean>(false);
  const [serverSeed, setServerSeed] = useState<string>(() => ProvablyFairService.generateServerSeed());
  const [clientSeed, setClientSeed] = useState<string>('mines_client_11');
  const [nonce, setNonce] = useState<number>(1);
  const [minesTheme, setMinesTheme] = useState<'anubis' | 'classic' | 'cyber'>('anubis');
  const [floatingWins, setFloatingWins] = useState<FloatingWin[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());
  const flaresRef = useRef<(StarFlare & { rotation: number; vRot: number })[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Exact Stake Mines mathematical formula (99% RTP, 1% house edge)
  const calculateMultiplier = (mines: number, hits: number): number => {
    if (hits === 0) return 1.0;
    let n = 25;
    let d = 25 - mines;
    let mult = 0.99;
    for (let i = 0; i < hits; i++) {
      mult *= (n - i) / (d - i);
    }
    return Math.max(1.01, parseFloat(mult.toFixed(2)));
  };

  const currentMultiplier = calculateMultiplier(mineCount, gemsFound);
  const nextMultiplier = calculateMultiplier(mineCount, gemsFound + 1);
  const currentProfit = parseFloat((betAmount * currentMultiplier).toFixed(2));

  // Multiplier ladder steps
  const getUpcomingMultipliers = () => {
    const list = [];
    const maxPreview = Math.min(25 - mineCount, gemsFound + 5);
    for (let i = Math.max(1, gemsFound); i <= maxPreview; i++) {
      list.push({ hits: i, mult: calculateMultiplier(mineCount, i) });
    }
    return list;
  };

  // Particles & Specular Flare canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    const render = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.update();
      particlesRef.current.draw(ctx);

      // Render Specular Flares
      for (let i = flaresRef.current.length - 1; i >= 0; i--) {
        const flare = flaresRef.current[i];
        flare.alpha -= 0.035;
        flare.rotation += flare.vRot;
        if (flare.alpha <= 0) {
          flaresRef.current.splice(i, 1);
        } else {
          drawCasinoSpecularFlare(ctx, flare, flare.rotation);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const startGame = () => {
    if (betAmount <= 0) return;
    if (betAmount > balance) {
      showToast('Saldo insuficiente. Añade fondos desde tu cartera de Asted.', 'error');
      return;
    }

    onUpdateBalance(balance - betAmount);

    // Cryptographic Provably Fair deterministic board generation
    const pfBoard = ProvablyFairService.getMinesBoard(serverSeed, clientSeed, nonce, mineCount);
    setNonce((n) => n + 1);

    const newGrid: TileState[] = pfBoard.map((b) => ({ revealed: false, isMine: b.isMine }));

    setGrid(newGrid);
    setGemsFound(0);
    setIsPlaying(true);
    setGameEnded(false);
    setWon(null);
    setIsShaking(false);
    setFloatingWins([]);
  };

  const clickTile = (index: number, e?: React.MouseEvent) => {
    if (!isPlaying || grid[index].revealed || gameEnded) return;

    sounds.playTilePress();

    const tile = grid[index];
    const newGrid = [...grid];

    const canvas = canvasRef.current;
    if (canvas && e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (tile.isMine) {
        particlesRef.current.emitExplosion(x, y, 40);
      } else {
        particlesRef.current.emitSparkles(x, y, 25);
        flaresRef.current.push({
          x,
          y,
          size: 36,
          alpha: 1,
          color: '#34d399',
          rotation: Math.random() * Math.PI,
          vRot: 0.08,
        });
      }
    }

    if (tile.isMine) {
      // 1. Mark triggered mine
      newGrid[index] = { ...tile, revealed: true, isTriggerMine: true };
      sounds.playBombExplosion();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);

      // 2. Sequential explosion of remaining hidden mines by distance
      const triggerRow = Math.floor(index / 5);
      const triggerCol = index % 5;

      const remainingMines = newGrid
        .map((t, idx) => ({ idx, dist: Math.hypot(Math.floor(idx / 5) - triggerRow, (idx % 5) - triggerCol) }))
        .filter((item) => newGrid[item.idx].isMine && item.idx !== index)
        .sort((a, b) => a.dist - b.dist);

      remainingMines.forEach((item, delayIdx) => {
        setTimeout(() => {
          setGrid((prev) => {
            const next = [...prev];
            if (next[item.idx]) {
              next[item.idx] = { ...next[item.idx], revealed: true };
            }
            return next;
          });
        }, (delayIdx + 1) * 75);
      });

      setGrid(newGrid);
      setIsPlaying(false);
      setGameEnded(true);
      setWon(false);
      onRecordBet(betAmount, 0, 0, false);
    } else {
      // Gem discovered!
      newGrid[index] = { ...tile, revealed: true };
      const newHits = gemsFound + 1;
      setGemsFound(newHits);
      setGrid(newGrid);
      sounds.playGemChime(newHits);

      // Trigger floating win tag
      const newMult = calculateMultiplier(mineCount, newHits);
      const hitProfit = parseFloat((betAmount * (newMult - (gemsFound > 0 ? calculateMultiplier(mineCount, gemsFound) : 1))).toFixed(2));
      const winId = Date.now() + Math.random();
      setFloatingWins((prev) => [...prev, { id: winId, tileIndex: index, text: `+US$ ${Math.max(0.1, hitProfit).toFixed(2)}` }]);
      setTimeout(() => {
        setFloatingWins((prev) => prev.filter((w) => w.id !== winId));
      }, 1200);

      if (newHits === 25 - mineCount) {
        cashout(newHits);
      }
    }
  };

  const randomPick = () => {
    if (!isPlaying || gameEnded) return;
    const unrevealed = grid
      .map((t, idx) => ({ ...t, idx }))
      .filter((t) => !t.revealed);
    if (unrevealed.length > 0) {
      const choice = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      clickTile(choice.idx);
    }
  };

  const cashout = (finalHits = gemsFound) => {
    if (!isPlaying || finalHits === 0) return;

    const finalMult = calculateMultiplier(mineCount, finalHits);
    const payout = parseFloat((betAmount * finalMult).toFixed(2));

    sounds.playCashout();
    confetti({
      particleCount: 80,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#00e701', '#1475e1', '#f6c443'],
    });

    onUpdateBalance(balance + payout);
    onRecordBet(betAmount, finalMult, payout, true);

    const finalGrid = grid.map((t) => ({ ...t, revealed: true }));
    setGrid(finalGrid);
    setIsPlaying(false);
    setGameEnded(true);
    setWon(true);
  };

  return (
    <div
      className={`flex flex-col lg:flex-row bg-[#0f212e] rounded-2xl overflow-hidden border border-[#213743] shadow-2xl transition-transform ${
        isShaking ? 'translate-x-1 duration-75' : ''
      }`}
    >
      {/* Universal Stake Canonical Control Panel */}
      <UniversalStakeControl
        balance={balance}
        betAmount={betAmount}
        onChangeBetAmount={setBetAmount}
        onAction={() => (isPlaying ? cashout() : startGame())}
        actionLabel={isPlaying ? `Retirar (US$ ${currentProfit.toFixed(2)})` : 'Apostar'}
        actionDisabled={(!isPlaying && (betAmount > balance || betAmount <= 0)) || (isPlaying && gemsFound === 0)}
        onOpenProvablyFair={() => setShowProvablyFair(true)}
        enableHotkeys={true}
        gameId="mines"
      >
        {/* Vault Theme Selector */}
        <div>
          <label className="text-xs text-[#b1bad3] mb-1.5 font-semibold block">Temática de la Bóveda</label>
          <div className="grid grid-cols-3 gap-1 bg-[#0f212e] p-1 rounded-xl border border-[#213743]">
            <button
              type="button"
              disabled={isPlaying}
              onClick={() => setMinesTheme('anubis')}
              className={`py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                minesTheme === 'anubis'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-sm'
                  : 'text-[#b1bad3] hover:text-white'
              }`}
            >
              🏺 Anubis Oro
            </button>
            <button
              type="button"
              disabled={isPlaying}
              onClick={() => setMinesTheme('classic')}
              className={`py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                minesTheme === 'classic'
                  ? 'bg-[#213743] text-white shadow-sm'
                  : 'text-[#b1bad3] hover:text-white'
              }`}
            >
              💎 Clásico
            </button>
            <button
              type="button"
              disabled={isPlaying}
              onClick={() => setMinesTheme('cyber')}
              className={`py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                minesTheme === 'cyber'
                  ? 'bg-[#213743] text-cyan-300 shadow-sm'
                  : 'text-[#b1bad3] hover:text-white'
              }`}
            >
              ⚡ Cyber
            </button>
          </div>
        </div>

        {/* Mines Count Selector */}
        <div>
          <div className="flex justify-between text-xs text-[#b1bad3] mb-1.5 font-semibold">
            <span>Minas en el Tablero</span>
            <span className="font-mono text-white font-bold tabular-nums">{mineCount} Minas</span>
          </div>
          <select
            disabled={isPlaying}
            value={mineCount}
            onChange={(e) => setMineCount(parseInt(e.target.value, 10))}
            className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#00e701] rounded-lg py-2.5 px-3 text-sm font-semibold text-white focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
          >
            {[1, 2, 3, 4, 5, 8, 10, 15, 20, 24].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'Mina' : 'Minas'} ({(25 - num)} Gemas)
              </option>
            ))}
          </select>
        </div>

        {/* Random Pick Button (Active during game) */}
        {isPlaying && (
          <button
            type="button"
            onClick={randomPick}
            className="w-full py-2.5 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-[#2f4553] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Dices size={14} className="text-[#00e701]" />
            <span>Selección Aleatoria</span>
          </button>
        )}
      </UniversalStakeControl>

      {/* Arena Grid (Right) */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-between relative bg-[#0f212e]">
        {/* Interactive VFX Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={450}
          height={450}
          className="absolute inset-0 pointer-events-none z-20 w-full h-full"
        />

        {/* Header / Ladder */}
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[#213743] z-10">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {getUpcomingMultipliers().map((step) => {
              const isCurrent = step.hits === gemsFound;
              return (
                <div
                  key={step.hits}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 border tabular-nums ${
                    isCurrent
                      ? 'bg-[#00e701] text-[#0f212e] border-white shadow-lg shadow-[#00e701]/40 scale-105'
                      : 'bg-[#1a2c38] text-[#b1bad3] border-[#213743]'
                  }`}
                >
                  {step.mult}x
                </div>
              );
            })}
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

        {/* 5x5 Matrix with 3D Beveled .tile-stake Buttons */}
        <div className="grid grid-cols-5 gap-2.5 sm:gap-3 p-3 bg-[#1a2c38] rounded-2xl border border-[#2f4553] shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] max-w-md w-full aspect-square my-auto z-10 relative">
          {grid.map((tile, index) => {
            const isClickable = isPlaying && !tile.revealed;
            const float = floatingWins.find((f) => f.tileIndex === index);

            return (
              <div key={index} className="relative aspect-square">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={(e) => clickTile(index, e)}
                  className={`w-full h-full rounded-xl flex items-center justify-center transition-all select-none overflow-hidden ${
                    tile.revealed
                      ? tile.isMine
                        ? tile.isTriggerMine
                          ? 'bg-gradient-to-br from-red-600 via-rose-900 to-black border-2 border-red-500 scale-95 shadow-[0_0_20px_rgba(239,68,68,0.7)]'
                          : 'bg-[#18232c] border border-red-500/40 opacity-50 scale-90'
                        : 'bg-gradient-to-br from-emerald-400 via-teal-600 to-emerald-950 shadow-xl shadow-emerald-500/30 scale-95 border-2 border-emerald-300'
                      : 'tile-stake cursor-pointer'
                  }`}
                >
                  {tile.revealed ? (
                    tile.isMine ? (
                      <div className="relative flex items-center justify-center animate-in zoom-in-75 duration-200">
                        {minesTheme === 'anubis' ? (
                          <SlotSymbolVector id="anubis" size={32} className="filter drop-shadow-[0_0_14px_rgba(239,68,68,0.9)] animate-bounce" />
                        ) : (
                          <Bomb size={24} className={tile.isTriggerMine ? 'text-red-400 animate-bounce' : 'text-red-500/80'} />
                        )}
                      </div>
                    ) : (
                      <div className="relative flex items-center justify-center animate-in zoom-in duration-200">
                        {minesTheme === 'anubis' ? (
                          <SlotSymbolVector id={index % 2 === 0 ? 'scarab' : 'eye'} size={32} className="filter drop-shadow-[0_0_12px_rgba(250,204,21,0.95)]" />
                        ) : (
                          <Sparkles size={26} className="text-emerald-200 filter drop-shadow-[0_0_8px_#34d399]" />
                        )}
                      </div>
                    )
                  ) : (
                    minesTheme === 'anubis' ? (
                      <span className="text-xs font-serif font-black text-amber-400/35 select-none">
                        {['☥', '𓂀', '𓆣', '▲', '𓊹'][index % 5]}
                      </span>
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    )
                  )}
                </button>

                {/* Floating Gain Badge */}
                {float && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <span className="animate-float-win font-mono font-black text-xs text-[#00e701] bg-[#0f212e]/90 px-2 py-0.5 rounded-md border border-[#00e701]/60 shadow-lg tabular-nums">
                      {float.text}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Indicators */}
        <div className="flex items-center gap-2 text-xs text-[#557086] mt-3 tabular-nums">
          <span>Gemas encontradas: <strong className="text-emerald-400 font-mono">{gemsFound}</strong> / {25 - mineCount}</span>
          <span>·</span>
          <span>Siguiente multiplicador: <strong className="text-white font-mono">{nextMultiplier}x</strong></span>
        </div>
      </div>

      {/* Provably Fair Modal */}
      <ProvablyFairModal
        isOpen={showProvablyFair}
        onClose={() => setShowProvablyFair(false)}
        gameTitle="Mines Stake Original"
      />
    </div>
  );
};
