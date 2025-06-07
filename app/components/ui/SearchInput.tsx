import React from 'react';

interface SearchInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'Search music, artist, albums...', className = '' }: SearchInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-2 rounded-full bg-[#212121] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
    />
  );
} 