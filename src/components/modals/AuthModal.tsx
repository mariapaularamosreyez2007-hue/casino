import React, { useState } from 'react';
import { UserAccount } from '../../types';
import { AstedLogo } from '../AstedLogo';
import { X, Lock, Mail, User, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('AstedPlayer');
  const [email, setEmail] = useState('jugador@asted.com');
  const [password, setPassword] = useState('••••••••');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserAccount = {
      username: username.trim() || 'AstedPlayer',
      email: email.trim() || 'jugador@asted.com',
      balance: 2500.0,
      currency: 'USD',
      vipLevel: 'Gold',
      totalWagered: 1420.0,
      joinedDate: 'Hoy',
      savedGames: ['mines', 'plinko', 'gates-of-olympus-1000'],
    };
    onSuccess(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#1a2c38] rounded-2xl border border-[#2f4553] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#213743]">
          <AstedLogo size="sm" />
          <button
            onClick={onClose}
            className="text-[#b1bad3] hover:text-white p-1 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode switcher tabs */}
        <div className="grid grid-cols-2 p-2 bg-[#0f212e] border-b border-[#213743]">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 text-xs font-bold rounded-lg transition-colors ${
              mode === 'login' ? 'bg-[#213743] text-white shadow' : 'text-[#b1bad3] hover:text-white'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 text-xs font-bold rounded-lg transition-colors ${
              mode === 'register' ? 'bg-[#1475e1] text-white shadow' : 'text-[#b1bad3] hover:text-white'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#b1bad3] mb-1.5">
              Nombre de usuario
            </label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-3 text-[#557086]" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#1475e1] rounded-lg py-2.5 pl-10 pr-3 text-xs text-white placeholder-[#557086] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#b1bad3] mb-1.5">
                Correo electrónico
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3 text-[#557086]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#1475e1] rounded-lg py-2.5 pl-10 pr-3 text-xs text-white placeholder-[#557086] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#b1bad3] mb-1.5">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3 text-[#557086]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña segura"
                className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#1475e1] rounded-lg py-2.5 pl-10 pr-3 text-xs text-white placeholder-[#557086] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#1475e1] hover:bg-[#0f60c7] text-white font-extrabold text-xs rounded-lg transition-all shadow-lg shadow-[#1475e1]/30 mt-2"
          >
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta con $2,500 de bienvenida'}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#557086] pt-2">
            <ShieldCheck size={14} className="text-[#00e701]" />
            <span>Encriptación de 256 bits · Acceso seguro</span>
          </div>
        </form>
      </div>
    </div>
  );
};
