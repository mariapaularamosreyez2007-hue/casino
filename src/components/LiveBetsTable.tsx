import React, { useState, useEffect } from 'react';
import { LiveBet } from '../types';
import { MOCK_LIVE_BETS } from '../data/games';
import { Flame, Trophy, UserCheck } from 'lucide-react';

interface LiveBetsTableProps {
  userBets: LiveBet[];
  onSelectGameByName: (gameName: string) => void;
}

export const LiveBetsTable: React.FC<LiveBetsTableProps> = ({
  userBets,
  onSelectGameByName,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'my'>('all');
  const [allBets, setAllBets] = useState<LiveBet[]>(MOCK_LIVE_BETS);

  // Periodically insert new simulated bets
  useEffect(() => {
    const gamesPool = ['Mines', 'Plinko', 'Crash', 'Gates of Olympus 1000', 'Dice', 'Ruleta en Español', 'Limbo'];
    const usersPool = ['SatoshiFan', 'AlphaPlayer', 'CryptoWhale', 'LunaKing', 'LuckyDuck', 'Valkyrie99', 'GamerPro'];

    const interval = setInterval(() => {
      const randomGame = gamesPool[Math.floor(Math.random() * gamesPool.length)];
      const randomUser = usersPool[Math.floor(Math.random() * usersPool.length)];
      const betAmt = Math.floor(Math.random() * 80 + 5);
      const isWin = Math.random() < 0.58;
      const mult = isWin ? parseFloat((1.1 + Math.random() * 8).toFixed(2)) : 0;
      const payout = isWin ? parseFloat((betAmt * mult).toFixed(2)) : 0;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const newBet: LiveBet = {
        id: `b-${Date.now()}-${Math.random()}`,
        game: randomGame,
        user: randomUser,
        time: timeStr,
        betAmount: betAmt,
        currency: 'USD',
        multiplier: mult,
        payout,
        isWin,
      };

      setAllBets((prev) => [newBet, ...prev.slice(0, 19)]);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const getDisplayedBets = () => {
    if (activeTab === 'my') {
      return userBets;
    }
    if (activeTab === 'high') {
      return allBets.filter((b) => b.betAmount >= 50 || b.payout >= 100);
    }
    return allBets;
  };

  const displayedBets = getDisplayedBets();

  return (
    <div className="w-full bg-[#1a2c38] rounded-xl border border-[#213743] overflow-hidden mt-10 mb-8 shadow-lg">
      {/* Table Header Tabs */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0f212e] border-b border-[#213743]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'all'
                ? 'bg-[#213743] text-white shadow-sm'
                : 'text-[#b1bad3] hover:text-white'
            }`}
          >
            <Flame size={14} className={activeTab === 'all' ? 'text-[#00e701]' : ''} />
            <span>Todas las apuestas</span>
          </button>
          <button
            onClick={() => setActiveTab('high')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'high'
                ? 'bg-[#213743] text-white shadow-sm'
                : 'text-[#b1bad3] hover:text-white'
            }`}
          >
            <Trophy size={14} className={activeTab === 'high' ? 'text-[#f6c443]' : ''} />
            <span>Grandes apuestas</span>
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'my'
                ? 'bg-[#213743] text-white shadow-sm'
                : 'text-[#b1bad3] hover:text-white'
            }`}
          >
            <UserCheck size={14} className={activeTab === 'my' ? 'text-[#1475e1]' : ''} />
            <span>Mis apuestas ({userBets.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#557086] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#00e701] animate-pulse" />
          <span>Feed en tiempo real</span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#213743] text-[11px] font-bold text-[#557086] uppercase tracking-wider">
              <th className="py-3 px-4">Juego</th>
              <th className="py-3 px-4">Usuario</th>
              <th className="py-3 px-4">Hora</th>
              <th className="py-3 px-4 text-right">Importe Apuesta</th>
              <th className="py-3 px-4 text-right">Multiplicador</th>
              <th className="py-3 px-4 text-right">Pago</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#213743]/60 text-xs">
            {displayedBets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#557086]">
                  No hay apuestas registradas aún en esta sección.
                </td>
              </tr>
            ) : (
              displayedBets.slice(0, 10).map((bet) => (
                <tr
                  key={bet.id}
                  onClick={() => onSelectGameByName(bet.game)}
                  className="hover:bg-[#213743]/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-bold text-white group-hover:text-[#1475e1] transition-colors whitespace-nowrap">
                    {bet.game}
                  </td>
                  <td className="py-3 px-4 text-[#b1bad3] whitespace-nowrap font-medium">
                    {bet.user}
                  </td>
                  <td className="py-3 px-4 text-[#557086] tabular-nums whitespace-nowrap">
                    {bet.time}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-white whitespace-nowrap">
                    ${bet.betAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span
                      className={`font-mono font-bold ${
                        bet.multiplier >= 2.0
                          ? 'text-[#00e701]'
                          : bet.multiplier > 0
                          ? 'text-white'
                          : 'text-[#557086]'
                      }`}
                    >
                      {bet.multiplier > 0 ? `${bet.multiplier.toFixed(2)}x` : '0.00x'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                    <span className={bet.payout > 0 ? 'text-[#00e701]' : 'text-[#557086]'}>
                      ${bet.payout.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
