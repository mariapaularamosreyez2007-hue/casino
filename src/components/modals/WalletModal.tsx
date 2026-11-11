import React, { useState } from 'react';
import { UserAccount } from '../../types';
import {
  X,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Copy,
  Check,
  Gift,
  ShieldCheck,
  Lock,
  Unlock,
  Coins,
  Percent,
  Sparkles,
} from 'lucide-react';
import { showToast } from '../../utils/toast';
import { PlayerEconomyService } from '../../services/PlayerEconomyService';
import { sounds } from '../../utils/audio';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onAddFunds: (amount: number) => void;
  onUpdateUser?: (updatedUser: UserAccount) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  user,
  onAddFunds,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'vault' | 'rakeback' | 'faucet'>('deposit');
  const [copied, setCopied] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');

  // Vault form state
  const [vaultAction, setVaultAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [vaultAmount, setVaultAmount] = useState<number>(100);

  if (!isOpen || !user) return null;

  const cryptos = [
    { id: 'BTC', name: 'Bitcoin', icon: '🪙', address: 'bc1qastedcasino998240xyzdemo777' },
    { id: 'ETH', name: 'Ethereum', icon: '💎', address: '0xasted89234812379abcde100021' },
    { id: 'USDT', name: 'Tether (TRC20)', icon: '🟢', address: 'TKastedUSDT882947192840182' },
    { id: 'LTC', name: 'Litecoin', icon: '⚡', address: 'ltc1qastedfastwithdraw77788' },
  ];

  const currentCrypto = cryptos.find((c) => c.id === selectedCrypto) || cryptos[0];

  const handleCopy = () => {
    navigator.clipboard?.writeText(currentCrypto.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentVipTier = PlayerEconomyService.getVipTier(user.totalWagered);

  // Vault Transfer
  const handleVaultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateUser) return;

    const currentWallet = {
      balance: user.balance,
      vaultBalance: user.vaultBalance || 0,
      rakebackBalance: user.rakebackBalance || 0,
      totalWagered: user.totalWagered,
      vipTier: currentVipTier.name,
    };

    if (vaultAction === 'deposit') {
      const res = PlayerEconomyService.depositToVault(currentWallet, vaultAmount);
      if (res.success) {
        onUpdateUser({
          ...user,
          balance: res.newWallet.balance,
          vaultBalance: res.newWallet.vaultBalance,
        });
        showToast(res.message, 'success');
        sounds.playTilePress();
      } else {
        showToast(res.message, 'error');
      }
    } else {
      const res = PlayerEconomyService.withdrawFromVault(currentWallet, vaultAmount);
      if (res.success) {
        onUpdateUser({
          ...user,
          balance: res.newWallet.balance,
          vaultBalance: res.newWallet.vaultBalance,
        });
        showToast(res.message, 'success');
        sounds.playCashout();
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  // Claim Rakeback
  const handleClaimRakeback = () => {
    if (!onUpdateUser) return;
    const currentWallet = {
      balance: user.balance,
      vaultBalance: user.vaultBalance || 0,
      rakebackBalance: user.rakebackBalance || 0,
      totalWagered: user.totalWagered,
      vipTier: currentVipTier.name,
    };

    const res = PlayerEconomyService.claimRakeback(currentWallet);
    if (res.success) {
      onUpdateUser({
        ...user,
        balance: res.newWallet.balance,
        rakebackBalance: res.newWallet.rakebackBalance,
      });
      sounds.playGoldenJackpot();
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#1a2c38] rounded-2xl border border-[#2f4553] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#213743]">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-[#00e701]" />
            <span className="text-sm font-black text-white uppercase tracking-wider">Cartera & Economía Stake</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#b1bad3] hover:text-white p-1 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Balance Preview Ribbon */}
        <div className="p-4 bg-[#0f212e] border-b border-[#213743] grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-[11px] text-[#557086] block font-semibold">Saldo Activo</span>
            <span className="text-lg font-black text-[#00e701] font-mono tabular-nums">
              US$ {user.balance.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#557086] block font-semibold flex items-center gap-1">
              <Lock size={12} className="text-amber-400" /> Bóveda (Vault)
            </span>
            <span className="text-lg font-black text-amber-400 font-mono tabular-nums">
              US$ {(user.vaultBalance || 0).toFixed(2)}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] text-[#557086] block font-semibold flex items-center gap-1">
              <Percent size={12} className="text-[#38bdf8]" /> Rakeback VIP
            </span>
            <span className="text-lg font-black text-[#38bdf8] font-mono tabular-nums">
              US$ {(user.rakebackBalance || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-5 p-1 bg-[#14232e] border-b border-[#213743]">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`py-2 text-[11px] font-bold rounded-lg transition-colors flex flex-col items-center gap-1 ${
              activeTab === 'deposit' ? 'bg-[#213743] text-white shadow' : 'text-[#b1bad3] hover:text-white'
            }`}
          >
            <ArrowDownCircle size={14} className="text-[#00e701]" />
            <span>Depósito</span>
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`py-2 text-[11px] font-bold rounded-lg transition-colors flex flex-col items-center gap-1 ${
              activeTab === 'withdraw' ? 'bg-[#213743] text-white shadow' : 'text-[#b1bad3] hover:text-white'
            }`}
          >
            <ArrowUpCircle size={14} className="text-[#ed4245]" />
            <span>Retiro</span>
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`py-2 text-[11px] font-bold rounded-lg transition-colors flex flex-col items-center gap-1 ${
              activeTab === 'vault' ? 'bg-[#213743] text-white shadow' : 'text-[#b1bad3] hover:text-white'
            }`}
          >
            <Lock size={14} className="text-amber-400" />
            <span>Bóveda</span>
          </button>
          <button
            onClick={() => setActiveTab('rakeback')}
            className={`py-2 text-[11px] font-bold rounded-lg transition-colors flex flex-col items-center gap-1 ${
              activeTab === 'rakeback' ? 'bg-[#213743] text-white shadow' : 'text-[#b1bad3] hover:text-white'
            }`}
          >
            <Percent size={14} className="text-[#38bdf8]" />
            <span>Rakeback</span>
          </button>
          <button
            onClick={() => setActiveTab('faucet')}
            className={`py-2 text-[11px] font-bold rounded-lg transition-colors flex flex-col items-center gap-1 ${
              activeTab === 'faucet' ? 'bg-[#213743] text-white shadow' : 'text-[#b1bad3] hover:text-white'
            }`}
          >
            <Gift size={14} className="text-purple-400" />
            <span>Grifo</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="p-5 space-y-4">
          {/* DEPOSIT */}
          {activeTab === 'deposit' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#b1bad3] mb-1.5">
                  Selecciona Criptomoneda
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {cryptos.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCrypto(c.id)}
                      className={`p-2 rounded-xl text-center border transition-all ${
                        selectedCrypto === c.id
                          ? 'bg-[#00e701]/15 border-[#00e701] text-white'
                          : 'bg-[#0f212e] border-[#2f4553] text-[#b1bad3] hover:border-[#557086]'
                      }`}
                    >
                      <div className="text-xl mb-1">{c.icon}</div>
                      <span className="text-[11px] font-bold block">{c.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#b1bad3] mb-1.5">
                  Tu dirección de depósito ({currentCrypto.name})
                </label>
                <div className="flex items-center gap-2 bg-[#0f212e] border border-[#2f4553] p-2.5 rounded-lg">
                  <span className="font-mono text-xs text-white truncate flex-1 select-all">
                    {currentCrypto.address}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 bg-[#213743] hover:bg-[#2f4553] rounded text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check size={14} className="text-[#00e701]" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onAddFunds(1000);
                    showToast('¡Se han depositado $1,000.00 USD de demostración a tu saldo!', 'success');
                  }}
                  className="w-full py-3 bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-[#00e701]/20"
                >
                  Depósito Instantáneo Simulado (+US$ 1,000)
                </button>
              </div>
            </>
          )}

          {/* WITHDRAW */}
          {activeTab === 'withdraw' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#b1bad3] mb-1">Dirección de retiro</label>
                <input
                  type="text"
                  placeholder="Tu dirección cripto en blockchain"
                  className="w-full bg-[#0f212e] border border-[#2f4553] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00e701]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#b1bad3] mb-1">Cantidad a retirar (USD)</label>
                <input
                  type="number"
                  placeholder="100.00"
                  className="w-full bg-[#0f212e] border border-[#2f4553] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00e701] font-mono"
                />
              </div>
              <button
                onClick={() => showToast('Retiro procesado instantáneamente a tu dirección en la blockchain.', 'success')}
                className="w-full py-3 bg-[#213743] hover:bg-[#2f4553] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors mt-2"
              >
                Solicitar Retiro Instantáneo
              </button>
            </div>
          )}

          {/* VAULT (BÓVEDA) */}
          {activeTab === 'vault' && (
            <form onSubmit={handleVaultSubmit} className="space-y-4">
              <div className="p-3.5 bg-[#0f212e] border border-[#213743] rounded-xl flex items-start gap-3">
                <Lock size={20} className="text-amber-400 mt-0.5 shrink-0" />
                <div className="text-xs text-[#b1bad3] space-y-1">
                  <span className="font-bold text-white block">Aislamiento de Fondos (Bóveda Stake)</span>
                  <p>
                    El saldo guardado en tu bóveda no puede ser apostado por accidente o por rachas de martingala. Puedes transferir y retirar fondos instantáneamente y sin comisiones.
                  </p>
                </div>
              </div>

              {/* Action Toggle */}
              <div className="grid grid-cols-2 p-1 bg-[#0f212e] rounded-xl border border-[#213743]">
                <button
                  type="button"
                  onClick={() => setVaultAction('deposit')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    vaultAction === 'deposit'
                      ? 'bg-amber-400 text-[#0f212e] shadow-md'
                      : 'text-[#b1bad3] hover:text-white'
                  }`}
                >
                  <Lock size={14} />
                  <span>Guardar en Bóveda</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVaultAction('withdraw')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    vaultAction === 'withdraw'
                      ? 'bg-amber-400 text-[#0f212e] shadow-md'
                      : 'text-[#b1bad3] hover:text-white'
                  }`}
                >
                  <Unlock size={14} />
                  <span>Retirar al Saldo</span>
                </button>
              </div>

              {/* Amount input */}
              <div>
                <div className="flex justify-between text-xs text-[#b1bad3] mb-1 font-semibold">
                  <span>Monto a transferir</span>
                  <span className="font-mono text-white">
                    Máx: US$ {vaultAction === 'deposit' ? user.balance.toFixed(2) : (user.vaultBalance || 0).toFixed(2)}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-xs font-bold text-[#557086]">$</div>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={vaultAmount}
                    onChange={(e) => setVaultAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-amber-400 rounded-lg py-2.5 pl-7 pr-20 text-xs font-bold text-white font-mono focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setVaultAmount(vaultAction === 'deposit' ? user.balance : (user.vaultBalance || 0))}
                    className="absolute right-2 px-2 py-1 bg-[#213743] hover:bg-[#2f4553] text-[11px] font-bold text-white rounded transition-colors"
                  >
                    MÁX
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-[#0f212e] font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-amber-400/20"
              >
                {vaultAction === 'deposit' ? 'Bloquear en Bóveda' : 'Liberar Fondos al Saldo'}
              </button>
            </form>
          )}

          {/* RAKEBACK */}
          {activeTab === 'rakeback' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-[#0f212e] to-[#14232e] border border-[#213743] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#b1bad3] block font-semibold">Rakeback VIP Acumulado</span>
                  <span className="text-2xl font-black text-[#00e701] font-mono tabular-nums">
                    US$ {(user.rakebackBalance || 0).toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#b1bad3] block font-semibold">Tu Nivel VIP</span>
                  <span className="text-xs font-black uppercase text-amber-400 px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 rounded-full inline-block mt-0.5">
                    {currentVipTier.name} ({(currentVipTier.rakebackRate * 100).toFixed(0)}% Rakeback)
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-[#0f212e] border border-[#213743] rounded-xl text-xs text-[#b1bad3] space-y-1.5 leading-relaxed">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#00e701]" /> ¿Cómo funciona el Rakeback en Stake?
                </span>
                <p>
                  Por cada apuesta que realizas en la plataforma (sin importar si ganas o pierdes), se te devuelve automáticamente entre el <strong>5% y el 15% de la ventaja de la casa</strong>.
                </p>
                <p className="text-[11px] text-[#557086]">
                  Volumen total apostado: US$ {user.totalWagered.toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClaimRakeback}
                disabled={(user.rakebackBalance || 0) <= 0}
                className="w-full py-3 bg-[#00e701] hover:bg-[#00c701] disabled:opacity-50 disabled:pointer-events-none text-[#0f212e] font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-[#00e701]/25 flex items-center justify-center gap-2"
              >
                <Percent size={16} />
                <span>Reclamar Rakeback Ahora</span>
              </button>
            </div>
          )}

          {/* FAUCET */}
          {activeTab === 'faucet' && (
            <div className="text-center py-4 space-y-3">
              <Gift size={36} className="text-purple-400 mx-auto animate-bounce" />
              <h4 className="text-sm font-bold text-white">Grifo de Saldo Ilimitado</h4>
              <p className="text-xs text-[#b1bad3]">
                Prueba cualquier juego original, slot o apuesta deportiva sin límites. Reclama saldo de demostración recargable al instante.
              </p>
              <button
                onClick={() => {
                  onAddFunds(500);
                  showToast('¡US$ 500.00 añadidos a tu cuenta!', 'success');
                }}
                className="px-6 py-2.5 bg-[#213743] hover:bg-[#2f4553] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg border border-[#2f4553]"
              >
                Recargar +US$ 500.00
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
