import React from 'react';

interface GeneralButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function GeneralButton({ children, className = '', ...props }: GeneralButtonProps) {
  return (
    <button
      className={`bg-gradient-to-r from-[#8B25FF] to-[#350FDD] cursor-pointer text-white px-6 py-2 rounded-full font-semibold shadow-lg ${className}`}
      {...props}
    >
      {children}
    </button>
  );
} 