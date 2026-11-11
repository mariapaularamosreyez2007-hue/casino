import React, { useState, useEffect } from 'react';
import { GameItem } from '../types';
import { AstedExclusiveBadge } from './AstedLogo';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroCarouselProps {
  onPlayGame: (gameId: string) => void;
}

interface BannerSlide {
  id: string;
  gameId: string;
  badge: string;
  title: string;
  provider: string;
  description: string;
  bgGradient: string;
  icon: string;
  image?: string;
}

const SLIDES: BannerSlide[] = [
  {
    id: 'b1',
    gameId: 'lab-breach',
    badge: 'Solo en Asted',
    title: 'Lab Breach',
    provider: 'Sunnie Gaming',
    description: '¡Desata los químicos multiplicadores en el laboratorio secreto de bioseguridad!',
    bgGradient: 'from-cyan-900 via-[#1a2c38] to-[#0f212e]',
    icon: '🧪',
    image: '/assets/games/lab-breach.png',
  },
  {
    id: 'b2',
    gameId: 'mines',
    badge: 'Originales de Asted',
    title: 'Mines VIP',
    provider: 'Asted Originals',
    description: 'Multiplicadores de hasta 5,000,000x y 99% de RTP con juego Provably Fair garantizado.',
    bgGradient: 'from-blue-950 via-[#1a2c38] to-[#0f212e]',
    icon: '💎',
    image: '/assets/games/mines.png',
  },
  {
    id: 'b3',
    gameId: 'gates-of-olympus-1000',
    badge: 'Lanzamiento Exclusivo',
    title: "Gates of Olympus 1000",
    provider: 'Pragmatic Play',
    description: 'Los orbes de Zeus alcanzan ahora multiplicadores colosales de 1,000x en cada caída.',
    bgGradient: 'from-indigo-950 via-[#1a2c38] to-[#0f212e]',
    icon: '⚡',
    image: '/assets/games/gates-of-olympus-1000.png',
  },
  {
    id: 'b4',
    gameId: 'gator-hunters',
    badge: 'Solo en Asted',
    title: "Nolimit's 'Double Trouble'",
    provider: 'Nolimit City',
    description: '¡Potencial de ganancia máxima duplicado y comodines xWays salvajes!',
    bgGradient: 'from-emerald-950 via-[#1a2c38] to-[#0f212e]',
    icon: '🐊',
    image: '/assets/games/gator-hunters.png',
  },
];

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onPlayGame }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#1a2c38] border border-[#213743] shadow-lg mb-6 group">
      {/* Background slide texture */}
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} transition-all duration-700`} />

      {/* Slide Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 gap-6 min-h-[220px]">
        {/* Left Side: Game Art / Icon */}
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#0f212e] border-2 border-[#2f4553] shadow-2xl flex items-center justify-center shrink-0 overflow-hidden">
            {slide.image ? (
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl sm:text-6xl">{slide.icon}</span>
            )}
          </div>

          <div className="flex flex-col items-start space-y-1.5">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-[#00e701]/15 border border-[#00e701]/30 text-[#00e701] px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide">
              <AstedExclusiveBadge size={14} />
              <span>{slide.badge}</span>
            </div>

            {/* Title & Provider */}
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {slide.title}
            </h2>
            <span className="text-xs font-semibold text-[#b1bad3] tracking-wider uppercase">
              {slide.provider}
            </span>
            <p className="text-xs sm:text-sm text-[#b1bad3]/90 max-w-md hidden sm:block">
              {slide.description}
            </p>
          </div>
        </div>

        {/* Right Side: CTA Button and Navigation */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <button
            onClick={() => onPlayGame(slide.gameId)}
            className="w-full md:w-auto px-6 py-3 bg-[#1475e1] hover:bg-[#0f60c7] text-white font-extrabold text-sm rounded-xl transition-all transform active:scale-95 shadow-lg shadow-[#1475e1]/30 flex items-center justify-center gap-2"
          >
            <Play size={16} fill="currentColor" />
            <span>Jugar ahora</span>
          </button>
        </div>
      </div>

      {/* Carousel Dots & Controls */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-[#0f212e]/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
          className="text-[#b1bad3] hover:text-white p-0.5 transition-colors"
          title="Anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1 px-1">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentSlide === idx ? 'w-5 bg-white' : 'w-1.5 bg-[#557086] hover:bg-[#b1bad3]'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
          className="text-[#b1bad3] hover:text-white p-0.5 transition-colors"
          title="Siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
