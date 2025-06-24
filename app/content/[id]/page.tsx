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
import { hasAccessToContent, getSubscriptionStatus } from '@/app/utils/subscription';
import SubscribeModal from '@/app/components/ui/SubscribeModal';

export default function PublicContentPage({ params }: { params: Promise<{ id: string }> }) {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessInfo, setAccessInfo] = useState<{
    hasAccess: boolean;
    isPremium: boolean;
    reason?: string;
  } | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isFollowing: boolean;
    isPaidSubscriber: boolean;
    subscriptionType?: string;
    expiresAt?: string;
    amount?: number;
    currency?: string;
  } | null>(null);
  const { id } = use(params);
  const { user } = useUserStore();
  const searchParams = useSearchParams();
  const kindParam = searchParams.get('kind');
  const kind = (kindParam === 'video' || kindParam === 'audio' || kindParam === 'article') 
    ? kindParam 
    : 'video';
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

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
              wallet_address,
              subscription_price,
              subscription_currency,
              subscription_type
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

        // Check access permissions
        if (user && contentWithKind.author?.id) {
          const access = await hasAccessToContent(
            user.id,
            contentWithKind.id,
            kind as 'article' | 'video' | 'audio',
            contentWithKind.author.id
          );
          setAccessInfo(access);

          // Get subscription status
          const status = await getSubscriptionStatus(user.id, contentWithKind.author.id);
          setSubscriptionStatus(status);

          // Only track view if user has access
          if (access.hasAccess) {
            trackContentView(contentWithKind.id, kind, user.id);
          }
        } else if (!user) {
          // For non-authenticated users, only show non-premium content
          setAccessInfo({
            hasAccess: !contentWithKind.is_premium,
            isPremium: contentWithKind.is_premium,
            reason: contentWithKind.is_premium ? 'Authentication required' : undefined
          });
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

  const renderPremiumLockedContent = () => {
    if (!content) return null;
    // Show subscribe modal if user is not subscribed and content is premium
    if (accessInfo && !accessInfo.hasAccess && accessInfo.isPremium) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <Icon icon="mdi:lock" className="text-5xl text-gray-400" />
          <div className="text-lg font-semibold">This is premium content</div>
          <div className="text-gray-400 mb-2">Subscribe to unlock this content.</div>
          <button
            className="px-6 py-2 rounded bg-gradient-to-r from-[#8B25FF] to-[#350FDD] cursor-pointer text-white font-bold hover:bg-primary/80 transition"
            onClick={() => setShowSubscribeModal(true)}
          >
            Subscribe
          </button>
          {content.author && (
            <SubscribeModal
              open={showSubscribeModal}
              onClose={() => setShowSubscribeModal(false)}
              creator={{
                id: content.author.id,
                wallet_address: content.author.wallet_address || '',
                subscription_price: (content.author as any).subscription_price || 0,
                subscription_currency: (content.author as any).subscription_currency || 'USD',
                subscription_type: (content.author as any).subscription_type || 'monthly'
              }}
              subscriber={{
                wallet_address: user?.wallet_address || '',
                email: (user as any)?.email || 'user@example.com',
                fullname: user?.username || ''
              }}
              contentTitle={content.title}
            />
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Icon icon="eos-icons:loading" className="text-4xl animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">{error}</div>
    );
  }

  if (!content) {
    return null;
  }

  // If premium and locked, show locked UI
  if (accessInfo && !accessInfo.hasAccess && accessInfo.isPremium) {
    return renderPremiumLockedContent();
  }

  const color = getContentTypeColor(content.kind);
  const icon = getContentTypeIcon(content.kind);

  // Check if user has access to the content
  const canAccessContent = accessInfo?.hasAccess ?? (!content.is_premium);

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

        {/* Content Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${color}-500/20 text-${color}-400`}>
              <Icon icon={icon} className="w-4 h-4 mr-2" />
              {content.kind.charAt(0).toUpperCase() + content.kind.slice(1)}
            </div>
            {content.is_premium && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400">
                <Icon icon="material-symbols:star" className="w-4 h-4 mr-2" />
                Premium
              </div>
            )}
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{content.title}</h1>
          
          {getContentDescription(content) && (
            <p className="text-gray-300 text-lg mb-6">{getContentDescription(content)}</p>
          )}

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center">
              <Icon icon="material-symbols:schedule" className="w-4 h-4 mr-2" />
              {new Date(content.created_at).toLocaleDateString()}
            </div>
            {getContentMetadata(content) && (
              <div className="flex items-center">
                <Icon icon="material-symbols:access-time" className="w-4 h-4 mr-2" />
                {getContentMetadata(content)}
              </div>
            )}
          </div>
        </div>

        {/* Author Info */}
        {content.author && (
          <div className="mb-8">
            <AuthorInfo author={content.author as UserData} />
          </div>
        )}

        {/* Content Player/Viewer */}
        <div className="mb-8">
          {canAccessContent ? (
            getContentPlayer(content)
          ) : (
            renderPremiumLockedContent()
          )}
        </div>

        {/* Comments and Likes - Only show if user has access */}
        {canAccessContent && (
          <div className="space-y-8">
            <LikeButton contentId={content.id} contentType={kind} />
            <CommentSection contentId={content.id} contentType={kind} />
          </div>
        )}
      </div>
    </div>
  );
}
 