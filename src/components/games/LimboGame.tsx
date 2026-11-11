import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { UniversalStakeControl } from './UniversalStakeControl';
import { ProvablyFairModal } from '../modals/ProvablyFairModal';
import { ProvablyFairService } from '../../services/ProvablyFairService';
import { showToast } from '../../utils/toast';
import { Zap, ShieldCheck, Target, TrendingUp, Trophy } from 'lucide-react';

interface LimboGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordBet: (betAmount: number, multiplier: number, payout: number, isWin: boolean) => void;
}

export const LimboGame: React.FC<LimboGameProps> = ({
  balance,
  onUpdateBalance,
  onRecordBet,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2.0);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [turboMode, setTurboMode] = useState<boolean>(false);

  // Results
  const [currentDisplayMultiplier, setCurrentDisplayMultiplier] = useState<number>(1.0);
  const [lastOutcome, setLastOutcome] = useState<{
    drawnMultiplier: number;
    isWin: boolean;
    payout: number;
  } | null>(null);

  const [history, setHistory] = useState<{ mult: number; isWin: boolean }[]>([
    { mult: 3.45, isWin: true },
    { mult: 1.12, isWin: false },
    { mult: 18.9, isWin: true },
    { mult: 1.05, isWin: false },
    { mult: 2.14, isWin: true },
  ]);

  // Provably Fair State
  const [showProvablyFair, setShowProvablyFair] = useState<boolean>(false);
  const [serverSeed, setServerSeed] = useState<string>(() => ProvablyFairService.generateServerSeed());
  const [clientSeed, setClientSeed] = useState<string>('limbo_client_99a');
  const [nonce, setNonce] = useState<number>(1);

  // Win chance derived from Target Multiplier (99% RTP / house edge 1%)
  const winChance = Math.min(98.0, Math.max(0.0001, parseFloat((99 / targetMultiplier).toFixed(4))));

  // Handle Target Multiplier change
  const handleTargetChange = (val: number) => {
    const clamped = Math.min(1000000, Math.max(1.01, parseFloat(val.toFixed(2)) || 1.01));
    setTargetMultiplier(clamped);
  };

  // Handle Win Chance change (inverse formula: target = 99 / winChance)
  const handleWinChanceChange = (val: number) => {
    const clampedChance = Math.min(98.0, Math.max(0.0001, parseFloat(val.toFixed(4)) || 1));
    const derivedTarget = parseFloat((99 / clampedChance).toFixed(2));
    setTargetMultiplier(derivedTarget);
  };

  // Execute Limbo Roll
  const handleRoll = () => {
    if (isRolling || betAmount <= 0) return;
    if (betAmount > balance) {
      showToast('Saldo insuficiente. Añade fondos desde tu cartera de Asted.', 'error');
      return;
    }

    onUpdateBalance(balance - betAmount);
    setIsRolling(true);

    // Cryptographic Provably Fair calculation
    const outcome = ProvablyFairService.generateOutcome(serverSeed, clientSeed, nonce);
    const drawn = ProvablyFairService.getLimboCrashResult(outcome.float, 0.01);
    setNonce((n) => n + 1);

    const isWin = drawn >= targetMultiplier;
    const payout = isWin ? parseFloat((betAmount * targetMultiplier).toFixed(2)) : 0;

    if (turboMode) {
      // Instant Bet Execution
      setCurrentDisplayMultiplier(drawn);
      setIsRolling(false);
      setLastOutcome({ drawnMultiplier: drawn, isWin, payout });
      setHistory((prev) => [{ mult: drawn, isWin }, ...prev.slice(0, 7)]);

      if (isWin) {
        sounds.playCashout();
        onUpdateBalance(balance - betAmount + payout);
        onRecordBet(betAmount, targetMultiplier, payout, true);
        if (targetMultiplier >= 10) {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        sounds.playBombExplosion();
        onRecordBet(betAmount, 0, 0, false);
      }
    } else {
      // High-speed Odometer Tick Roll
      sounds.playSpinTick();
      let step = 0;
      const totalSteps = 12;
      const interval = setInterval(() => {
        step++;
        const simulatedVal = parseFloat((1 + Math.random() * (drawn * 1.2)).toFixed(2));
        setCurrentDisplayMultiplier(simulatedVal);
        sounds.playSpinTick();

        if (step >= totalSteps) {
          clearInterval(interval);
          setCurrentDisplayMultiplier(drawn);
          setIsRolling(false);
          setLastOutcome({ drawnMultiplier: drawn, isWin, payout });
          setHistory((prev) => [{ mult: drawn, isWin }, ...prev.slice(0, 7)]);

          if (isWin) {
            sounds.playCashout();
            onUpdateBalance(balance - betAmount + payout);
            onRecordBet(betAmount, targetMultiplier, payout, true);
            if (targetMultiplier >= 10) {
              confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
            }
          } else {
            sounds.playBombExplosion();
            onRecordBet(betAmount, 0, 0, false);
          }
        }
      }, 35);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 bg-[#0f212e] rounded-2xl overflow-hidden border border-[#213743] shadow-2xl min-h-[500px]">
      {/* Left Column: Stake Canonical Controls */}
      <div className="md:col-span-5 lg:col-span-4 bg-[#1a2c38] p-4 sm:p-5 flex flex-col justify-between border-r border-[#213743]">
        <UniversalStakeControl
          balance={balance}
          betAmount={betAmount}
          onChangeBetAmount={setBetAmount}
          onAction={handleRoll}
          actionLabel="Apostar (Limbo)"
          actionDisabled={isRolling}
          isActionLoading={isRolling}
          onOpenProvablyFair={() => setShowProvablyFair(true)}
          gameId="limbo"
        >
          {/* Target Multiplier Input */}
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs text-[#b1bad3] mb-1 font-semibold">
                <span className="flex items-center gap-1">
                  <Target size={14} className="text-[#00e701]" /> Multiplicador Objetivo
                </span>
                <span className="text-[11px] text-[#557086] font-mono">Máx 1,000,000×</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.1"
                  min="1.01"
                  max="1000000"
                  disabled={isRolling}
                  value={targetMultiplier}
                  onChange={(e) => handleTargetChange(parseFloat(e.target.value))}
                  className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#00e701] rounded-lg py-2.5 px-3 text-sm font-black text-white font-mono focus:outline-none transition-colors"
                />
                <span className="absolute right-3 text-xs font-bold text-[#557086]">×</span>
              </div>
            </div>

            {/* Win Chance Input (Linked reciprocally) */}
            <div>
              <div className="flex justify-between text-xs text-[#b1bad3] mb-1 font-semibold">
                <span>Probabilidad de Victoria</span>
                <span className="text-[11px] text-[#557086] font-mono">RTP 99%</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.01"
                  min="0.0001"
                  max="98.0"
                  disabled={isRolling}
                  value={winChance}
                  onChange={(e) => handleWinChanceChange(parseFloat(e.target.value))}
                  className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#00e701] rounded-lg py-2.5 px-3 text-sm font-black text-white font-mono focus:outline-none transition-colors"
                />
                <span className="absolute right-3 text-xs font-bold text-[#557086]">%</span>
              </div>
            </div>

            {/* Turbo Mode Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-[#0f212e] border border-[#213743] rounded-xl">
              <span className="text-xs text-[#b1bad3] font-bold flex items-center gap-1.5">
                <Zap size={14} className={turboMode ? 'text-amber-400 fill-amber-400' : 'text-[#557086]'} /> Modo Turbo
              </span>
              <button
                type="button"
                onClick={() => setTurboMode(!turboMode)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  turboMode ? 'bg-[#00e701]' : 'bg-[#213743]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-[#0f212e] absolute top-0.5 transition-transform ${
                    turboMode ? 'left-5.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </UniversalStakeControl>
      </div>

      {/* Right Column: Limbo Radiant Screen */}
      <div className="md:col-span-7 lg:col-span-8 p-6 flex flex-col justify-between relative bg-gradient-to-br from-[#0f212e] via-[#14232e] to-[#0f212e]">
        {/* Top Multiplier History Pills */}
        <div className="flex items-center justify-end gap-1.5 overflow-x-auto pb-2">
          {history.map((h, i) => (
            <span
              key={i}
              className={`px-2.5 py-1 rounded-full text-xs font-mono font-black border transition-all ${
                h.isWin
                  ? 'bg-[#00e701]/15 text-[#00e701] border-[#00e701]/40'
                  : 'bg-[#213743]/80 text-[#b1bad3] border-[#2f4553]'
              }`}
            >
              {h.mult.toFixed(2)}×
            </span>
          ))}
        </div>

        {/* Center Titanic Limbo Display */}
        <div className="my-auto text-center py-12 select-none">
          <div className="inline-block relative">
            <span
              className={`text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight tabular-nums transition-colors duration-150 filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)] ${
                lastOutcome === null
                  ? 'text-white'
                  : lastOutcome.isWin
                  ? 'text-[#00e701] drop-shadow-[0_0_40px_rgba(0,231,1,0.5)]'
                  : 'text-[#ed4245] drop-shadow-[0_0_40px_rgba(237,66,69,0.5)]'
              }`}
            >
              {currentDisplayMultiplier.toFixed(2)}×
            </span>

            {/* Target indicator */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-xs text-[#557086] font-semibold uppercase tracking-wider">
                Objetivo Requerido:
              </span>
              <span className="text-sm font-mono font-black text-white px-2 py-0.5 bg-[#213743] rounded-lg">
                ≥ {targetMultiplier.toFixed(2)}×
              </span>
            </div>
          </div>

          {/* Last win banner */}
          {lastOutcome && lastOutcome.isWin && (
            <div className="mt-4 animate-in zoom-in-95">
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#00e701]/20 border border-[#00e701] text-[#00e701] font-mono font-black text-sm">
                ¡GANASTE +US$ {lastOutcome.payout.toFixed(2)}!
              </span>
            </div>
          )}
        </div>

        {/* Bottom Provably Fair info ribbon */}
        <div className="pt-4 border-t border-[#213743] flex items-center justify-between text-xs text-[#557086]">
          <button
            onClick={() => setShowProvablyFair(true)}
            className="flex items-center gap-1.5 hover:text-[#00e701] transition-colors"
          >
            <ShieldCheck size={14} className="text-[#00e701]" />
            <span>Provably Fair HMAC-SHA256 Verificado</span>
          </button>
          <span className="font-mono text-[11px]">RTP: 99.00% · House Edge: 1.00%</span>
        </div>
      </div>

      {/* Provably Fair Modal */}
      <ProvablyFairModal
        isOpen={showProvablyFair}
        onClose={() => setShowProvablyFair(false)}
        gameTitle="Limbo Original"
        gameType="limbo"
      />
    </div>
  );
};
