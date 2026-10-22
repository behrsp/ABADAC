import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const AbadaLogo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const sizeMap = {
    sm: 'h-8 w-auto',
    md: 'h-11 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official ABADA-CAPOEIRA Globe Logo provided by user */}
      <img
        src="/assets/aistudio/globo_a30508fe.jpg"
        alt="ABADA - CAPOEIRA"
        className={`${sizeMap[size]} object-contain drop-shadow-md shrink-0 rounded-sm`}
      />

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-black tracking-wide text-white">
            <span className="text-amber-400 font-extrabold text-sm sm:text-base tracking-wider">
              ABADA - CAPOEIRA
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-zinc-400 font-medium tracking-normal line-clamp-1">
            Associação Brasileira de Apoio e Desenvolvimento da Arte-Capoeira
          </span>
        </div>
      )}
    </div>
  );
};
