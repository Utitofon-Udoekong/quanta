
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import { createClient } from "./supabase/client";

export const signOut = async (): Promise<boolean> => {
    const supabase = createClient();
    const { logout } = useAbstraxionSigningClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
        return false;
    }
    if (logout) {
        logout();
    }
    return true;
};

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
        console.log('Duration:', duration, 'seconds');
        URL.revokeObjectURL(url);
    };
    return duration;
}
