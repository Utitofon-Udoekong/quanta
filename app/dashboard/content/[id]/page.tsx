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
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from '@/app/components/helpers/toast';

export default function ContentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [content, setContent] = useState<Content | null>(null);
  const [analytics, setAnalytics] = useState<{ views: number; likes: number; comments: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = use(params);
  const { user, error: userError } = useUserStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const kindParam = searchParams.get('kind');
  const kind = (kindParam === 'video' || kindParam === 'audio' || kindParam === 'article') 
    ? kindParam 
    : 'video'; // Default to video if no kind specified or invalid kind

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        const tableName = kind === 'video' ? 'videos' : kind === 'audio' ? 'audio' : 'articles';
        
        const contentPromise = supabase
          .from(tableName)
          .select(`*, author:users (id, username, avatar_url, wallet_address)`)
          .eq('id', id)
          .single();

        const viewsPromise = supabase.from('content_views').select('count').eq('content_id', id).single();
        const likesPromise = supabase.from('content_likes').select('*', { count: 'exact', head: true }).eq('content_id', id);
        const commentsPromise = supabase.from('content_comments').select('*', { count: 'exact', head: true }).eq('content_id', id);
        
        const [
          { data: contentData, error: contentError },
          { data: viewsData, error: viewsError },
          { count: likesCount, error: likesError },
          { count: commentsCount, error: commentsError }
        ] = await Promise.all([contentPromise, viewsPromise, likesPromise, commentsPromise]);

        if (contentError) throw new Error('Content not found');
        if (viewsError || likesError || commentsError) {
            console.error("Partial error fetching analytics data", {viewsError, likesError, commentsError});
        }

        const contentWithKind = { ...contentData, kind };

        if (userError || !user) {
          console.error(userError);
          setContent(contentWithKind);
        } else {
          const combinedData = {
            ...contentWithKind,
            author: {
              id: user.id,
              username: user.username,
              avatar_url: user.avatar_url,
              wallet_address: user.wallet_address,
            }
          };
          setContent(combinedData);
        }
        
        setAnalytics({
            views: viewsData?.count || 0,
            likes: likesCount || 0,
            comments: commentsCount || 0
        });

        if (contentWithKind && user) {
          trackContentView(contentWithKind.id, kind, user.id);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to fetch content');
        console.error('Error fetching content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id, supabase, user, userError, kind]);

  const getContentTypeColor = (kind: string) => {
    switch (kind) {
      case 'video':
        return 'green';
      case 'audio':
        return 'purple';
      case 'article':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getContentTypeIcon = (kind: string) => {
    switch (kind) {
      case 'video':
        return 'material-symbols:video-library';
      case 'audio':
        return 'material-symbols:audio-file';
      case 'article':
        return 'material-symbols:article';
      default:
        return 'material-symbols:description';
    }
  };

  const getBackLink = () => {
    // Always go back to the main content page since we're consolidating
    return '/dashboard/content';
  };

  const getContentPlayer = (content: Content) => {
    switch (content.kind) {
      case 'video':
        return (
          <CustomVideoPlayer
            src={(content as VideoContent).video_url || ''}
            poster={content.thumbnail_url}
            title={content.title}
            // className="mb-6"
          />
        );
      case 'audio':
        return (
          <CustomAudioPlayer
            src={(content as AudioContent).audio_url || ''}
            title={content.title}
            // className="mb-6"
          />
        );
      case 'article':
        return (
          <div className="prose prose-invert">
            <MarkdownViewer content={(content as ArticleContent).content || ''} />
          </div>
        );
      default:
        return null;
    }
  };

  const getContentDescription = (content: Content) => {
    switch (content.kind) {
      case 'video':
        return (content as VideoContent).description;
      case 'audio':
        return (content as AudioContent).description;
      case 'article':
        return (content as ArticleContent).excerpt;
      default:
        return null;
    }
  };

  const getContentMetadata = (content: Content) => {
    switch (content.kind) {
      case 'video':
        return (
          <>
            {Math.floor(((content as VideoContent).duration || 0) / 60)}:
            {(((content as VideoContent).duration || 0) % 60).toString().padStart(2, '0')}
          </>
        );
      case 'audio':
        return (
          <>
            {Math.floor(((content as AudioContent).duration || 0) / 60)}:
            {(((content as AudioContent).duration || 0) % 60).toString().padStart(2, '0')}
          </>
        );
      case 'article':
        return (
          <>
            {Math.ceil(((content as ArticleContent).content?.split(' ').length || 0) / 200)} min read
          </>
        );
      default:
        return null;
    }
  };

  const handleDelete = async () => {
    if (!content) return;
    if (!window.confirm('Are you sure you want to delete this content permanently? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/content/${content.kind}/${content.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete ${content.kind}`);
      }

      toast(`${content.kind.charAt(0).toUpperCase() + content.kind.slice(1)} deleted successfully.`, {
        className: 'bg-green-500',
      });
      router.push('/dashboard/content');
    } catch (err: any) {
      toast(err.message, { className: 'bg-red-500' });
      console.error(err);
    }
  };

  const handlePublishToggle = async () => {
    if (!content) return;
    
    const newPublishedStatus = !content.published;

    try {
      const response = await fetch(`/api/content/${content.kind}/${content.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: newPublishedStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update status`);
      }
      
      const updatedContent = await response.json();

      setContent(prev => prev ? { ...prev, published: updatedContent.published } : null);
      toast(`Content status updated to ${newPublishedStatus ? 'Published' : 'Draft'}.`, {
        className: 'bg-green-500',
      });

    } catch (err: any) {
      toast(err.message, { className: 'bg-red-500' });
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0C10]">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
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
            <Link href="/dashboard/content" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
              Back to Content
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Content Not Found</h1>
            <p className="text-gray-300">The content you're looking for doesn't exist or is not published.</p>
            <Link href="/dashboard/content" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
              Back to Content
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const color = getContentTypeColor(content.kind);
  const icon = getContentTypeIcon(content.kind);
  const backLink = getBackLink();

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6">
          <Link
            href={backLink}
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <Icon icon="material-symbols:arrow-back" className="h-5 w-5 mr-2" />
            <span className="font-medium">Back to Content</span>
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
                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
                  {getContentDescription(content)}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Card */}
            <div className="bg-[#121418] p-5 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold mb-4">Status</h3>
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    content.published 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {content.published ? 'Published' : 'Draft'}
                </span>
                <button 
                  onClick={handlePublishToggle}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  {content.published ? 'Set to Draft' : 'Publish Now'}
                </button>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-[#121418] p-5 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold mb-4">Actions</h3>
              <div className="flex gap-3">
                 <button
                    onClick={() => router.push(`/dashboard/content/${content.kind}/${content.id}/edit`)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                   <Icon icon="heroicons:pencil" className="h-5 w-5" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    <Icon icon="heroicons:trash" className="h-5 w-5" />
                    Delete
                  </button>
              </div>
            </div>
            
            {/* Author Card */}
            {content.author && content.author.wallet_address && (
              <div className="bg-[#121418] p-5 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-4">About the Author</h3>
                <AuthorInfo author={content.author as UserData} />
              </div>
            )}

            {/* Stats Card */}
            <div className="bg-[#121418] p-5 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center">
                    <Icon icon="mdi:eye" className="h-5 w-5 mr-2 text-gray-400" />
                    Views
                  </span>
                  <span className="font-medium text-white">{analytics?.views?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center">
                    <Icon icon="mdi:heart" className="h-5 w-5 mr-2 text-gray-400" />
                    Likes
                  </span>
                  <span className="font-medium text-white">{analytics?.likes?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center">
                    <Icon icon="mdi:comment-multiple" className="h-5 w-5 mr-2 text-gray-400" />
                    Comments
                  </span>
                  <span className="font-medium text-white">{analytics?.comments?.toLocaleString() || 0}</span>
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
