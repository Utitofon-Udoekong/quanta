'use client';

import { useState, useEffect, use } from 'react';
import { type Content, type VideoContent, type AudioContent, type ArticleContent, UserData, AccessInfo, SubscriptionStatus } from '@/app/types';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { trackContentView } from '@/app/utils/content';
import AuthorInfo from '@/app/components/ui/AuthorInfo';
import CustomVideoPlayer from '@/app/components/ui/CustomVideoPlayer';
import CustomAudioPlayer from '@/app/components/ui/CustomAudioPlayer';
import MarkdownViewer from '@/app/components/ui/MarkdownViewer';
import { useUserStore } from '@/app/stores/user';
import { supabase } from '@/app/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import CommentSection from '@/app/components/ui/content/CommentSection';
import LikeButton from '@/app/components/ui/content/LikeButton';
import SubscribeModal from '@/app/components/ui/SubscribeModal';
import { checkContentAccess, getSubscriptionStatus } from '@/app/utils/subscription-api';

export default function PublicContentPage({ params }: { params: Promise<{ id: string }> }) {
  const [contentWithKind, setContentWithKind] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const { id } = use(params);
  const { user } = useUserStore();
  const searchParams = useSearchParams();
  const kindParam = searchParams.get('kind');
  const kind = (kindParam === 'video' || kindParam === 'audio' || kindParam === 'article') 
    ? kindParam 
    : 'video';
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const router = useRouter();

  const refreshContentAccess = async () => {
    if (user && contentWithKind?.author?.id) {
      try {
        const access = await checkContentAccess(
          user.id,
          contentWithKind.id,
          kind as 'article' | 'video' | 'audio',
          contentWithKind.author.id
        );
        setAccessInfo(access);

        // Get subscription status
        const status = await getSubscriptionStatus(user.id, contentWithKind.author.id);
        setSubscriptionStatus(status);

        // Track view if user now has access
        if (access.hasAccess) {
          trackContentView(contentWithKind.id, kind, user.id);
        }
      } catch (error) {
        // console.error('Error refreshing content access:', error);
      }
    }
  };

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
        // console.log(contentWithKind)
        // console.log(contentWithKind.author?.id)
        setContentWithKind(contentWithKind);

        // Check access permissions
        if (user && contentWithKind.author?.id) {
          const access = await checkContentAccess(
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
        // console.error('Error fetching content:', err);
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
            contentId={content.id}
            contentType={content.kind}
          />
        );
      case 'audio':
        return (
          <CustomAudioPlayer
            src={(content as AudioContent).audio_url || ''}
            title={content.title}
            contentId={content.id}
            contentType={content.kind}
          />
        );
      case 'article':
        return (
          <div className="prose prose-invert w-full">
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
    if (!contentWithKind) return null;
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
          {contentWithKind.author && (
            <SubscribeModal
              open={showSubscribeModal}
              onClose={() => setShowSubscribeModal(false)}
              creator={{
                id: contentWithKind.author.id,
                wallet_address: contentWithKind.author.wallet_address || '',
                subscription_price: (contentWithKind.author as any).subscription_price || 0,
                subscription_currency: (contentWithKind.author as any).subscription_currency || 'USD',
                subscription_type: (contentWithKind.author as any).subscription_type || 'monthly'
              }}
              subscriber={{
                wallet_address: user?.wallet_address || '',
                email: (user as any)?.email || 'user@example.com',
                fullname: user?.username || ''
              }}
              contentTitle={contentWithKind.title}
              onSuccess={refreshContentAccess}
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

  if (!contentWithKind) {
    return null;
  }

  // If premium and locked, show locked UI
  if (accessInfo && !accessInfo.hasAccess && accessInfo.isPremium) {
    return renderPremiumLockedContent();
  }

  const color = getContentTypeColor(contentWithKind.kind);
  const icon = getContentTypeIcon(contentWithKind.kind);
  const canAccessContent = accessInfo?.hasAccess ?? (!contentWithKind.is_premium);
  const thumbnail = contentWithKind.thumbnail_url || '';

  return (
    <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
      <div className="w-full overflow-hidden">
        <button onClick={() => router.back()} className="text-white flex items-center gap-2 mb-10" >
          <Icon icon="mdi:arrow-left" className="size-6" />
          <span className="text-white">Back</span>
        </button>
        
        {/* Player Section */}
        <div className=" w-full flex flex-col items-center justify-center mb-10">
          {canAccessContent ? (
            getContentPlayer(contentWithKind)
          ) : (
            renderPremiumLockedContent()
          )}
        </div>

        {/* Content Info & Comments */}
        <div className="">
          {/* Author Info */}
          {contentWithKind.author && (
            <div className="flex items-center gap-3 mb-6">
              <AuthorInfo author={contentWithKind.author as UserData} />
              </div>
            )}
          {/* Title & Description */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{contentWithKind.title}</h1>
          {getContentDescription(contentWithKind) && (
            <p className="text-gray-300 text-lg mb-4">{getContentDescription(contentWithKind)}</p>
          )}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 mb-8">
            <div className="flex items-center">
              <Icon icon="material-symbols:schedule" className="w-4 h-4 mr-2" />
              {new Date(contentWithKind.created_at).toLocaleDateString()}
            </div>
            {getContentMetadata(contentWithKind) && (
              <div className="flex items-center">
                <Icon icon="material-symbols:access-time" className="w-4 h-4 mr-2" />
                {getContentMetadata(contentWithKind)}
              </div>
            )}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${color}-500/20 text-${color}-400`}>
              <Icon icon={icon} className="w-4 h-4 mr-2" />
              {contentWithKind.kind.charAt(0).toUpperCase() + contentWithKind.kind.slice(1)}
            </div>
            {contentWithKind.is_premium && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 ml-2">
                <Icon icon="material-symbols:star" className="w-4 h-4 mr-2" />
                Premium
              </div>
            )}
          </div>
          {/* Comments */}
          {canAccessContent && (
            <div>
              <div className="divide-y divide-[#222]">
                <CommentSection contentId={contentWithKind.id} contentType={kind} />
        </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
 