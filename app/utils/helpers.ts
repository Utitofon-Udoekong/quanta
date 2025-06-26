import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getDuration(file: File, type: 'audio' | 'video'): number {
    let duration = 0;
    const url = URL.createObjectURL(file);
    const media = document.createElement(type);
    media.src = url;
    media.preload = 'metadata';
    media.onloadedmetadata = () => {
        duration = media.duration;
        //console.log('Duration:', duration, 'seconds');
        URL.revokeObjectURL(url);
    };
    return duration;
}
