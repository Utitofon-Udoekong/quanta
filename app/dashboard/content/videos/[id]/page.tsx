'use client';

import { createClient } from "@/app/utils/supabase/client";
import { useState, useEffect, use } from "react";
import { type Video } from "@/app/types";
import Link from 'next/link';
import { ArrowLeftIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { trackContentView } from '@/app/utils/content';
import AuthorInfo from '@/app/components/ui/AuthorInfo';
import CustomVideoPlayer from '@/app/components/ui/CustomVideoPlayer';
import { useUserStore } from "@/app/stores/user";
import { useRouter } from 'next/navigation';

export default function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = use(params);
  const supabase = createClient();
  const { user, error: userError } = useUserStore();
  
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        // First, fetch the video data
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .select('*')
          .eq('id', id)
          .single();

        if (videoError) {
          console.error(videoError);
          setError(videoError.message);
          return;
        }

        // Then, fetch the author details from auth


        if (userError || !user) {
          console.error(userError);
          // Continue with the video data even if we can't get the author
          setVideo(videoData);
        } else {
          // Combine the video data with the author information
          const combinedData = {
            ...videoData,
            author: {
              id: user.id,
              full_name: user.full_name,
              avatar_url: user.avatar_url,
            }
          };
          setVideo(combinedData);
        }

        // Track view if video exists
        if (videoData && user) {
          trackContentView(videoData.id, 'video', user.id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch video');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0C10]">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-gray-300">{error}</p>
            <Link href="/dashboard/content/videos" className="mt-4 inline-block text-green-400 hover:text-green-300">
              Back to Videos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
            <p className="text-gray-300">The video you're looking for doesn't exist or is not published.</p>
            <Link href="/dashboard/content/videos" className="mt-4 inline-block text-green-400 hover:text-green-300">
              Back to Videos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      <div className="my-8">
        <Link
          href="/dashboard/content/videos"
          className="inline-flex items-center text-green-400 hover:text-green-300 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back
        </Link>

        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <AuthorInfo author={video.author} createdAt={video.created_at} />
            </div>

            <h1 className="text-3xl font-bold mb-4">{video.title}</h1>

            {video.description && (
              <p className="text-xl text-gray-300 mb-6 italic border-l-4 border-green-500 pl-4">
                {video.description}
              </p>
            )}

            <div className="flex items-center text-sm text-gray-400 mb-8">
              <div className="flex items-center mr-4">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {new Date(video.created_at).toLocaleDateString()}
              </div>
              {video.duration && (
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>

            <CustomVideoPlayer
              src={video.video_url}
              poster={video.thumbnail_url}
              title={video.title}
              className="mb-6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}