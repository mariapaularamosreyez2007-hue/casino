import React, { useState } from 'react';
import { GameItem } from '../../types';
import { MinesGame } from './MinesGame';
import { PlinkoGame } from './PlinkoGame';
import { CrashGame } from './CrashGame';
import { DiceGame } from './DiceGame';
import { SlotsGame } from './SlotsGame';
import { RouletteGame } from './RouletteGame';
import { BilliardGame } from './BilliardGame';
import { SolitaireGame } from './SolitaireGame';
import { LimboGame } from './LimboGame';
import {
  X,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Heart,
  Share2,
  Info,
  Tv,
  CheckCircle2,
} from 'lucide-react';

interface GameModalProps {
  game: GameItem | null;
  onClose: () => void;
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordBet: (betAmount: number, multiplier: number, payout: number, isWin: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: (gameId: string) => void;
}

export const GameModal: React.FC<GameModalProps> = ({
  game,
  onClose,
  balance,
  onUpdateBalance,
  onRecordBet,
  isFavorite,
  onToggleFavorite,
}) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [demoBalance, setDemoBalance] = useState<number>(10000);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [showProvablyFairModal, setShowProvablyFairModal] = useState<boolean>(false);

  if (!game) return null;

  const currentActiveBalance = isDemoMode ? demoBalance : balance;
  const handleBalanceUpdate = (newBal: number) => {
    if (isDemoMode) {
      setDemoBalance(newBal);
    } else {
      onUpdateBalance(newBal);
    }
  };

  const handleRecordBet = (betAmount: number, multiplier: number, payout: number, isWin: boolean) => {
    if (!isDemoMode) {
      onRecordBet(betAmount, multiplier, payout, isWin);
    }
  };

