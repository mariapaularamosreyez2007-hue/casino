import React, { useState } from 'react';
import { GameItem } from '../types';
import { AstedExclusiveBadge } from './AstedLogo';
import { Play, Heart } from 'lucide-react';

interface GameCardProps {
  game: GameItem;
  onSelect: (game: GameItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex flex-col group select-none">
      {/* Game Poster Tile */}
      <div
        onClick={() => onSelect(game)}
        className="relative w-full aspect-[153/206] rounded-xl overflow-hidden cursor-pointer bg-[#1a2c38] border border-[#213743] transition-all duration-200 transform group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.6)] group-hover:border-[#2f4553]"
      >
        {/* Cover Image from Stake */}
        {game.image && !imageError ? (
          <img
            src={game.image}
            alt={game.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* Fallback Gradient Graphic if image fails */
          <div className="w-full h-full bg-gradient-to-br from-[#1a2c38] to-[#0f212e] flex flex-col items-center justify-center p-3 text-center">
            <span className="text-3xl mb-2">🎰</span>
            <span className="text-xs font-bold text-white uppercase">{game.title}</span>
          </div>
        )}

        {/* Top-right Favorite Heart */}
        {onToggleFavorite && (
          <button
            onClick={(e) => onToggleFavorite(game.id, e)}
            className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs shadow-md"
            title="Favorito"
          >
            <Heart
              size={14}
              fill={isFavorite ? '#ed4245' : 'none'}
              className={isFavorite ? 'text-[#ed4245]' : 'text-white'}
            />
          </button>
        )}

        {/* Hover Overlay with Authentic Stake Play Button */}
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#00e701] text-[#0f212e] flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-200">
            <Play size={22} fill="currentColor" className="ml-1" />
          </div>
        </div>
      </div>

      {/* Players Online Count (Stake exact subtitle: green dot + 'XXXX jugando') */}
      <div className="flex items-center gap-1.5 mt-2 px-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00e701] shadow-[0_0_6px_#00e701]" />
        <span className="text-[11px] font-semibold text-[#b1bad3]">
          {game.playersCount.toLocaleString()} jugando
        </span>
      </div>
    </div>
  );
};
