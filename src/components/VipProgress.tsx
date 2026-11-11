import React, { useState } from 'react';
import { getVipProgress } from '../utils/vip';
import { Crown, Sparkles, ChevronRight, X, Shield, Gift, Zap } from 'lucide-react';

interface VipProgressProps {
  totalWagered: number;
  isExpanded: boolean;
}

export const VipProgress: React.FC<VipProgressProps> = ({ totalWagered, isExpanded }) => {
  const [showModal, setShowModal] = useState(false);
  const vip = getVipProgress(totalWagered);

  return (
    <>
      {isExpanded ? (
        <div className="mx-2 my-2 p-3 bg-gradient-to-b from-[#0f212e] to-[#14232f] rounded-xl border border-[#213743] hover:border-[#2f4553] shadow-md transition-all group">
          {/* Header Row: Rank Badge & Percentage */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-xs shadow-sm font-bold"
                style={{ backgroundColor: `${vip.badgeColor}25`, color: vip.badgeColor, border: `1px solid ${vip.badgeColor}50` }}
              >
                <Crown size={12} />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                {vip.tierName}
              </span>
            </div>

            <span className="text-xs font-mono font-extrabold text-[#00e701]">
              {vip.progressPercent.toFixed(1)}%
            </span>
          </div>

          {/* Progress Bar (Stake style glow bar) */}
          <div className="w-full h-2 bg-[#1a2c38] rounded-full overflow-hidden p-0.5 border border-[#213743] relative mb-1.5">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out relative"
              style={{
                width: `${Math.max(4, vip.progressPercent)}%`,
                background: 'linear-gradient(90deg, #1475e1, #00e701)',
                boxShadow: '0 0 8px rgba(0, 231, 1, 0.4)',
              }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Subtext: Wagered & Next Level */}
          <div className="flex items-center justify-between text-[10px] text-[#557086] font-medium">
            <span className="font-mono text-[#b1bad3]">
              ${vip.wageredTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="text-[#1475e1] hover:text-[#3b93f7] font-semibold flex items-center gap-0.5 transition-colors"
            >
              <span>{vip.nextTierName}</span>
              <ChevronRight size={10} />
            </button>
          </div>
        </div>
      ) : (
        /* Collapsed Sidebar Mini VIP Indicator */
        <div className="flex flex-col items-center py-2 px-1">
          <button
            onClick={() => setShowModal(true)}
            className="w-10 h-10 rounded-xl bg-[#0f212e] border border-[#213743] hover:border-[#1475e1] flex flex-col items-center justify-center relative transition-all group"
            title={`Nivel VIP: ${vip.tierName} (${vip.progressPercent.toFixed(1)}%)`}
          >
            <Crown size={14} style={{ color: vip.badgeColor }} />
            <span className="text-[9px] font-mono font-extrabold text-[#00e701] mt-0.5">
              {Math.round(vip.progressPercent)}%
            </span>

            {/* Glowing active pip */}
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: vip.badgeColor }}
            />
          </button>
        </div>
      )}

      {/* VIP Details Modal (Stake Rewards and Tiers) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#1a2c38] rounded-2xl border border-[#2f4553] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 bg-[#0f212e] border-b border-[#213743]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: `${vip.badgeColor}20`, border: `1px solid ${vip.badgeColor}60` }}
                >
                  <Crown size={22} style={{ color: vip.badgeColor }} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Club VIP ASTED</h3>
                  <p className="text-xs text-[#b1bad3]">
                    Rango actual: <span className="font-bold text-white">{vip.tierName}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-[#b1bad3] hover:text-white p-1.5 rounded-lg hover:bg-[#213743] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Progress Summary Box */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#b1bad3]">Progreso hacia {vip.nextTierName}</span>
                  <span className="text-[#00e701] font-mono font-bold text-sm">
                    {vip.progressPercent.toFixed(2)}%
                  </span>
                </div>

                <div className="w-full h-3 bg-[#1a2c38] rounded-full overflow-hidden p-0.5 border border-[#213743]">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${vip.progressPercent}%`,
                      background: 'linear-gradient(90deg, #1475e1, #00e701)',
                      boxShadow: '0 0 10px rgba(0, 231, 1, 0.5)',
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs text-[#557086] pt-1 font-mono">
                  <span>Apostado: ${vip.wageredTotal.toLocaleString()} USD</span>
                  <span>Faltan: ${vip.remainingToNextTier.toLocaleString()} USD</span>
                </div>
              </div>

              {/* Benefits of Current Tier */}
              <div>
                <h4 className="text-xs font-bold text-[#b1bad3] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#f6c443]" />
                  <span>Beneficios Activos del Rango</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-[#0f212e] rounded-xl border border-[#213743] flex items-center gap-2.5">
                    <Zap size={18} className="text-[#00e701] shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Rakeback</span>
                      <span className="text-[#b1bad3] text-[11px]">{vip.rakebackRate}% en cada apuesta</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0f212e] rounded-xl border border-[#213743] flex items-center gap-2.5">
                    <Gift size={18} className="text-[#1475e1] shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Bono de Nivel</span>
                      <span className="text-[#b1bad3] text-[11px]">Recompensa por ascender</span>
                    </div>
                  </div>
                </div>

                <ul className="mt-3 space-y-1.5 text-xs text-[#b1bad3]">
                  {vip.benefits.map((b, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-[#00e701]">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Explanatory note */}
              <div className="text-[11px] text-[#557086] bg-[#0f212e]/60 p-3 rounded-lg border border-[#213743] flex items-center gap-2">
                <Shield size={16} className="text-[#1475e1] shrink-0" />
                <span>Cada apuesta realizada en cualquier juego suma experiencia automáticamente hacia el siguiente rango VIP.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