  const renderGameEngine = () => {
    switch (game.hasPlayableModal) {
      case 'billiard':
        return (
          <BilliardGame
            balance={currentActiveBalance}
            onUpdateBalance={handleBalanceUpdate}
            onRecordBet={handleRecordBet}
          />
        );
      case 'mines':
        return (
          <MinesGame
            balance={currentActiveBalance}
            onUpdateBalance={handleBalanceUpdate}
            onRecordBet={handleRecordBet}
          />
        );
      case 'plinko':
        return (
          <PlinkoGame
            balance={currentActiveBalance}
            onUpdateBalance={handleBalanceUpdate}
            onRecordBet={handleRecordBet}
          />
        );
      case 'crash':
        if (game.id === 'limbo') {
          return (
            <LimboGame
              balance={currentActiveBalance}
              onUpdateBalance={handleBalanceUpdate}
              onRecordBet={handleRecordBet}
            />
          );
        }
        return (
          <CrashGame
            balance={currentActiveBalance}
            onUpdateBalance={handleBalanceUpdate}
            onRecordBet={handleRecordBet}
          />
        );
      case 'dice':
        return (
          <DiceGame
            balance={currentActiveBalance}
            onUpdateBalance={handleBalanceUpdate}
            onRecordBet={handleRecordBet}
          />
        );
      case 'roulette':
        return (
          <RouletteGame
            balance={currentActiveBalance}
            onUpdateBalance={handleBalanceUpdate}
            onRecordBet={handleRecordBet}
          />
        );
      case 'solitaire':
        return (
          <SolitaireGame
            balance={currentActiveBalance}
            onUpdateBalance={handleBalanceUpdate}
            onRecordBet={handleRecordBet}
          />
        );
      case 'slots':
      default:
        return (
          <SlotsGame
            balance={currentActiveBalance}
            gameTitle={game.title}
            onUpdateBalance={handleBalanceUpdate}
            onRecordBet={handleRecordBet}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`relative w-full bg-[#1a2c38] rounded-2xl border border-[#2f4553] shadow-2xl overflow-hidden my-auto transition-all duration-300 ${
          isTheaterMode ? 'max-w-[96vw]' : 'max-w-5xl'
        }`}
      >
        {/* Top Game Header (Matches Stake Colombia style: Juego real / Demo toggle, title, theater mode) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0f212e] border-b border-[#213743]">
          <div className="flex items-center gap-3">
            <span className="text-sm sm:text-base font-black text-white tracking-wide">
              {game.title}
            </span>
            <span className="text-xs bg-[#213743] text-[#b1bad3] px-2 py-0.5 rounded font-medium">
              {game.provider}
            </span>
            {game.rtp && (
              <span className="hidden sm:inline-block text-xs text-[#00e701] font-semibold">
                RTP {game.rtp}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Stake-style "Juego real / Demo" pill toggle */}
            <div className="flex items-center bg-[#1a2c38] p-0.5 rounded-full border border-[#2f4553]">
              <button
                type="button"
                onClick={() => setIsDemoMode(false)}
                className={`px-3 py-1 text-xs font-black rounded-full transition-all ${
                  !isDemoMode
                    ? 'bg-[#00e701] text-[#0f212e] shadow-sm'
                    : 'text-[#b1bad3] hover:text-white'
                }`}
              >
                Juego real
              </button>
              <button
                type="button"
                onClick={() => setIsDemoMode(true)}
                className={`px-3 py-1 text-xs font-black rounded-full transition-all ${
                  isDemoMode
                    ? 'bg-amber-400 text-[#0f212e] shadow-sm'
                    : 'text-[#b1bad3] hover:text-white'
                }`}
              >
                Modo Demo
              </button>
            </div>

            {/* Theater Mode Toggle */}
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className="p-1.5 rounded-lg text-[#b1bad3] hover:text-white hover:bg-[#213743] transition-colors hidden sm:block"
              title={isTheaterMode ? 'Modo Estándar' : 'Modo Teatro'}
            >
              {isTheaterMode ? <Minimize2 size={18} /> : <Tv size={18} />}
            </button>

            {/* Favorite button */}
            <button
              onClick={() => onToggleFavorite(game.id)}
              className={`p-1.5 rounded-lg hover:bg-[#213743] transition-colors ${
                isFavorite ? 'text-[#ed4245]' : 'text-[#b1bad3]'
              }`}
              title="Añadir a favoritos"
            >
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#b1bad3] hover:text-white hover:bg-[#213743] transition-colors"
              title="Cerrar juego"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Demo Mode Notice Banner if active */}
        {isDemoMode && (
          <div className="bg-amber-400/10 border-b border-amber-400/30 px-4 py-1.5 flex items-center justify-between text-xs text-amber-300">
            <span className="font-semibold">
              Estás jugando en MODO DEMO. Saldo de prueba: US${demoBalance.toLocaleString()}
            </span>
            <button
              onClick={() => setDemoBalance(10000)}
              className="underline hover:text-white font-bold ml-2"
            >
              Recargar US$10,000
            </button>
          </div>
        )}

        {/* Game Engine Container */}
        <div className="p-3 sm:p-5">
          {renderGameEngine()}
        </div>

        {/* Bottom Game Footer Info */}
        <div className="px-5 py-2.5 bg-[#0f212e] border-t border-[#213743] flex flex-wrap items-center justify-between gap-3 text-xs text-[#557086]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowProvablyFairModal(true)}
              className="flex items-center gap-1.5 hover:text-[#00e701] transition-colors"
            >
              <ShieldCheck size={14} className="text-[#00e701]" />
              <span>Provably Fair Hash Verificado</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5">
              <Info size={14} />
              <span>ID de Sesión: asted-{game.id}-{Math.floor(Math.random() * 900000 + 100000)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#00e701] font-bold">●</span>
            <span className="text-[#b1bad3] font-medium">{game.playersCount.toLocaleString()} jugadores activos</span>
          </div>
        </div>
      </div>

      {/* Provably Fair Inspection Modal */}
      {showProvablyFairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1a2c38] border border-[#2f4553] max-w-md w-full rounded-2xl p-5 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#213743]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#00e701]" size={20} />
                <h3 className="text-base font-black tracking-wide">VERIFICACIÓN PROVABLY FAIR</h3>
              </div>
              <button
                onClick={() => setShowProvablyFairModal(false)}
                className="text-[#b1bad3] hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#b1bad3] leading-relaxed">
              En ASTED, todos los resultados de juego están criptográficamente predeterminados y son 100% verificables por el usuario usando SHA-256 HMAC.
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[#557086] block">Server Seed Hash (SHA-256):</span>
                <code className="bg-[#0f212e] p-2 rounded-lg text-emerald-400 block font-mono text-[11px] truncate border border-[#213743]">
                  a8f9c1d2e4b57891024bc68e1456fabc78912345def6789a0123456789abcdef
                </code>
              </div>
              <div>
                <span className="text-[#557086] block">Client Seed:</span>
                <code className="bg-[#0f212e] p-2 rounded-lg text-[#38bdf8] block font-mono text-[11px] border border-[#213743]">
                  asted-player-seed-2026-secure
                </code>
              </div>
              <div>
                <span className="text-[#557086] block">Nonce de Jugada:</span>
                <code className="bg-[#0f212e] p-2 rounded-lg text-white block font-mono text-[11px] border border-[#213743]">
                  42
                </code>
              </div>
            </div>

            <button
              onClick={() => setShowProvablyFairModal(false)}
              className="w-full py-2.5 bg-[#213743] hover:bg-[#2f4553] text-white font-bold rounded-xl text-xs transition-colors"
            >
              Cerrar Verificador
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
