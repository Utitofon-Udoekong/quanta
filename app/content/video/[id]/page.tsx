'use client';

import { useState, useEffect, use } from "react";
import { UserData, type VideoContent, type Content } from "@/app/types";
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { trackContentView } from '@/app/utils/content';
import AuthorInfo from '@/app/components/ui/AuthorInfo';
import CustomVideoPlayer from '@/app/components/ui/CustomVideoPlayer';
import { useUserStore } from "@/app/stores/user";
import { useRouter } from 'next/navigation';

export default function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [video, setVideo] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = use(params);
  const { user } = useUserStore();
  
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/content/videos/${id}`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch video');
        }
        
        const videoData = await response.json();
        
        if (user) {
          const combinedData = {
            ...videoData,
            author: {
              id: user.id,
              username: user.username,
              avatar_url: user.avatar_url,
            }
          };
          setVideo(combinedData);
          trackContentView(videoData.id, 'video', user.id);
        } else {
          setVideo(videoData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch video');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
          <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-gray-300">{error}</p>
        <Link href="/" className="mt-4 inline-block text-green-400 hover:text-green-300">
          Back to Home
            </Link>
      </div>
    );
  }

  if (!video) {
    return (
          <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
            <p className="text-gray-300">The video you're looking for doesn't exist or is not published.</p>
        <Link href="/" className="mt-4 inline-block text-green-400 hover:text-green-300">
          Back to Home
            </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        <Link
        href="/"
          className="inline-flex items-center text-green-400 hover:text-green-300 mb-6"
        >
          <Icon icon="material-symbols:arrow-back" className="h-4 w-4 mr-1" />
        Back to Home
        </Link>

        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <AuthorInfo author={video.author as UserData} />
            </div>

            <h1 className="text-3xl font-bold mb-4">{video.title}</h1>

            {(video as VideoContent).description && (
              <p className="text-xl text-gray-300 mb-6 italic border-l-4 border-green-500 pl-4">
                {(video as VideoContent).description || ''}
              </p>
            )}

            <div className="flex items-center text-sm text-gray-400 mb-8">
              <div className="flex items-center mr-4">
                <Icon icon="material-symbols:calendar-month" className="h-4 w-4 mr-1" />
                {new Date(video.created_at).toLocaleDateString()}
              </div>
              {(video as VideoContent).duration && (
                <div className="flex items-center">
                  <Icon icon="material-symbols:schedule" className="h-4 w-4 mr-1" />
                  {Math.floor((video as VideoContent).duration || 0 / 60)}:
                  {((video as VideoContent).duration || 0 % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>

            <CustomVideoPlayer
              src={(video as VideoContent).video_url || ''}
              poster={video.thumbnail_url}
              title={video.title}
              className="mb-6"
            />
        </div>
      </div>
    </div>
  );
}