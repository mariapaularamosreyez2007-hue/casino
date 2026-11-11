import React from 'react';
import { GameCategory } from '../types';
import {
  Gamepad2,
  User,
  Sparkles,
  Flame,
  Tv,
  Dices,
  CircleDot
} from 'lucide-react';
import { AstedExclusiveBadge } from './AstedLogo';

interface CategoryNavProps {
  activeCategory: GameCategory;
  onSelectCategory: (category: GameCategory) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  const categories: { id: GameCategory; label: string; icon: React.ReactNode }[] = [
    {
      id: 'all',
      label: 'Inicio del Casino',
      icon: <Gamepad2 size={16} />,
    },
    {
      id: 'my-casino',
      label: 'Mi casino',
      icon: <User size={16} />,
    },
    {
      id: 'only-on-asted',
      label: 'Solo en Asted',
      icon: <AstedExclusiveBadge size={16} />,
    },
    {
      id: 'new-releases',
      label: 'Lanzamientos',
      icon: <Sparkles size={16} />,
    },
    {
      id: 'asted-originals',
      label: 'Originales de Asted',
      icon: <Flame size={16} />,
    },
    {
      id: 'slots',
      label: 'Slots',
      icon: (
        <span className="font-mono font-black text-xs tracking-tighter bg-amber-400 text-[#0f212e] px-1 rounded">
          777
        </span>
      ),
    },
    {
      id: 'live-casino',
      label: 'Casino en Vivo',
      icon: <Tv size={16} />,
    },
    {
      id: 'table-games',
      label: 'Juegos de Mesa',
      icon: <Dices size={16} />,
    },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-3 mb-6">
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#213743] text-white shadow-md border border-[#2f4553]'
                  : 'bg-[#1a2c38] text-[#b1bad3] hover:text-white hover:bg-[#213743]/60 border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-[#00e701]' : 'text-[#b1bad3]'}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
