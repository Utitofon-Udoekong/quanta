'use client';

import { useState, useEffect, use } from 'react';
import { type Content, type VideoContent, type AudioContent, type ArticleContent, UserData } from '@/app/types';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { trackContentView } from '@/app/utils/content';
import AuthorInfo from '@/app/components/ui/AuthorInfo';
import CustomVideoPlayer from '@/app/components/ui/CustomVideoPlayer';
import CustomAudioPlayer from '@/app/components/ui/CustomAudioPlayer';
import MarkdownViewer from '@/app/components/ui/MarkdownViewer';
import { useUserStore } from '@/app/stores/user';
import { supabase } from '@/app/utils/supabase/client';
import { useSearchParams } from 'next/navigation';
import CommentSection from '@/app/components/ui/content/CommentSection';
import LikeButton from '@/app/components/ui/content/LikeButton';

export default function PublicContentPage({ params }: { params: Promise<{ id: string }> }) {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = use(params);
  const { user } = useUserStore();
  const searchParams = useSearchParams();
  const kindParam = searchParams.get('kind');
  const kind = (kindParam === 'video' || kindParam === 'audio' || kindParam === 'article') 
    ? kindParam 
    : 'video';

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        const tableName = kind === 'video' ? 'videos' : kind === 'audio' ? 'audio' : 'articles';
        
        const { data, error } = await supabase
          .from(tableName)
          .select(`
            *,
            author:users (
              id,
              avatar_url,
              wallet_address
            )
          `)
          .eq('id', id)
          .eq('published', true) // Only fetch published content
          .single();

        if (error) {
          throw new Error('Content not found or is not available.');
        }

        const contentWithKind = { ...data, kind };
        setContent(contentWithKind);

        if (user) {
          trackContentView(contentWithKind.id, kind, user.id);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, kind, user, supabase]);

  const getContentTypeColor = (kind: string) => {
    switch (kind) {
      case 'video': return 'green';
      case 'audio': return 'purple';
      case 'article': return 'blue';
      default: return 'gray';
    }
  };

  const getContentTypeIcon = (kind: string) => {
    switch (kind) {
      case 'video': return 'material-symbols:video-library';
      case 'audio': return 'material-symbols:audio-file';
      case 'article': return 'material-symbols:article';
      default: return 'material-symbols:description';
    }
  };

  const getContentPlayer = (content: Content) => {
    switch (content.kind) {
      case 'video':
        return (
          <CustomVideoPlayer
            src={(content as VideoContent).video_url || ''}
            poster={content.thumbnail_url}
            title={content.title}
          />
        );
      case 'audio':
        return (
          <CustomAudioPlayer
            src={(content as AudioContent).audio_url || ''}
            title={content.title}
          />
        );
      case 'article':
        return (
          <div className="prose prose-invert max-w-none">
            <MarkdownViewer content={(content as ArticleContent).content || ''} />
          </div>
        );
      default:
        return null;
    }
  };

  const getContentDescription = (content: Content) => {
    switch (content.kind) {
      case 'video': return (content as VideoContent).description;
      case 'audio': return (content as AudioContent).description;
      case 'article': return (content as ArticleContent).excerpt;
      default: return null;
    }
  };

  const getContentMetadata = (content: Content) => {
    console.log(content);
    switch (content.kind) {
      case 'video':
        const videoDuration = (content as VideoContent).duration || 0;
        const videoMinutes = Math.floor(videoDuration / 60);
        const videoSeconds = videoDuration % 60;
        return (
          <>
            {videoMinutes}:{videoSeconds.toString().padStart(2, '0')}
          </>
        );
      case 'audio':
        const audioDuration = (content as AudioContent).duration || 0;
        const audioMinutes = Math.floor(audioDuration / 60);
        const audioSeconds = audioDuration % 60;
        return (
          <>
            {audioMinutes}:{audioSeconds.toString().padStart(2, '0')}
          </>
        );
      case 'article':
        const wordCount = (content as ArticleContent).content?.split(' ').length || 0;
        const readTimeMinutes = Math.ceil(wordCount / 200);
        return (
          <>
            {readTimeMinutes} min read
          </>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0C10]">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Content Not Available</h1>
            <p className="text-gray-300">{error || "The content you're looking for doesn't exist or has been moved."}</p>
            <Link href="/" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const color = getContentTypeColor(content.kind);
  const icon = getContentTypeIcon(content.kind);

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <Icon icon="material-symbols:arrow-back" className="h-5 w-5 mr-2" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-[#121418] rounded-lg overflow-hidden shadow-lg">
              {getContentPlayer(content)}
            </div>

            <div className="mt-8">
              <div className="flex items-center mb-4">
                <Icon icon={icon} className={`h-6 w-6 text-${color}-400 mr-3`} />
                <span className={`text-${color}-400 font-semibold uppercase tracking-wider text-sm`}>
                  {content.kind}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{content.title}</h1>
              
              {getContentDescription(content) && (
                <p className="text-gray-300 leading-relaxed">
                  {getContentDescription(content)}
                </p>
              )}
            </div>
            
            <CommentSection contentId={content.id} contentType={content.kind} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {content.author && content.author.wallet_address && (
              <div className="bg-[#121418] p-5 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-4">About the Author</h3>
                <AuthorInfo author={content.author as UserData} />
              </div>
            )}

            <div className="bg-[#121418] p-5 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center">
                    <Icon icon="material-symbols:calendar-month" className="h-5 w-5 mr-2 text-gray-400" />
                    Published
                  </span>
                  <span className="font-medium text-white">{new Date(content.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center">
                    <Icon icon="mdi:heart" className="h-5 w-5 mr-2 text-gray-400" />
                    Likes
                  </span>
                  <LikeButton contentId={content.id} contentType={content.kind} />
                </div>
                {getContentMetadata(content) && (
                  <div className="flex items-center justify-between text-gray-300">
                    <span className="flex items-center">
                      <Icon icon="material-symbols:schedule" className="h-5 w-5 mr-2 text-gray-400" />
                      {content.kind === 'article' ? 'Read Time' : 'Duration'}
                    </span>
                    <span className="font-medium text-white">
                      {getContentMetadata(content)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
