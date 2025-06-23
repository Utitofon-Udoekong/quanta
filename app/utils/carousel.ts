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
export const gradients = {
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
export const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};

// Format time ago
export const formatTimeAgo = (date: string): string => {
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