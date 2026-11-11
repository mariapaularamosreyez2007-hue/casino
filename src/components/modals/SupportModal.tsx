import React, { useState } from 'react';
import { X, Headphones, Send, ShieldCheck, HelpCircle, MessageCircle } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<{ sender: 'agent' | 'user'; text: string; time: string }[]>([
    {
      sender: 'agent',
      text: '¡Hola! Bienvenido al Soporte en Vivo 24/7 de ASTED. ¿En qué podemos ayudarte hoy?',
      time: 'Ahora',
    },
  ]);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    setMessages((prev) => [...prev, { sender: 'user', text: userText, time: timeStr }]);
    setInputText('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: 'Gracias por tu consulta. Todos los juegos en ASTED son 100% Provably Fair con hashes criptográficos verificables. Los depósitos y retiros son inmediatos.',
          time: `${now.getHours()}:${String(now.getMinutes() + 1).padStart(2, '0')}`,
        },
      ]);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#1a2c38] rounded-2xl border border-[#2f4553] shadow-2xl overflow-hidden flex flex-col h-[520px]">
        {/* Support Header */}
        <div className="p-4 bg-[#0f212e] border-b border-[#213743] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1475e1]/20 border border-[#1475e1] flex items-center justify-center text-[#1475e1]">
              <Headphones size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Soporte ASTED en Vivo</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-[#00e701]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e701] animate-pulse" />
                <span>Agentes conectados · Respuesta &lt; 1 min</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#b1bad3] hover:text-white p-1 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#1a2c38] text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  m.sender === 'user'
                    ? 'bg-[#1475e1] text-white rounded-br-none'
                    : 'bg-[#0f212e] text-[#b1bad3] border border-[#213743] rounded-bl-none'
                }`}
              >
                <p className="leading-relaxed">{m.text}</p>
              </div>
              <span className="text-[10px] text-[#557086] mt-1 px-1">{m.time}</span>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-[#0f212e] border-t border-[#213743] flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe tu consulta..."
            className="flex-1 bg-[#1a2c38] border border-[#2f4553] focus:border-[#1475e1] rounded-lg p-2.5 text-xs text-white placeholder-[#557086] focus:outline-none"
          />
          <button
            type="submit"
            className="p-2.5 bg-[#1475e1] hover:bg-[#0f60c7] text-white rounded-lg transition-colors"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
