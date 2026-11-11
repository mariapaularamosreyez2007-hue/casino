import React, { useState } from 'react';
import { UserAccount } from '../types';
import { AstedLogo } from './AstedLogo';
import {
  Menu,
  Search,
  Wallet,
  MessageSquare,
  Bell,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Plus,
  ShieldAlert
} from 'lucide-react';

interface HeaderProps {
  user: UserAccount | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenWallet: () => void;
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  selectedCurrency: string;
  onSelectCurrency: (currency: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onLogout,
  onOpenWallet,
  onOpenSearch,
  onToggleSidebar,
  isChatOpen,
  onToggleChat,
  selectedCurrency,
  onSelectCurrency,
}) => {
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const currencies = [
    { code: 'USD', symbol: '$', rate: 1.0, icon: '💵' },
    { code: 'BTC', symbol: '₿', rate: 0.000011, icon: '🪙' },
    { code: 'ETH', symbol: 'Ξ', rate: 0.00034, icon: '💎' },
    { code: 'USDT', symbol: '₮', rate: 1.0, icon: '🟢' },
    { code: 'LTC', symbol: 'Ł', rate: 0.012, icon: '⚡' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#1a2c38] border-b border-[#213743] px-3 sm:px-6 flex items-center justify-between gap-4">
      {/* Left Zone: Hamburger + Asted Wordmark */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-[#b1bad3] hover:text-white hover:bg-[#213743] rounded-lg transition-colors"
          title="Menú"
        >
          <Menu size={20} />
        </button>

        <a href="/" className="flex items-center" title="Asted Casino">
          <AstedLogo size="md" />
        </a>
      </div>

      {/* Center Zone: Search bar (Desktop) */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between bg-[#0f212e] hover:bg-[#162734] border border-[#2f4553] focus:border-[#1475e1] rounded-lg px-4 py-2 text-xs text-[#b1bad3] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Search size={15} className="text-[#557086]" />
            <span>Buscar en Asted.com...</span>
          </div>
          <span className="bg-[#213743] text-[#b1bad3] text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-[#2f4553]/50">
            Ctrl + K
          </span>
        </button>
      </div>

      {/* Right Zone: User Actions & Wallet */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {user ? (
          /* Logged In View */
          <div className="flex items-center gap-2">
            {/* Currency Balance Pill with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="flex items-center gap-2 bg-[#0f212e] hover:bg-[#162734] border border-[#2f4553] rounded-lg px-3 py-1.5 transition-colors"
              >
                <span className="text-xs font-bold text-[#00e701] font-mono">
                  ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] font-bold text-[#b1bad3] uppercase">
                  {selectedCurrency}
                </span>
                <ChevronDown size={14} className="text-[#557086]" />
              </button>

              {/* Currency Selector Dropdown */}
              {showCurrencyDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1a2c38] border border-[#2f4553] rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1 text-[10px] font-bold text-[#557086] uppercase tracking-wider">
                    Moneda de Juego
                  </div>
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        onSelectCurrency(c.code);
                        setShowCurrencyDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-[#213743] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 text-white font-medium">
                        <span>{c.icon}</span>
                        <span>{c.code}</span>
                      </div>
                      {selectedCurrency === c.code && (
                        <span className="text-[#00e701] text-xs font-bold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cartera / Depositar Button (Stake vibrant blue) */}
            <button
              onClick={onOpenWallet}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#1475e1] hover:bg-[#0f60c7] text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-[#1475e1]/20 active:scale-95"
            >
              <Wallet size={15} />
              <span className="hidden sm:inline">Cartera</span>
            </button>

            {/* User Profile Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-9 h-9 rounded-lg bg-[#213743] border border-[#2f4553] hover:border-[#1475e1] flex items-center justify-center text-white text-xs font-bold transition-colors"
                title={user.username}
              >
                {user.username.slice(0, 2).toUpperCase()}
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-[#1a2c38] border border-[#2f4553] rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#213743]">
                    <p className="text-xs font-bold text-white truncate">{user.username}</p>
                    <p className="text-[11px] text-[#00e701] font-semibold mt-0.5">VIP {user.vipLevel}</p>
                  </div>
                  <button
                    onClick={() => {
                      onOpenWallet();
                      setShowUserDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#b1bad3] hover:text-white hover:bg-[#213743] text-left"
                  >
                    <Wallet size={15} />
                    <span>Cartera & Depósitos</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#ed4245] hover:bg-[#213743] text-left"
                  >
                    <LogOut size={15} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Logged Out View (Stake exact header buttons) */
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3.5 sm:px-4 py-2 bg-[#2f4553] hover:bg-[#395364] text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-3.5 sm:px-5 py-2 bg-[#1475e1] hover:bg-[#0f60c7] text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-[#1475e1]/30 active:scale-95 whitespace-nowrap"
            >
              Registrarse
            </button>
          </div>
        )}

        {/* Live Community Chat Toggle Button (Stake right side drawer) */}
        <button
          onClick={onToggleChat}
          className={`p-2 rounded-lg transition-colors ${
            isChatOpen
              ? 'bg-[#1475e1] text-white'
              : 'text-[#b1bad3] hover:text-white hover:bg-[#213743]'
          }`}
          title="Chat de la Comunidad"
        >
          <MessageSquare size={19} />
        </button>
      </div>
    </header>
  );
};
