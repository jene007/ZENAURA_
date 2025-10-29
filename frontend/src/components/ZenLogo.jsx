import React from 'react';

export default function ZenLogo({ size = 40 }){
  // Simple lotus / aura SVG as a compact logo
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ZenAura logo">
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#7dd3fc" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="12" fill="url(#g1)" opacity="0.06" />
      <g transform="translate(8,8)">
        <path d="M24 4c-6 0-12 6-12 12 0 4 4 6 10 6s12-2 12-6c0-6-6-12-10-12z" fill="#fff" opacity="0.95" />
        <path d="M12 18c0 6 12 12 12 12s12-6 12-12c0-2-4-6-12-6S12 16 12 18z" fill="#f472b6" opacity="0.9" />
        <circle cx="18" cy="14" r="3" fill="#fff8" />
      </g>
    </svg>
  );
}
