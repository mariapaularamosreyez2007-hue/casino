import React from 'react';

interface AstedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadgeOnly?: boolean;
}

export const AstedLogo: React.FC<AstedLogoProps> = ({
  className = '',
  size = 'md',
  showBadgeOnly = false,
}) => {
  const heightMap = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-12',
  };

  if (showBadgeOnly) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-[#1a2c38] to-[#0f212e] border border-[#2f4553] p-1 shadow-inner ${className}`}
        title="ASTED"
      >
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full fill-current text-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized geometric circular badge with 'A' swirl inspired by Stake */}
          <rect width="40" height="40" rx="10" fill="#1475e1" fillOpacity="0.15" />
          <path
            d="M20 7 C14 7 9 12 9 19 C9 24.5 12.8 29.2 18 30.5 L18 26 C15 25 13 22.2 13 19 C13 14.5 16.5 11 20.5 11 C24.5 11 27.5 14 27.5 18 C27.5 21 26 23.5 23.5 24.5 C21.5 25.3 19.5 24.5 19.5 23 C19.5 21.8 20.2 21 21.5 20.8 C22.8 20.5 23.8 19.5 23.8 18 C23.8 16.2 22.3 14.8 20.5 14.8 C18.5 14.8 17 16.3 17 18.5 C17 21 19 23 21.5 23.5 L21.5 32 C27 31 31 25.5 31 19 C31 12 26 7 20 7 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${heightMap[size]} ${className}`}>
      {/* Asted Vector Wordmark crafted in fluid script mirroring Stake's signature logo */}
      <svg
        viewBox="0 0 170 48"
        className="h-full w-auto fill-current text-white overflow-visible transition-transform duration-150 hover:scale-[1.02]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="astedLogoGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f4f8" />
          </linearGradient>
        </defs>

        {/* Custom fluid calligraphic wordmark for 'asted' matching Stake's font curves */}
        <g fill="url(#astedLogoGlow)">
          {/* 'a' */}
          <path d="M 28 22 C 26 17 22 15 16 15 C 9 15 3 20 3 28 C 3 36 9 41 17 41 C 23 41 27 38 29 33 L 29 40 L 35 40 L 35 17 L 29 17 L 28 22 Z M 18 35 C 12 35 9 32 9 28 C 9 23 12 21 17 21 C 22 21 28 23 28 28 C 28 33 23 35 18 35 Z" />

          {/* 's' */}
          <path d="M 58 21 C 55 17 50 15 44 15 C 37 15 33 18 33 22 C 33 27 38 29 44 30 C 51 32 54 34 54 38 C 54 43 49 45 42 45 C 35 45 30 42 27 37 L 32 33 C 34 37 38 39 43 39 C 48 39 50 37 50 34 C 50 30 46 29 40 27 C 34 25 29 23 29 18 C 29 13 34 10 43 10 C 49 10 54 13 57 16 L 58 21 Z" />

          {/* 't' */}
          <path d="M 72 15 L 72 6 L 66 6 L 66 15 L 60 15 L 60 21 L 66 21 L 66 33 C 66 38 69 41 76 41 C 79 41 81 40 83 39 L 81 33 C 80 34 78 35 76 35 C 73 35 72 34 72 31 L 72 21 L 82 21 L 82 15 L 72 15 Z" />

          {/* 'e' */}
          <path d="M 103 27 C 103 20 98 15 91 15 C 83 15 77 21 77 29 C 77 37 83 42 92 42 C 99 42 104 38 107 33 L 101 29 C 99 33 96 36 92 36 C 86 36 83 32 83 27 L 103 27 Z M 83 23 C 84 19 87 19 91 19 C 95 19 98 20 98 23 L 83 23 Z" />

          {/* 'd' */}
          <path d="M 129 6 L 123 6 L 123 18 C 121 16 117 15 113 15 C 105 15 99 21 99 28 C 99 36 105 41 113 41 C 117 41 121 40 123 37 L 123 40 L 129 40 L 129 6 Z M 114 35 C 109 35 105 32 105 28 C 105 24 109 21 114 21 C 119 21 123 24 123 28 C 123 32 119 35 114 35 Z" />
        </g>
      </svg>
    </div>
  );
};

export const AstedExclusiveBadge: React.FC<{ size?: number; className?: string }> = ({
  size = 22,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-[#0f212e]/90 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md ${className}`}
      title="Asted Exclusive"
    >
      <span className="text-[11px] font-black tracking-tighter text-white select-none">A</span>
    </div>
  );
};
