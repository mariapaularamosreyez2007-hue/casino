import React, { useState } from 'react';
import { ChatMessage, UserAccount } from '../types';
import { INITIAL_CHAT_MESSAGES } from '../data/games';
import { X, Send, Sparkles, Shield, Gift, Users } from 'lucide-react';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onOpenAuth: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!user) {
      onOpenAuth();
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `c-${Date.now()}`,
      user: user.username,
      vipTier: (user.vipLevel.toLowerCase() as 'bronze' | 'silver' | 'gold' | 'platinum') || 'bronze',
      message: inputText.trim(),
      time: timeStr,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const getVipBadge = (tier?: string) => {
    switch (tier) {
      case 'diamond':
        return <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 px-1 rounded font-bold">DIAMOND</span>;
      case 'platinum':
        return <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-1 rounded font-bold">PLAT</span>;
      case 'gold':
        return <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-400/30 px-1 rounded font-bold">GOLD</span>;
      case 'silver':
        return <span className="text-[10px] bg-slate-300/20 text-slate-300 border border-slate-300/30 px-1 rounded font-bold">SILVER</span>;
      case 'bronze':
      default:
        return <span className="text-[10px] bg-amber-700/20 text-amber-600 border border-amber-700/30 px-1 rounded font-bold">BRONZE</span>;
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 w-80 bg-[#1a2c38] border-l border-[#213743] z-40 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Top Chat Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f212e] border-b border-[#213743]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00e701]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Sala Español</span>
          <div className="flex items-center gap-1 text-[11px] text-[#557086] ml-2">
            <Users size={12} />
            <span>1,482</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-[#b1bad3] hover:text-white p-1 rounded transition-colors"
          title="Cerrar chat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs no-scrollbar">
        {/* Stake Rain banner announcement */}
        <div className="bg-[#1475e1]/10 border border-[#1475e1]/30 p-2.5 rounded-lg flex items-center gap-2.5">
          <Gift size={18} className="text-[#1475e1] shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-white">¡Lluvia activa de Asted!</p>
            <p className="text-[10px] text-[#b1bad3]">Apostadores activos recibirán propinas aleatorias cada 30 min.</p>
          </div>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2.5 rounded-lg transition-colors ${
              msg.isSystem
                ? 'bg-[#00e701]/10 border border-[#00e701]/20 text-[#00e701]'
                : 'bg-[#0f212e]/70 border border-[#213743]/60 hover:border-[#2f4553]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                {msg.isSystem ? (
                  <Sparkles size={13} className="text-[#00e701]" />
                ) : (
                  getVipBadge(msg.vipTier)
                )}
                <span className="font-bold text-white">{msg.user}</span>
              </div>
              <span className="text-[10px] text-[#557086] tabular-nums">{msg.time}</span>
            </div>
            <p className="text-[#b1bad3] leading-relaxed break-words">{msg.message}</p>
          </div>
        ))}
      </div>

      {/* Bottom Send Input */}
      <div className="p-3 bg-[#0f212e] border-t border-[#213743]">
        {user ? (
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe un mensaje en el chat..."
              className="w-full bg-[#1a2c38] border border-[#2f4553] focus:border-[#1475e1] rounded-lg py-2.5 pl-3 pr-10 text-xs text-white placeholder-[#557086] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 text-[#1475e1] hover:text-[#0f60c7] p-1 transition-colors"
              title="Enviar"
            >
              <Send size={16} />
            </button>
          </form>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full py-2.5 bg-[#1475e1] hover:bg-[#0f60c7] text-white text-xs font-bold rounded-lg transition-colors text-center"
          >
            Inicia sesión para chatear
          </button>
        )}
      </div>
    </aside>
  );
};
