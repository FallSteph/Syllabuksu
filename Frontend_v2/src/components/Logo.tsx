import React from 'react';
import { BookOpen } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  const textClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} gradient-primary rounded-xl flex items-center justify-center shadow-soft`}>
        <BookOpen className={`${size === 'lg' ? 'h-8 w-8' : size === 'md' ? 'h-6 w-6' : 'h-5 w-5'} text-primary-foreground`} />
      </div>
      {showText && (
        <span className={`${textClasses[size]} font-bold text-foreground tracking-tight`}>
          Syllabo
        </span>
      )}
    </div>
  );
}
