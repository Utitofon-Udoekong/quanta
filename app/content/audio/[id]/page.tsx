'use client';

import { useState, useEffect, use } from "react";
import { type Audio } from "@/app/types";
import Link from 'next/link';
import { ArrowLeftIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { trackContentView } from '@/app/utils/content';
import AuthorInfo from '@/app/components/ui/AuthorInfo';
import CustomAudioPlayer from '@/app/components/ui/CustomAudioPlayer';
import { useUserStore } from '@/app/stores/user';

export default function AudioPage({ params }: { params: Promise<{ id: string }> }) {
    const [audio, setAudio] = useState<Audio | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const {id} = use(params);
    const {user} = useUserStore();

    useEffect(() => {
        const fetchAudio = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/content/audio/${id}`);
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to fetch audio');
                }
                
                const audioData = await response.json();
                
                if (user) {
                    const combinedData = {
                        ...audioData,
                        author: {
                            id: user.id,
                            full_name: user.full_name,
                            avatar_url: user.avatar_url,
                        }
                    };
                    setAudio(combinedData);
                    trackContentView(audioData.id, 'audio', user.id);
                } else {
                    setAudio(audioData);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch audio');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAudio();
    }, [id, user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-lg text-center">
                <h1 className="text-2xl font-bold mb-4">Error</h1>
                <p className="text-gray-300">{error}</p>
                <Link href="/" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
                    Back to Home
                </Link>
            </div>
        );
    }

    if (!audio) {
        return (
            <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-lg text-center">
                <h1 className="text-2xl font-bold mb-4">Audio Not Found</h1>
                <p className="text-gray-300">The audio you're looking for doesn't exist or is not published.</p>
                <Link href="/" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Link 
                href="/" 
                className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6"
            >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Home
            </Link>
            
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
                <div className="p-8">
                    <div className="mb-6">
                        <AuthorInfo author={audio.author} createdAt={audio.created_at} />
                    </div>
                    
                    <h1 className="text-3xl font-bold mb-4">{audio.title}</h1>
                    
                    {audio.description && (
                        <p className="text-xl text-gray-300 mb-6 italic border-l-4 border-purple-500 pl-4">
                            {audio.description}
                        </p>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-400 mb-8">
                        <div className="flex items-center mr-4">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {new Date(audio.created_at).toLocaleDateString()}
                        </div>
                        {audio.duration && (
                            <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {Math.floor(audio.duration / 60)}:{(audio.duration % 60).toString().padStart(2, '0')}
                            </div>
                        )}
                    </div>
                    
                    <CustomAudioPlayer 
                        src={audio.audio_url} 
                        title={audio.title}
                        className="mb-6"
                    />
                </div>
            </div>
        </div>
    );
}