import React, { useState, useEffect } from 'react';
import { ShieldCheck, Play, Infinity as InfinityIcon, RotateCcw, Zap } from 'lucide-react';

export interface AutoBetConfig {
  numberOfBets: number; // 0 for infinite
  isInfinite: boolean;
  onWinAction: 'reset' | 'increase';
  onWinPercent: number;
  onLossAction: 'reset' | 'increase';
  onLossPercent: number;
  stopOnProfit?: number;
  stopOnLoss?: number;
}

interface UniversalStakeControlProps {
  balance: number;
  betAmount: number;
  onChangeBetAmount: (amount: number) => void;
  onAction: (isAuto?: boolean) => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  isActionLoading?: boolean;
  isAutoRunning?: boolean;
  onStopAuto?: () => void;
  autoBetsLeft?: number;
  onOpenProvablyFair?: () => void;
  children?: React.ReactNode;
  enableHotkeys?: boolean;
  gameId?: string;
}

export const UniversalStakeControl: React.FC<UniversalStakeControlProps> = ({
  balance,
  betAmount,
  onChangeBetAmount,
  onAction,
  actionLabel = 'Apostar',
  actionDisabled = false,
  isActionLoading = false,
  isAutoRunning = false,
  onStopAuto,
  autoBetsLeft = 0,
  onOpenProvablyFair,
  children,
  enableHotkeys = true,
}) => {
  const [tab, setTab] = useState<'manual' | 'auto'>('manual');

  // Auto-betting parameters
  const [autoConfig, setAutoConfig] = useState<AutoBetConfig>({
    numberOfBets: 10,
    isInfinite: false,
    onWinAction: 'reset',
    onWinPercent: 100,
    onLossAction: 'increase',
    onLossPercent: 100,
    stopOnProfit: undefined,
    stopOnLoss: undefined,
  });

  // Global Hotkey Listener: Space, A, S, D
  useEffect(() => {
    if (!enableHotkeys) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!actionDisabled && !isActionLoading) {
          onAction(tab === 'auto');
        }
      } else if (e.code === 'KeyA') {
        e.preventDefault();
        onChangeBetAmount(Math.max(0.1, parseFloat((betAmount / 2).toFixed(2))));
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        onChangeBetAmount(Math.min(balance, parseFloat((betAmount * 2).toFixed(2))));
      } else if (e.code === 'KeyD') {
        e.preventDefault();
        onChangeBetAmount(parseFloat(balance.toFixed(2)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableHotkeys, actionDisabled, isActionLoading, onAction, tab, betAmount, balance, onChangeBetAmount]);

  const handleHalf = () => {
    onChangeBetAmount(Math.max(0.1, parseFloat((betAmount / 2).toFixed(2))));
  };

  const handleDouble = () => {
    onChangeBetAmount(Math.min(balance, parseFloat((betAmount * 2).toFixed(2))));
  };

  const handleMax = () => {
    onChangeBetAmount(parseFloat(balance.toFixed(2)));
  };

  return (
    <div className="w-full lg:w-80 bg-[#1a2c38] p-4 sm:p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#213743] text-white select-none">
      <div className="space-y-4">
        {/* Stake Canonical Manual / Auto Segmented Switcher */}
        <div className="grid grid-cols-2 bg-[#0f212e] p-1 rounded-xl border border-[#213743]">
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              tab === 'manual'
                ? 'bg-[#213743] text-white shadow-sm'
                : 'text-[#b1bad3] hover:text-white'
            }`}
          >
            Manual
          </button>
          <button
            type="button"
            onClick={() => setTab('auto')}
            className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'auto'
                ? 'bg-[#213743] text-white shadow-sm'
                : 'text-[#b1bad3] hover:text-white'
            }`}
          >
            <Zap size={13} className={tab === 'auto' ? 'text-[#00e701]' : ''} />
            Automático
          </button>
        </div>

        {/* Bet Amount Input with Stake 1/2 and 2x Buttons */}
        <div>
          <div className="flex justify-between text-xs text-[#b1bad3] mb-1.5 font-semibold">
            <span>Monto de la Apuesta</span>
            <span className="font-mono text-white tabular-nums">US$ {betAmount.toFixed(2)}</span>
          </div>
          <div className="relative flex items-center">
            <div className="absolute left-3 text-xs font-bold text-[#557086]">$</div>
            <input
              type="number"
              min="0.1"
              step="1"
              disabled={isAutoRunning}
              value={betAmount}
              onChange={(e) => onChangeBetAmount(Math.max(0.1, parseFloat(e.target.value) || 0))}
              className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#00e701] rounded-lg py-2.5 pl-7 pr-28 text-sm font-semibold text-white focus:outline-none transition-colors font-mono tabular-nums disabled:opacity-50"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={handleHalf}
                disabled={isAutoRunning}
                className="px-2 py-1 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white text-xs font-bold rounded transition-colors disabled:opacity-40 cursor-pointer"
                title="Dividir entre 2 (Tecla A)"
              >
                ½
              </button>
              <button
                type="button"
                onClick={handleDouble}
                disabled={isAutoRunning}
                className="px-2 py-1 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white text-xs font-bold rounded transition-colors disabled:opacity-40 cursor-pointer"
                title="Multiplicar por 2 (Tecla S)"
              >
                2×
              </button>
              <button
                type="button"
                onClick={handleMax}
                disabled={isAutoRunning}
                className="px-2 py-1 bg-[#213743] hover:bg-[#2f4553] text-[#00e701] text-xs font-bold rounded transition-colors disabled:opacity-40 cursor-pointer"
                title="Apuesta Máxima (Tecla D)"
              >
                Max
              </button>
            </div>
          </div>
        </div>

        {/* Game-specific inputs passed as children */}
        {children}

        {/* Auto-betting controls (shown when tab is 'auto') */}
        {tab === 'auto' && (
          <div className="space-y-3 pt-2 border-t border-[#213743] animate-in fade-in duration-150">
            {/* Number of bets */}
            <div>
              <div className="flex justify-between text-xs text-[#b1bad3] mb-1 font-semibold">
                <span>Número de Apuestas</span>
                <span className="font-mono text-white tabular-nums">
                  {autoConfig.isInfinite ? 'Infinito (∞)' : autoConfig.numberOfBets}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="1"
                  disabled={autoConfig.isInfinite || isAutoRunning}
                  value={autoConfig.numberOfBets}
                  onChange={(e) =>
                    setAutoConfig({ ...autoConfig, numberOfBets: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#00e701] rounded-lg py-2 pl-3 pr-12 text-xs font-mono text-white focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setAutoConfig({ ...autoConfig, isInfinite: !autoConfig.isInfinite })}
                  className={`absolute right-1.5 px-2.5 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1 cursor-pointer ${
                    autoConfig.isInfinite
                      ? 'bg-[#00e701] text-[#0f212e]'
                      : 'bg-[#213743] text-[#b1bad3] hover:text-white'
                  }`}
                  title="Apuestas infinitas"
                >
                  <InfinityIcon size={14} />
                </button>
              </div>
            </div>

            {/* On Win Strategy */}
            <div>
              <div className="flex justify-between text-xs text-[#b1bad3] mb-1 font-semibold">
                <span>En caso de Victoria</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setAutoConfig({ ...autoConfig, onWinAction: 'reset' })}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    autoConfig.onWinAction === 'reset'
                      ? 'bg-[#213743] text-white border border-[#2f4553]'
                      : 'bg-[#0f212e] text-[#b1bad3]'
                  }`}
                >
                  Restablecer
                </button>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    placeholder="Aumentar %"
                    value={autoConfig.onWinAction === 'increase' ? autoConfig.onWinPercent : ''}
                    onFocus={() => setAutoConfig({ ...autoConfig, onWinAction: 'increase' })}
                    onChange={(e) =>
                      setAutoConfig({
                        ...autoConfig,
                        onWinAction: 'increase',
                        onWinPercent: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="w-full bg-[#0f212e] border border-[#2f4553] rounded-lg py-1.5 pl-2 pr-6 text-xs font-mono text-white focus:border-[#00e701] focus:outline-none"
                  />
                  <span className="absolute right-2 text-xs text-[#557086] font-bold">%</span>
                </div>
              </div>
            </div>

            {/* On Loss Strategy (Martingale) */}
            <div>
              <div className="flex justify-between text-xs text-[#b1bad3] mb-1 font-semibold">
                <span>En caso de Derrota (Martingala)</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setAutoConfig({ ...autoConfig, onLossAction: 'reset' })}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    autoConfig.onLossAction === 'reset'
                      ? 'bg-[#213743] text-white border border-[#2f4553]'
                      : 'bg-[#0f212e] text-[#b1bad3]'
                  }`}
                >
                  Restablecer
                </button>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    placeholder="Aumentar %"
                    value={autoConfig.onLossAction === 'increase' ? autoConfig.onLossPercent : ''}
                    onFocus={() => setAutoConfig({ ...autoConfig, onLossAction: 'increase' })}
                    onChange={(e) =>
                      setAutoConfig({
                        ...autoConfig,
                        onLossAction: 'increase',
                        onLossPercent: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="w-full bg-[#0f212e] border border-[#2f4553] rounded-lg py-1.5 pl-2 pr-6 text-xs font-mono text-white focus:border-[#00e701] focus:outline-none"
                  />
                  <span className="absolute right-2 text-xs text-[#557086] font-bold">%</span>
                </div>
              </div>
            </div>

            {/* Stop on Profit & Stop on Loss (Financial Circuit Breakers) */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#213743]/50">
              <div>
                <label className="text-[11px] text-[#b1bad3] font-semibold block mb-1">
                  Parar en Ganancia
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-2 text-[11px] font-bold text-[#557086]">$</div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Sin límite"
                    value={autoConfig.stopOnProfit ?? ''}
                    onChange={(e) =>
                      setAutoConfig({
                        ...autoConfig,
                        stopOnProfit: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-[#0f212e] border border-[#2f4553] rounded-lg py-1.5 pl-5 pr-2 text-xs font-mono text-white focus:border-[#00e701] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#b1bad3] font-semibold block mb-1">
                  Parar en Pérdida
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-2 text-[11px] font-bold text-[#557086]">$</div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Sin límite"
                    value={autoConfig.stopOnLoss ?? ''}
                    onChange={(e) =>
                      setAutoConfig({
                        ...autoConfig,
                        stopOnLoss: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-[#0f212e] border border-[#2f4553] rounded-lg py-1.5 pl-5 pr-2 text-xs font-mono text-white focus:border-[#00e701] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Action Button (Pure Stake Green #00e701) */}
      <div className="pt-4 mt-4 border-t border-[#213743] space-y-2">
        {isAutoRunning ? (
          <button
            type="button"
            onClick={onStopAuto}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw size={16} className="animate-spin" />
            <span>Detener Auto-Apuesta ({autoBetsLeft})</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={actionDisabled || isActionLoading}
            onClick={() => onAction(tab === 'auto')}
            className="w-full py-3.5 bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] font-black text-sm uppercase tracking-wider rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-[#00e701]/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Play size={16} fill="currentColor" />
            <span>{tab === 'auto' ? 'Iniciar Auto-Apuesta' : actionLabel}</span>
          </button>
        )}

        {/* Provably Fair & Hotkeys Badge */}
        <div className="flex items-center justify-between text-[11px] text-[#557086] pt-1 px-1">
          <button
            type="button"
            onClick={onOpenProvablyFair}
            className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <ShieldCheck size={13} className="text-[#00e701]" />
            <span>Equidad (Provably Fair)</span>
          </button>
          <span className="text-[10px] text-[#557086] font-mono">
            [Espacio] Apostar · [A] ½ · [S] 2x
          </span>
        </div>
      </div>
    </div>
  );
};
