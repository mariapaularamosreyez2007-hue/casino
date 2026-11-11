import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { diceVFX } from './VFX';
import { UniversalStakeControl } from './UniversalStakeControl';
import { ProvablyFairModal } from '../modals/ProvablyFairModal';
import { ProvablyFairService } from '../../services/ProvablyFairService';
import { Volume2, VolumeX, ArrowLeftRight } from 'lucide-react';

interface DiceGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordBet: (betAmount: number, multiplier: number, payout: number, isWin: boolean) => void;
}

export const DiceGame: React.FC<DiceGameProps> = ({
  balance,
  onUpdateBalance,
  onRecordBet,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [rollTarget, setRollTarget] = useState<number>(50.5);
  const [isRollUnder, setIsRollUnder] = useState<boolean>(true);
  const [displayedRoll, setDisplayedRoll] = useState<number>(50.0);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastWon, setLastWon] = useState<boolean | null>(null);
  const [showProvablyFair, setShowProvablyFair] = useState<boolean>(false);
  const [serverSeed, setServerSeed] = useState<string>(() => ProvablyFairService.generateServerSeed());
  const [clientSeed, setClientSeed] = useState<string>('dice_client_77');
  const [nonce, setNonce] = useState<number>(1);
  const [history, setHistory] = useState<{ roll: number; won: boolean }[]>([
    { roll: 42.12, won: true },
    { roll: 88.45, won: false },
    { roll: 12.3, won: true },
    { roll: 65.18, won: false },
    { roll: 33.91, won: true },
  ]);

  const sliderTrackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Exact Stake Dice calculations (99% RTP, 1% house edge)
  const winChance = isRollUnder ? rollTarget : 100 - rollTarget;
  const multiplier = parseFloat((99.0 / winChance).toFixed(4));
  const potentialProfit = parseFloat((betAmount * (multiplier - 1)).toFixed(2));

  // Triangulation handlers
  const handleTargetChange = (val: number) => {
    const clamped = Math.max(1.0, Math.min(98.0, parseFloat(val.toFixed(2))));
    setRollTarget(clamped);
  };

  const handleMultiplierChange = (mVal: number) => {
    const safeM = Math.max(1.0102, Math.min(99.0, mVal));
    const targetChance = 99.0 / safeM;
    const target = isRollUnder ? targetChance : 100 - targetChance;
    handleTargetChange(target);
  };

  const handleWinChanceChange = (chance: number) => {
    const safeC = Math.max(1.0, Math.min(98.0, chance));
    const target = isRollUnder ? safeC : 100 - safeC;
    handleTargetChange(target);
  };

  const toggleDirection = () => {
    setIsRollUnder(!isRollUnder);
    setRollTarget(parseFloat((100 - rollTarget).toFixed(2)));
  };

  // Slider dragging logic
  const handleSliderMove = (clientX: number) => {
    if (!sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const ratio = Math.max(0.01, Math.min(0.98, (clientX - rect.left) / rect.width));
    const newTarget = parseFloat((ratio * 100).toFixed(2));
    setRollTarget(newTarget);
  };

  // Execute Bet with Mechanical Odometer Deceleration
  const rollDice = () => {
    if (betAmount <= 0 || betAmount > balance || isRolling) return;

    onUpdateBalance(balance - betAmount);
    setIsRolling(true);

    // Cryptographic Provably Fair deterministic calculation (99% RTP)
    const pfOutcome = ProvablyFairService.generateOutcome(serverSeed, clientSeed, nonce);
    const finalRoll = ProvablyFairService.getDiceResult(pfOutcome.float);
    setNonce((n) => n + 1);
    const isWin = isRollUnder ? finalRoll < rollTarget : finalRoll > rollTarget;

    // Fast mechanical odometer tick loop
    let ticks = 0;
    const totalTicks = 18;
    const interval = setInterval(() => {
      ticks++;
      const randomDisplay = parseFloat((Math.random() * 100).toFixed(2));
      setDisplayedRoll(randomDisplay);
      sounds.playOdometreTick(800 + ticks * 25);

      if (ticks >= totalTicks) {
        clearInterval(interval);
        setDisplayedRoll(finalRoll);
        setIsRolling(false);
        setLastWon(isWin);

        if (isWin) {
          const payout = parseFloat((betAmount * multiplier).toFixed(2));
          sounds.playCashout();
          diceVFX.triggerDiceWin(250, 150, multiplier);
          if (multiplier >= 2) {
            confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
          }
          onUpdateBalance(balance + payout);
          onRecordBet(betAmount, multiplier, payout, true);
        } else {
          sounds.playBombExplosion();
          onRecordBet(betAmount, 0, 0, false);
        }

        setHistory((prev) => [{ roll: finalRoll, won: isWin }, ...prev.slice(0, 5)]);
      }
    }, 45);
  };

  return (
    <div className="flex flex-col lg:flex-row bg-[#0f212e] rounded-2xl overflow-hidden border border-[#213743] shadow-2xl">
      {/* Universal Stake Canonical Control Panel */}
      <UniversalStakeControl
        balance={balance}
        betAmount={betAmount}
        onChangeBetAmount={setBetAmount}
        onAction={() => rollDice()}
        actionLabel={isRolling ? 'Tirando...' : 'Apostar'}
        actionDisabled={betAmount > balance || betAmount <= 0 || isRolling}
        onOpenProvablyFair={() => setShowProvablyFair(true)}
        enableHotkeys={true}
        gameId="dice"
      >
        {/* Triangulated Fields Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-xs text-[#b1bad3] mb-1 font-semibold block">Multiplicador</label>
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.01"
                value={multiplier}
                onChange={(e) => handleMultiplierChange(parseFloat(e.target.value) || 1.01)}
                className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#00e701] rounded-lg py-2 pl-3 pr-6 text-xs font-mono font-bold text-white tabular-nums focus:outline-none"
              />
              <span className="absolute right-2 text-xs text-[#557086] font-bold">x</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#b1bad3] mb-1 font-semibold block">Prob. Victoria</label>
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.1"
                value={winChance.toFixed(2)}
                onChange={(e) => handleWinChanceChange(parseFloat(e.target.value) || 1)}
                className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#00e701] rounded-lg py-2 pl-3 pr-6 text-xs font-mono font-bold text-white tabular-nums focus:outline-none"
              />
              <span className="absolute right-2 text-xs text-[#557086] font-bold">%</span>
            </div>
          </div>
        </div>

        {/* Potential Profit */}
        <div>
          <div className="flex justify-between text-xs text-[#b1bad3] mb-1 font-semibold">
            <span>Ganancia Estimada</span>
            <span className="font-mono text-[#00e701] font-bold tabular-nums">
              +US$ {potentialProfit.toFixed(2)}
            </span>
          </div>
        </div>
      </UniversalStakeControl>

      {/* Arena Viewport with Authentic Stake 0-100 Interactive Slider (Right) */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between relative bg-[#0f212e]">
        {/* Top History Bar */}
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[#213743]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] text-[#557086] mr-1 font-medium">Recientes:</span>
            {history.map((h, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border tabular-nums ${
                  h.won
                    ? 'bg-[#00e701]/20 text-[#00e701] border-[#00e701]/40'
                    : 'bg-red-500/20 text-red-400 border-red-500/40'
                }`}
              >
                {h.roll.toFixed(2)}
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

        {/* Center Display: Giant Odometer & Status */}
        <div className="my-auto py-8 flex flex-col items-center justify-center">
          <div
            className={`px-8 py-4 rounded-2xl border-2 transition-all duration-200 select-none ${
              lastWon === true
                ? 'bg-[#00e701]/15 border-[#00e701] shadow-[0_0_25px_rgba(0,231,1,0.35)]'
                : lastWon === false
                ? 'bg-red-500/15 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.35)]'
                : 'bg-[#1a2c38] border-[#213743]'
            }`}
          >
            <span
              className={`text-6xl sm:text-7xl font-black font-mono tabular-nums tracking-tight ${
                lastWon === true
                  ? 'text-[#00e701]'
                  : lastWon === false
                  ? 'text-red-400'
                  : 'text-white'
              }`}
            >
              {displayedRoll.toFixed(2)}
            </span>
          </div>

          <span className="text-xs font-semibold text-[#557086] mt-3 uppercase tracking-wider">
            {isRollUnder ? `Tirar por debajo de ${rollTarget.toFixed(2)}` : `Tirar por encima de ${rollTarget.toFixed(2)}`}
          </span>
        </div>

        {/* Stake Interactive Draggable Two-Tone Slider 0 to 100 */}
        <div className="w-full max-w-xl mx-auto space-y-4 pb-4">
          <div className="relative">
            {/* The Track */}
            <div
              ref={sliderTrackRef}
              onMouseDown={(e) => {
                isDraggingRef.current = true;
                handleSliderMove(e.clientX);
                const handleMove = (ev: MouseEvent) => {
                  if (isDraggingRef.current) handleSliderMove(ev.clientX);
                };
                const handleUp = () => {
                  isDraggingRef.current = false;
                  window.removeEventListener('mousemove', handleMove);
                  window.removeEventListener('mouseup', handleUp);
                };
                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', handleUp);
              }}
              onTouchStart={(e) => {
                if (e.touches.length > 0) handleSliderMove(e.touches[0].clientX);
              }}
              onTouchMove={(e) => {
                if (e.touches.length > 0) handleSliderMove(e.touches[0].clientX);
              }}
              className="relative h-4 bg-[#213743] rounded-full overflow-hidden cursor-pointer shadow-inner border border-[#2f4553]"
            >
              {/* Green (Win) and Red (Loss) Zones */}
              {isRollUnder ? (
                <>
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-[#00e701] shadow-[0_0_12px_#00e701]"
                    style={{ width: `${rollTarget}%` }}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-red-600"
                    style={{ width: `${100 - rollTarget}%` }}
                  />
                </>
              ) : (
                <>
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-red-600"
                    style={{ width: `${rollTarget}%` }}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-[#00e701] shadow-[0_0_12px_#00e701]"
                    style={{ width: `${100 - rollTarget}%` }}
                  />
                </>
              )}
            </div>

            {/* Draggable Metallic Thumb Marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-4 border-[#1a2c38] shadow-xl flex items-center justify-center pointer-events-none transition-transform"
              style={{ left: `calc(${rollTarget}% - 16px)` }}
            >
              <div className="w-2 h-2 rounded-full bg-[#0f212e]" />
            </div>
          </div>

          {/* Scale Labels & Toggle Direction Button */}
          <div className="flex items-center justify-between text-xs text-[#557086] font-mono font-bold px-1 select-none">
            <span>0</span>
            <span>25</span>
            <button
              type="button"
              onClick={toggleDirection}
              className="px-3 py-1 bg-[#1a2c38] hover:bg-[#213743] border border-[#2f4553] text-[#00e701] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeftRight size={13} />
              <span>{isRollUnder ? 'Invertir: Tirar Por Encima' : 'Invertir: Tirar Por Debajo'}</span>
            </button>
            <span>75</span>
            <span>100</span>
          </div>
        </div>

        {/* Footer Indicators */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#557086] pt-2 border-t border-[#213743] tabular-nums">
          <span>RTP: <strong className="text-white font-mono">99.00%</strong></span>
          <span>·</span>
          <span>Margen de la Casa: <strong className="text-emerald-400 font-mono">1.00%</strong></span>
          <span>·</span>
          <span>Criptografía: <strong className="text-amber-400">HMAC-SHA512</strong></span>
        </div>
      </div>

      {/* Provably Fair Modal */}
      <ProvablyFairModal
        isOpen={showProvablyFair}
        onClose={() => setShowProvablyFair(false)}
        gameTitle="Dice Stake Original"
      />
    </div>
  );
};
