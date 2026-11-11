import React, { useState, useEffect } from 'react';
import { GameItem } from '../../types';
import { GAMES_DATA } from '../../data/games';
import { Search, X, Play, Flame } from 'lucide-react';
import { AstedExclusiveBadge } from '../AstedLogo';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (game: GameItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectGame,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredGames = GAMES_DATA.filter((game) => {
    const matchesQuery =
      game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.provider.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesQuery) return false;
    if (selectedTag === 'originals') return game.category === 'asted-originals';
    if (selectedTag === 'slots') return game.category === 'slots';
    if (selectedTag === 'live') return game.category === 'live-casino';
    if (selectedTag === 'exclusive') return game.category === 'only-on-asted';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#1a2c38] rounded-2xl border border-[#2f4553] shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-[#213743] bg-[#0f212e]">
          <Search size={18} className="text-[#557086] mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar juegos o proveedores en Asted.com..."
            className="w-full bg-transparent text-sm text-white placeholder-[#557086] focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-[#b1bad3] hover:text-white mr-2"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-bold text-[#b1bad3] hover:text-white bg-[#213743] rounded"
          >
            ESC
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 p-3 border-b border-[#213743] bg-[#1a2c38] overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Todos los juegos' },
            { id: 'originals', label: 'Originales de Asted' },
            { id: 'slots', label: 'Slots' },
            { id: 'live', label: 'Casino en Vivo' },
            { id: 'exclusive', label: 'Solo en Asted' },
          ].map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedTag === tag.id
                  ? 'bg-[#1475e1] text-white'
                  : 'bg-[#0f212e] text-[#b1bad3] hover:text-white hover:bg-[#213743]'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Search Results list */}
        <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-[#213743]/50 no-scrollbar">
          {filteredGames.length === 0 ? (
            <div className="py-12 text-center text-[#557086] text-xs">
              No se encontraron resultados para "{searchTerm}"
            </div>
          ) : (
            filteredGames.map((game) => (
              <div
                key={game.id}
                onClick={() => {
                  onSelectGame(game);
                  onClose();
                }}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#213743]/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0f212e] border border-[#2f4553] flex items-center justify-center text-lg shadow shrink-0">
                    {game.image ? (
                      <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
                    ) : (
                      <span>{game.category === 'asted-originals' ? '💎' : game.category === 'live-casino' ? '🎡' : '🎰'}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-[#1475e1] transition-colors">
                        {game.title}
                      </span>
                      {game.category === 'only-on-asted' && <AstedExclusiveBadge size={16} />}
                    </div>
                    <span className="text-[11px] text-[#557086] font-medium block">
                      {game.provider}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs text-[#00e701] font-bold block">
                      ● {game.playersCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#557086]">jugando</span>
                  </div>
                  <button className="p-2 rounded-lg bg-[#213743] group-hover:bg-[#00e701] group-hover:text-[#0f212e] text-white transition-colors">
                    <Play size={14} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
