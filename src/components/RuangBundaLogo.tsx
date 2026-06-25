import React from 'react';

interface RuangBundaLogoProps {
  className?: string;
  size?: number | string;
  showBackdrop?: boolean;
}

export default function RuangBundaLogo({ className = "w-8 h-8", size, showBackdrop = true }: RuangBundaLogoProps) {
  const style = size ? { width: size, height: size } : {};
  const mainFill = showBackdrop ? "#FFFFFF" : "#FF55A3";
  const heartFill = showBackdrop ? "#FF55A3" : "#FFFFFF";
  
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`inline-block select-none ${className}`}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Pink Heart Backdrop (Matching the uploaded image's vibrant pink color #FF55A3) */}
      {showBackdrop && (
        <path 
          d="M50,88 C12,55 2,33 2,20 A19,19 0 0,1 40,8 A19,19 0 0,1 50,18 A19,19 0 0,1 60,8 A19,19 0 0,1 98,20 C98,33 88,55 50,88 Z" 
          fill="#FF55A3" 
        />
      )}
      
      {/* White Mother Silhouette Group */}
      <g transform="translate(1, -1)">
        {/* Head of the mother */}
        <circle cx="50" cy="27" r="4.5" fill={mainFill} />
        
        {/* Elegant flowing hair silhouette */}
        <path 
          d="M 50,30.5 
             C 47,31 44,35 44,39
             C 44,45 40,51 40,56
             C 40,64 45,71 45,76
             C 42,75 39,71 39,64
             C 39,58 41,52 41,47
             C 41,41 45,34 50,30.5 Z" 
          fill={mainFill} 
        />
        
        {/* Body, breast, pregnant belly, and legs silhouette */}
        <path 
          d="M 50,31.5 
             C 52,33 53,36 53,38
             C 53,42 56,43 57,45
             C 58,47 57,49 53,51
             C 53,51 58,52 61,56
             C 64,60 63,66 59,71
             C 56,74 52,75 50,76
             C 47,77 45,74 45,71
             C 45,63 47,56 47,48
             C 47,42 49,35 50,31.5 Z" 
          fill={mainFill} 
        />
        
        {/* Arm cradling the belly */}
        <path 
          d="M 48,39
             C 49,42 51,46 51,51
             C 51,56 54,61 57,63
             C 55,63 52,61 50,56
             C 48,52 46,46 47,39 Z" 
          fill={mainFill} 
        />

        {/* Small Heart on the belly representing the baby, matching the pink background #FF55A3 */}
        <path 
          d="M 57.5,61.5 
             C 55.5,59.5 54.8,58.2 54.8,57.5 
             A 1.4,1.4 0 0,1 56.9,56.1 
             A 1.4,1.4 0 0,1 57.5,56.8 
             A 1.4,1.4 0 0,1 58.1,56.1 
             A 1.4,1.4 0 0,1 60.2,57.5 
             C 60.2,58.2 59.5,59.5 57.5,61.5 Z" 
          fill={heartFill} 
        />
      </g>
    </svg>
  );
}
