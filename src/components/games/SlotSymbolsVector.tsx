import React from 'react';

interface SymbolVectorProps {
  id: string;
  size?: number;
  className?: string;
}

export const SlotSymbolVector: React.FC<SymbolVectorProps> = ({ id, size = 48, className = '' }) => {
  switch (id) {
    // ------------------------------------------------------------------------
    // Furia de Anubis & Oro Sagrado (Ancient Egyptian PBR 24K Gold & Lapis)
    // ------------------------------------------------------------------------
    case 'anubis':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
          <defs>
            <linearGradient id="gold24k" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="25%" stopColor="#ca8a04" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="75%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
            <linearGradient id="lapisGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <radialGradient id="eyeRedGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="70%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#450a0a" />
            </radialGradient>
          </defs>
          {/* Sarcophagus Headdress (Nemes) with Gold & Lapis Stripes */}
          <path d="M20 30 L50 10 L80 30 L85 85 L15 85 Z" fill="url(#lapisGrad)" stroke="url(#gold24k)" strokeWidth="2.5" />
          <path d="M28 32 L36 85" stroke="url(#gold24k)" strokeWidth="3" />
          <path d="M42 25 L44 85" stroke="url(#gold24k)" strokeWidth="3" />
          <path d="M58 25 L56 85" stroke="url(#gold24k)" strokeWidth="3" />
          <path d="M72 32 L64 85" stroke="url(#gold24k)" strokeWidth="3" />
          {/* Jackal Head of Anubis */}
          <path d="M30 35 L40 18 L48 30 L52 30 L60 18 L70 35 L66 65 L50 78 L34 65 Z" fill="#090d16" stroke="url(#gold24k)" strokeWidth="2" />
          {/* Ears with Gold inner plate */}
          <path d="M32 32 L40 20 L44 32 Z" fill="url(#gold24k)" />
          <path d="M68 32 L60 20 L56 32 Z" fill="url(#gold24k)" />
          {/* Glowing Red Eyes of Ra */}
          <ellipse cx="42" cy="46" rx="4.5" ry="2.5" fill="url(#eyeRedGlow)" />
          <ellipse cx="58" cy="46" rx="4.5" ry="2.5" fill="url(#eyeRedGlow)" />
          <circle cx="43" cy="45.5" r="1" fill="#ffffff" />
          <circle cx="57" cy="45.5" r="1" fill="#ffffff" />
          {/* Golden Pharaoh Beard & Torc */}
          <path d="M47 78 L53 78 L52 94 L48 94 Z" fill="url(#gold24k)" stroke="#ca8a04" strokeWidth="1" />
          <line x1="47" y1="82" x2="53" y2="82" stroke="#713f12" strokeWidth="1" />
          <line x1="47" y1="86" x2="53" y2="86" stroke="#713f12" strokeWidth="1" />
          <line x1="47" y1="90" x2="53" y2="90" stroke="#713f12" strokeWidth="1" />
          {/* Solar Disc Crown */}
          <circle cx="50" cy="12" r="7" fill="url(#gold24k)" stroke="#ca8a04" strokeWidth="1" />
        </svg>
      );

    case 'scarab':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
          <defs>
            <linearGradient id="cyanWings" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#082f49" />
            </linearGradient>
            <radialGradient id="sunDisc" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#991b1b" />
            </radialGradient>
          </defs>
          {/* Solar Disc Held above */}
          <circle cx="50" cy="18" r="10" fill="url(#sunDisc)" stroke="url(#gold24k)" strokeWidth="1.5" />
          {/* Front Horns holding Sun */}
          <path d="M42 34 C38 24, 42 18, 48 18" fill="none" stroke="url(#gold24k)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M58 34 C62 24, 58 18, 52 18" fill="none" stroke="url(#gold24k)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Iridescent Wings */}
          <path d="M35 48 C15 35, 10 70, 40 85 C32 68, 30 55, 35 48 Z" fill="url(#cyanWings)" stroke="url(#gold24k)" strokeWidth="2" />
          <path d="M65 48 C85 35, 90 70, 60 85 C68 68, 70 55, 65 48 Z" fill="url(#cyanWings)" stroke="url(#gold24k)" strokeWidth="2" />
          {/* Carapace & Thorax (Solid 24K Gold) */}
          <ellipse cx="50" cy="45" rx="14" ry="10" fill="url(#gold24k)" stroke="#854d0e" strokeWidth="1.5" />
          <path d="M38 52 C38 78, 62 78, 62 52 Z" fill="url(#gold24k)" stroke="#854d0e" strokeWidth="1.5" />
          <line x1="50" y1="52" x2="50" y2="76" stroke="#713f12" strokeWidth="2" />
          {/* Golden Legs */}
          <path d="M36 60 Q20 62 16 75" fill="none" stroke="url(#gold24k)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M64 60 Q80 62 84 75" fill="none" stroke="url(#gold24k)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'eye':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
          {/* Eye of Horus (Wedjat) Solid Gold & Turquoise */}
          <path
            d="M15 50 C28 30, 72 30, 85 50 C72 70, 28 70, 15 50 Z"
            fill="#0f172a"
            stroke="url(#gold24k)"
            strokeWidth="3.5"
          />
          {/* Upper Eyelid Arch */}
          <path d="M15 48 C30 26, 70 26, 85 48" fill="none" stroke="url(#gold24k)" strokeWidth="4" />
          {/* Iris & Pupil */}
          <circle cx="50" cy="50" r="14" fill="#0284c7" stroke="url(#gold24k)" strokeWidth="2" />
          <circle cx="50" cy="50" r="7" fill="#090d16" />
          <circle cx="48" cy="48" r="2.5" fill="#ffffff" />
          {/* Falcon markings below eye */}
          <path d="M36 65 L36 84 C36 88, 30 92, 24 92" fill="none" stroke="url(#gold24k)" strokeWidth="4" strokeLinecap="round" />
          <path d="M60 65 Q70 80, 78 78 Q74 65, 66 62" fill="url(#gold24k)" />
          {/* Teardrop curl */}
          <circle cx="24" cy="92" r="3" fill="url(#gold24k)" />
        </svg>
      );

    case 'pyramid':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
          {/* Golden Pyramid with Radiant Sunbeams */}
          <defs>
            <linearGradient id="pyrLight" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="pyrShadow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>
          {/* Base */}
          <polygon points="50,15 15,80 50,88" fill="url(#pyrLight)" stroke="#ca8a04" strokeWidth="1" />
          <polygon points="50,15 50,88 85,80" fill="url(#pyrShadow)" stroke="#854d0e" strokeWidth="1" />
          {/* Capstone of Pure Radiant Gold */}
          <polygon points="50,15 40,32 50,34" fill="#ffffff" />
          <polygon points="50,15 50,34 60,32" fill="#fef08a" />
          {/* Carved Block Lines */}
          <line x1="33" y1="45" x2="50" y2="48" stroke="#854d0e" strokeWidth="1" />
          <line x1="50" y1="48" x2="67" y2="45" stroke="#713f12" strokeWidth="1" />
          <line x1="24" y1="62" x2="50" y2="67" stroke="#854d0e" strokeWidth="1" />
          <line x1="50" y1="67" x2="76" y2="62" stroke="#713f12" strokeWidth="1" />
          {/* All-seeing Eye on Capstone */}
          <circle cx="50" cy="25" r="2.5" fill="#f59e0b" />
        </svg>
      );

    case 'ankh':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
          {/* Crux Ansata (Ankh of Immortality) */}
          {/* Loop */}
          <ellipse cx="50" cy="30" rx="14" ry="18" fill="none" stroke="url(#gold24k)" strokeWidth="6" />
          <ellipse cx="50" cy="30" rx="8" ry="12" fill="none" stroke="#713f12" strokeWidth="1" />
          {/* Horizontal crossbar */}
          <rect x="22" y="46" width="56" height="8" rx="3" fill="url(#gold24k)" stroke="#854d0e" strokeWidth="1" />
          {/* Vertical stem */}
          <rect x="46" y="52" width="8" height="42" rx="2" fill="url(#gold24k)" stroke="#854d0e" strokeWidth="1" />
          {/* Center Gemstone */}
          <circle cx="50" cy="50" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
        </svg>
      );

    case 'scepter':
    case 'scroll':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
          {/* Pharaoh Was-Scepter / Papyrus */}
          <path d="M38 18 C30 18, 30 32, 45 35 L45 88 L55 88 L55 35 C70 32, 70 18, 62 18 Z" fill="url(#gold24k)" stroke="#854d0e" strokeWidth="2" />
          <circle cx="50" cy="24" r="5" fill="#06b6d4" />
          <path d="M40 88 L50 96 L60 88 Z" fill="url(#gold24k)" />
        </svg>
      );

    case 'ruby':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
          {/* Faceted Ruby Gem of Pharaoh */}
          <polygon points="50,10 85,35 50,90 15,35" fill="#b91c1c" stroke="#fca5a5" strokeWidth="2" />
          <polygon points="50,10 85,35 68,35 50,22 32,35 15,35" fill="#f87171" />
          <polygon points="50,22 68,35 50,90" fill="#dc2626" />
          <polygon points="50,22 32,35 50,90" fill="#991b1b" />
          <circle cx="48" cy="22" r="3" fill="#ffffff" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // Buffalo & Wild West Icons (High-res vectors)
    // ------------------------------------------------------------------------
    case 'buffalo':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
          {/* Golden Prairie Buffalo */}
          <circle cx="50" cy="50" r="44" fill="#451a03" stroke="url(#gold24k)" strokeWidth="3" />
          {/* Horns */}
          <path d="M22 38 C20 18, 42 16, 44 32" fill="none" stroke="url(#gold24k)" strokeWidth="5" strokeLinecap="round" />
          <path d="M78 38 C80 18, 58 16, 56 32" fill="none" stroke="url(#gold24k)" strokeWidth="5" strokeLinecap="round" />
          {/* Head */}
          <path d="M30 36 L70 36 L64 74 L50 82 L36 74 Z" fill="url(#gold24k)" stroke="#78350f" strokeWidth="2" />
          <ellipse cx="40" cy="48" rx="3" ry="2" fill="#000000" />
          <ellipse cx="60" cy="48" rx="3" ry="2" fill="#000000" />
          <ellipse cx="50" cy="68" rx="6" ry="4" fill="#78350f" />
        </svg>
      );

    case 'eagle':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
          <circle cx="50" cy="50" r="42" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
          <path d="M32 30 C32 20, 68 20, 68 30 C68 55, 60 70, 50 78 C40 70, 32 55, 32 30 Z" fill="#ffffff" />
          <path d="M46 48 L65 52 L50 62 Z" fill="#f59e0b" />
          <circle cx="44" cy="40" r="3.5" fill="#f59e0b" />
          <circle cx="44" cy="40" r="1.5" fill="#000000" />
        </svg>
      );

    case 'coin':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
          <circle cx="50" cy="50" r="42" fill="url(#gold24k)" stroke="#78350f" strokeWidth="3" />
          <circle cx="50" cy="50" r="34" fill="none" stroke="#fef08a" strokeWidth="2" strokeDasharray="3 3" />
          <text x="50" y="58" fontSize="22" fontWeight="900" fill="#78350f" textAnchor="middle" fontFamily="sans-serif">
            10×
          </text>
        </svg>
      );

    // ------------------------------------------------------------------------
    // Zeus / Gates of Olympus Icons
    // ------------------------------------------------------------------------
    case 'zeus':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
          <circle cx="50" cy="50" r="42" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="3" />
          <path d="M54 16 L28 48 L46 48 L38 84 L72 44 L52 44 Z" fill="#facc15" stroke="#ffffff" strokeWidth="2" />
        </svg>
      );

    case 'crown':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
          <path d="M20 70 L25 35 L40 52 L50 25 L60 52 L75 35 L80 70 Z" fill="url(#gold24k)" stroke="#854d0e" strokeWidth="2" />
          <circle cx="25" cy="32" r="3" fill="#ef4444" />
          <circle cx="50" cy="22" r="4" fill="#38bdf8" />
          <circle cx="75" cy="32" r="3" fill="#ef4444" />
          <rect x="20" y="68" width="60" height="8" rx="2" fill="url(#gold24k)" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
          <circle cx="50" cy="50" r="38" fill="url(#gold24k)" stroke="#78350f" strokeWidth="2" />
          <circle cx="50" cy="50" r="8" fill="#ffffff" />
        </svg>
      );
  }
};
