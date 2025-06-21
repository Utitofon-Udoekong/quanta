import { Content } from '@/app/types';

export interface CarouselItem {
  id: string
  title: string
  image: string
  user: string
  avatar: string
  views: string
  timeAgo: string
  gradient: string
  contentType: 'video' | 'audio' | 'article'
}

// Gradient options for different content types
const gradients = {
  video: [
    "from-blue-600 to-purple-600",
    "from-purple-600 to-blue-600", 
    "from-red-600 to-blue-600",
    "from-green-600 to-blue-600",
    "from-yellow-600 to-orange-600"
  ],
  audio: [
    "from-purple-600 to-pink-600",
    "from-pink-600 to-purple-600",
    "from-indigo-600 to-purple-600",
    "from-purple-600 to-indigo-600",
    "from-pink-600 to-red-600"
  ],
  article: [
    "from-orange-500 to-red-600",
    "from-red-600 to-orange-500",
    "from-yellow-500 to-orange-600",
    "from-orange-600 to-yellow-500",
    "from-red-600 to-pink-600"
  ]
};

// Format view count
const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};

// Format time ago
const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const contentDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - contentDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

// Convert content to carousel items
export const convertContentToCarouselItems = (content: Content[]): CarouselItem[] => {
  return content.map((item, index) => {
    const contentType = item.kind as 'video' | 'audio' | 'article';
    const gradientOptions = gradients[contentType] || gradients.video;
    const gradient = gradientOptions[index % gradientOptions.length];
    
    return {
      id: item.id,
      title: item.title,
      image: item.thumbnail_url || '/images/default-thumbnail.png',
      user: item.author?.username || item.author?.wallet_address?.slice(0, 8) || 'Unknown',
      avatar: item.author?.avatar_url || `https://robohash.org/${item.author?.wallet_address?.slice(0, 8) || 'default'}`,
      views: formatViews(item.views || 0),
      timeAgo: formatTimeAgo(item.created_at),
      gradient,
      contentType
    };
  });
};

// Get featured content for carousel (top viewed content)
export const getFeaturedCarouselItems = async (supabase: any): Promise<CarouselItem[]> => {
  try {
    // Fetch top viewed content from all types
    const { data: videos } = await supabase
      .from('videos')
      .select(`
        *,
        author:users(id, username, wallet_address, avatar_url),
        content_views(count)
      `)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(2);

    const { data: audio } = await supabase
      .from('audio')
      .select(`
        *,
        author:users(id, username, wallet_address, avatar_url),
        content_views(count)
      `)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(2);

    const { data: articles } = await supabase
      .from('articles')
      .select(`
        *,
        author:users(id, username, wallet_address, avatar_url),
        content_views(count)
      `)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(1);

    // Combine and convert to carousel format
    const allContent = [
      ...(videos || []).map((v: any) => ({ ...v, kind: 'video' as const })),
      ...(audio || []).map((a: any) => ({ ...a, kind: 'audio' as const })),
      ...(articles || []).map((ar: any) => ({ ...ar, kind: 'article' as const }))
    ];

    // If no content found, return default items
    if (allContent.length === 0) {
      console.log('No content found in database, using default carousel items');
      return [
        {
          id: "1",
          title: "Welcome to Quanta",
          image: "/images/default-thumbnail.png",
          user: "Quanta Team",
          avatar: "https://robohash.org/quanta",
          views: "0",
          timeAgo: "Just now",
          gradient: "from-blue-600 to-purple-600",
          contentType: "video"
        },
        {
          id: "2",
          title: "Create Your First Content",
          image: "/images/default-thumbnail.png",
          user: "Get Started",
          avatar: "https://robohash.org/start",
          views: "0",
          timeAgo: "Just now",
          gradient: "from-purple-600 to-blue-600",
          contentType: "video"
        },
        {
          id: "3",
          title: "Join the Community",
          image: "/images/default-thumbnail.png",
          user: "Community",
          avatar: "https://robohash.org/community",
          views: "0",
          timeAgo: "Just now",
          gradient: "from-orange-500 to-red-600",
          contentType: "article"
        }
      ];
    }

    return convertContentToCarouselItems(allContent);
  } catch (error) {
    console.error('Error fetching featured content:', error);
    // Return default items on error
    return [
      {
        id: "1",
        title: "Welcome to Quanta",
        image: "/images/default-thumbnail.png",
        user: "Quanta Team",
        avatar: "https://robohash.org/quanta",
        views: "0",
        timeAgo: "Just now",
        gradient: "from-blue-600 to-purple-600",
        contentType: "video"
      },
      {
        id: "2",
        title: "Create Your First Content",
        image: "/images/default-thumbnail.png",
        user: "Get Started",
        avatar: "https://robohash.org/start",
        views: "0",
        timeAgo: "Just now",
        gradient: "from-purple-600 to-blue-600",
        contentType: "video"
      },
      {
        id: "3",
        title: "Join the Community",
        image: "/images/default-thumbnail.png",
        user: "Community",
        avatar: "https://robohash.org/community",
        views: "0",
        timeAgo: "Just now",
        gradient: "from-orange-500 to-red-600",
        contentType: "article"
      }
    ];
  }
}; 