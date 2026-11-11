import React from 'react';
import { GameCategory } from '../types';
import {
  Bookmark,
  Heart,
  PlayCircle,
  PlusSquare,
  FileText,
  Sparkles,
  Flame,
  Tv,
  Dices,
  Crown,
  Gift,
  Headphones,
  Globe,
  Search,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { VipProgress } from './VipProgress';
import { AstedExclusiveBadge } from './AstedLogo';

interface SidebarProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  activeCategory: GameCategory;
  onSelectCategory: (category: GameCategory) => void;
  activeMode: 'casino' | 'sports';
  onSelectMode: (mode: 'casino' | 'sports') => void;
  onOpenSearch: () => void;
  onOpenSupport: () => void;
  savedCount: number;
  totalWagered: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isExpanded,
  onToggleExpand,
  activeCategory,
  onSelectCategory,
  activeMode,
  onSelectMode,
  onOpenSearch,
  onOpenSupport,
  savedCount,
  totalWagered,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isExpanded && (
        <div
          onClick={onToggleExpand}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-[#1a2c38] border-r border-[#213743] z-40 transition-all duration-300 flex flex-col justify-between ${
          isExpanded ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-[72px]'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Top Search & Toggle Bar inside Sidebar */}
          <div className="p-3 border-b border-[#213743]">
            {isExpanded ? (
              <div className="space-y-3">
                {/* Search Bar Input */}
                <button
                  onClick={onOpenSearch}
                  className="w-full flex items-center justify-between bg-[#0f212e] hover:bg-[#162734] border border-[#2f4553] rounded-lg px-3 py-2 text-xs text-[#b1bad3] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Search size={14} className="text-[#557086]" />
                    <span>Buscar Asted...</span>
                  </div>
                  <span className="bg-[#213743] text-[#b1bad3] text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                    Ctrl + K
                  </span>
                </button>

                {/* Segmented Mode Switcher: Casino | Deportes */}
                <div className="grid grid-cols-2 p-1 bg-[#0f212e] rounded-lg border border-[#2f4553]">
                  <button
                    onClick={() => onSelectMode('casino')}
                    className={`py-1.5 text-xs font-bold rounded-md transition-colors ${
                      activeMode === 'casino'
                        ? 'bg-[#1475e1] text-white shadow-sm'
                        : 'text-[#b1bad3] hover:text-white'
                    }`}
                  >
                    Casino
                  </button>
                  <button
                    onClick={() => onSelectMode('sports')}
                    className={`py-1.5 text-xs font-bold rounded-md transition-colors ${
                      activeMode === 'sports'
                        ? 'bg-[#1475e1] text-white shadow-sm'
                        : 'text-[#b1bad3] hover:text-white'
                    }`}
                  >
                    Deportes
                  </button>
                </div>

                {/* VIP Progress Component (Stake layout) */}
                <VipProgress totalWagered={totalWagered} isExpanded={true} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={onToggleExpand}
                  className="p-2 text-[#b1bad3] hover:text-white hover:bg-[#213743] rounded-lg transition-colors"
                  title="Expandir menú"
                >
                  <Menu size={20} />
                </button>
                <button
                  onClick={onOpenSearch}
                  className="p-2 text-[#b1bad3] hover:text-white hover:bg-[#213743] rounded-lg transition-colors"
                  title="Buscar"
                >
                  <Search size={18} />
                </button>
                {/* Collapsed VIP badge */}
                <VipProgress totalWagered={totalWagered} isExpanded={false} />
              </div>
            )}
          </div>

          {/* Nav Items */}
          <div className="p-2 space-y-1">
            {/* Quick user features */}
            <button
              onClick={() => onSelectCategory('my-casino')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeCategory === 'my-casino'
                  ? 'bg-[#213743] text-white'
                  : 'text-[#b1bad3] hover:text-white hover:bg-[#213743]/50'
              }`}
              title="Partidas Guardadas"
            >
              <Bookmark size={18} className="text-[#b1bad3] shrink-0" />
              {isExpanded && (
                <div className="flex items-center justify-between w-full">
                  <span>Partidas Guardadas</span>
                  {savedCount > 0 && (
                    <span className="bg-[#1475e1] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {savedCount}
                    </span>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => onSelectCategory('my-casino')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-[#b1bad3] hover:text-white hover:bg-[#213743]/50 transition-colors"
              title="Siguiendo"
            >
              <Heart size={18} className="text-[#b1bad3] shrink-0" />
              {isExpanded && <span>Siguiendo</span>}
            </button>

            <button
              onClick={() => onSelectCategory('all')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-[#b1bad3] hover:text-white hover:bg-[#213743]/50 transition-colors"
              title="Continuar jugando"
            >
              <PlayCircle size={18} className="text-[#b1bad3] shrink-0" />
              {isExpanded && <span>Continuar jugando</span>}
            </button>

            <button
              onClick={() => onSelectCategory('new-releases')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-[#b1bad3] hover:text-white hover:bg-[#213743]/50 transition-colors"
              title="Juegos Para Ti"
            >
              <PlusSquare size={18} className="text-[#b1bad3] shrink-0" />
              {isExpanded && <span>Juegos Para Ti</span>}
            </button>

            <button
              onClick={() => onSelectCategory('my-casino')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-[#b1bad3] hover:text-white hover:bg-[#213743]/50 transition-colors"
              title="Mis Apuestas"
            >
              <FileText size={18} className="text-[#b1bad3] shrink-0" />
              {isExpanded && <span>Mis Apuestas</span>}
            </button>

            {/* Separator */}
            <div className="my-2 border-t border-[#213743]" />

            {/* Juegos Category Header */}
            {isExpanded && (
              <div className="px-3 py-1 text-[11px] font-bold text-[#557086] uppercase tracking-wider">
                Juegos
              </div>
            )}

            <button
              onClick={() => onSelectCategory('only-on-asted')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeCategory === 'only-on-asted'
                  ? 'bg-[#213743] text-white'
                  : 'text-[#b1bad3] hover:text-white hover:bg-[#213743]/50'
              }`}
              title="Solo en Asted"
            >
              <div className="shrink-0">
                <AstedExclusiveBadge size={18} />
              </div>
              {isExpanded && <span>Solo en Asted</span>}
            </button>

            <button
              onClick={() => onSelectCategory('new-releases')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeCategory === 'new-releases'
                  ? 'bg-[#213743] text-white'
                  : 'text-[#b1bad3] hover:text-white hover:bg-[#213743]/50'
              }`}
              title="Lanzamientos"
            >
              <Sparkles size={18} className="text-[#b1bad3] shrink-0" />
              {isExpanded && <span>Lanzamientos</span>}
            </button>

            <button
              onClick={() => onSelectCategory('slots')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeCategory === 'slots'
                  ? 'bg-[#213743] text-white'
                  : 'text-[#b1bad3] hover:text-white hover:bg-[#213743]/50'
              }`}
              title="Slots"
            >
              <span className="font-mono font-black text-xs bg-amber-400 text-[#0f212e] px-1 rounded shrink-0">
                777
              </span>
              {isExpanded && <span>Slots</span>}
            </button>

            <button
              onClick={() => onSelectCategory('asted-originals')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeCategory === 'asted-originals'
                  ? 'bg-[#213743] text-white'
                  : 'text-[#b1bad3] hover:text-white hover:bg-[#213743]/50'
              }`}
              title="Originales de Asted"
            >
              <Flame size={18} className="text-[#00e701] shrink-0" />
              {isExpanded && <span>Originales de Asted</span>}
            </button>

            <button
              onClick={() => onSelectCategory('live-casino')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeCategory === 'live-casino'
                  ? 'bg-[#213743] text-white'
                  : 'text-[#b1bad3] hover:text-white hover:bg-[#213743]/50'
              }`}
              title="Casino en Vivo"
            >
              <Tv size={18} className="text-[#b1bad3] shrink-0" />
              {isExpanded && <span>Casino en Vivo</span>}
            </button>

            <button
              onClick={() => onSelectCategory('table-games')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeCategory === 'table-games'
                  ? 'bg-[#213743] text-white'
                  : 'text-[#b1bad3] hover:text-white hover:bg-[#213743]/50'
              }`}
              title="Juegos de Mesa"
            >
              <Dices size={18} className="text-[#b1bad3] shrink-0" />
              {isExpanded && <span>Juegos de Mesa</span>}
            </button>

            {/* Separator */}
            <div className="my-2 border-t border-[#213743]" />

            <button
              onClick={onOpenSupport}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-[#b1bad3] hover:text-white hover:bg-[#213743]/50 transition-colors"
              title="Soporte en vivo"
            >
              <Headphones size={18} className="text-[#00e701] shrink-0" />
              {isExpanded && <span>Soporte en Vivo 24/7</span>}
            </button>
          </div>
        </div>

        {/* Bottom Sidebar: Language selector */}
        {isExpanded && (
          <div className="p-3 border-t border-[#213743] bg-[#0f212e]/50">
            <button className="flex items-center justify-between w-full text-xs text-[#b1bad3] hover:text-white font-medium px-2 py-1.5 rounded transition-colors">
              <div className="flex items-center gap-2">
                <Globe size={15} />
                <span>Español</span>
              </div>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
