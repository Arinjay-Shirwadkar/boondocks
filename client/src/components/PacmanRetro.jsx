import React from 'react';

export default function PacmanRetro() {
  return (
    <div className="my-4 inline-flex items-center gap-3 border-4 border-[#DC143C] bg-black px-4 py-2.5 shadow-[5px_5px_0_#FFFDD0]">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-[#FFFDD0]">
          8-BIT COMPATIBILITY RADAR
        </span>
        <span className="text-xs font-bold text-[#DC143C]">//</span>
      </div>

      <div className="relative flex items-center h-8 w-44 overflow-hidden border-2 border-[#DC143C] bg-[#0a0a0a] px-2 select-none">
        {/* Pac-Man Character */}
        <div className="relative z-10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" className="overflow-visible">
            {/* Top Jaw */}
            <path
              d="M 12 12 L 23 4 A 11 11 0 0 0 1 12 Z"
              fill="#FFFDD0"
              style={{
                transformOrigin: '12px 12px',
                animation: 'pacman-top 0.32s infinite linear alternate',
              }}
            />
            {/* Eye */}
            <circle cx="10" cy="6.5" r="1.5" fill="#000000" />
            {/* Bottom Jaw */}
            <path
              d="M 12 12 L 23 20 A 11 11 0 0 1 1 12 Z"
              fill="#FFFDD0"
              style={{
                transformOrigin: '12px 12px',
                animation: 'pacman-bottom 0.32s infinite linear alternate',
              }}
            />
          </svg>
        </div>

        {/* Animated Crimson Dots */}
        <div
          className="flex items-center gap-4 pl-3"
          style={{
            animation: 'pacman-dots 0.9s infinite linear',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((dot) => (
            <div
              key={dot}
              className="w-2.5 h-2.5 rounded-full bg-[#DC143C] shadow-[0_0_6px_#DC143C] shrink-0"
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pacman-top {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-36deg); }
        }
        @keyframes pacman-bottom {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(36deg); }
        }
        @keyframes pacman-dots {
          0% { transform: translateX(0); }
          100% { transform: translateX(-26px); }
        }
      `}</style>
    </div>
  );
}

