import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  whiteText?: boolean;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  whiteText = false,
  showText = true
}) => {
  const sizeMap = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-16',
    xl: 'h-24'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${sizeMap[size]} ${className}`}>
      {/* PISCINAS BRUZZONE Vector Splash Logo */}
      <svg
        viewBox="0 0 320 280"
        className="h-full w-auto aspect-square shrink-0 drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main Splash Gradient (Cyan to Vibrant Blue) */}
          <linearGradient id="splashMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="45%" stopColor="#00B4D8" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Secondary Splash Gradient */}
          <linearGradient id="splashSec" x1="0%" y1="20%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#0096C7" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>

          {/* Text Gradient for PISCINAS */}
          <linearGradient id="textPiscinas" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00BAE8" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>

        {/* Top Left Floating Dot */}
        <circle cx="112" cy="30" r="12" fill="#00B4D8" />

        {/* Top Right Floating Dot */}
        <circle cx="226" cy="32" r="10" fill="#38BDF8" />

        {/* Left Upper Splash Drop */}
        <path
          d="M 115 48 C 98 48, 82 58, 92 68 C 105 78, 138 68, 142 55 C 132 48, 122 48, 115 48 Z"
          fill="url(#splashSec)"
        />

        {/* Left Middle Splash Drop */}
        <path
          d="M 82 85 C 65 92, 58 118, 85 125 C 112 132, 160 98, 148 82 C 128 72, 98 80, 82 85 Z"
          fill="url(#splashMain)"
        />

        {/* Left Bottom Splash Drop */}
        <path
          d="M 125 135 C 102 138, 92 158, 115 168 C 142 178, 175 152, 162 138 C 148 128, 135 132, 125 135 Z"
          fill="url(#splashSec)"
        />

        {/* CENTRAL LARGE DROPLET (Main Splash Curve) */}
        <path
          d="M 160 20 C 188 38, 222 108, 172 165 C 158 180, 142 182, 136 172 C 128 158, 138 128, 148 95 C 158 62, 150 32, 160 20 Z"
          fill="url(#splashMain)"
        />

        {/* Dark Blue Shadow Arc at Central Droplet Bottom */}
        <path
          d="M 136 172 C 155 188, 195 150, 172 165 C 155 178, 142 178, 136 172 Z"
          fill="#1E3A8A"
        />

        {/* Right Large Splash Drop */}
        <path
          d="M 190 85 C 220 70, 258 92, 245 138 C 232 178, 172 188, 156 190 C 182 180, 225 158, 222 130 C 220 108, 198 95, 190 85 Z"
          fill="url(#splashMain)"
        />

        {/* Dark Blue Shadow Arc at Right Splash Bottom */}
        <path
          d="M 156 190 C 190 182, 242 152, 245 138 C 238 162, 185 186, 156 190 Z"
          fill="#1E3A8A"
        />
      </svg>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span
            className="font-black tracking-[0.18em] text-[1.15em] bg-gradient-to-r from-[#00C2FF] via-[#0096C7] to-[#1D4ED8] bg-clip-text text-transparent uppercase"
            style={{ fontFamily: "'Montserrat', 'Outfit', sans-serif" }}
          >
            PISCINAS
          </span>
          <span
            className={`font-black tracking-[0.24em] text-[0.88em] uppercase ${
              whiteText ? 'text-white' : 'text-[#1B365D]'
            }`}
            style={{ fontFamily: "'Montserrat', 'Outfit', sans-serif" }}
          >
            BRUZZONE
          </span>
        </div>
      )}
    </div>
  );
};

