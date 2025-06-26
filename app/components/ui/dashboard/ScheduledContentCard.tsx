'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from "@headlessui/react"
import { 
  ScheduledContent, 
  formatReleaseDate, 
  getTimeUntilRelease,
  publishContentNow,
  unscheduleContent
} from '@/app/utils/content-scheduling';

interface ScheduledContentCardProps {
  content: ScheduledContent;
  onUpdate: () => void;
}

export default function ScheduledContentCard({ content, onUpdate }: ScheduledContentCardProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilRelease(content.release_date));
  const [processing, setProcessing] = useState(false);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilRelease(content.release_date));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [content.release_date]);

  const handlePublishNow = async () => {
    setProcessing(true);
    try {
      // This would need the wallet address - you'd need to pass it as a prop
      // For now, we'll just show the functionality
      // console.log('Publishing content now:', content.id);
      onUpdate();
    } catch (error) {
      // console.error('Error publishing content:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUnschedule = async () => {
    setProcessing(true);
    try {
      // This would need the wallet address - you'd need to pass it as a prop
      // console.log('Unscheduling content:', content.id);
      onUpdate();
    } catch (error) {
      // console.error('Error unscheduling content:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'article':
        return 'mdi:file-document';
      case 'video':
        return 'mdi:video';
      case 'audio':
        return 'mdi:music';
      default:
        return 'mdi:file';
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'article':
        return 'text-blue-400';
      case 'video':
        return 'text-red-400';
      case 'audio':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-[#121418] rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gray-800 ${getContentTypeColor(content.content_type)}`}>
            <Icon icon={getContentIcon(content.content_type)} className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{content.title}</h3>
            <p className="text-sm text-gray-400 capitalize">{content.content_type}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-400">Scheduled for</div>
          <div className="font-semibold text-white">{formatReleaseDate(content.release_date)}</div>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
        <div className="text-sm text-gray-400 mb-2">Time until release:</div>
        {timeLeft.isOverdue ? (
          <div className="text-red-400 font-semibold">Overdue</div>
        ) : (
          <div className="flex space-x-4 text-sm">
            <div>
              <div className="text-white font-semibold">{timeLeft.days}</div>
              <div className="text-gray-400">Days</div>
            </div>
            <div>
              <div className="text-white font-semibold">{timeLeft.hours}</div>
              <div className="text-gray-400">Hours</div>
            </div>
            <div>
              <div className="text-white font-semibold">{timeLeft.minutes}</div>
              <div className="text-gray-400">Minutes</div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          onClick={handlePublishNow}
          disabled={processing}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
        >
          {processing ? (
            <Icon icon="mdi:loading" className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Icon icon="mdi:publish" className="w-4 h-4 mr-2" />
          )}
          Publish Now
        </Button>
        
        <Button
          onClick={handleUnschedule}
          disabled={processing}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
        >
          {processing ? (
            <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
          ) : (
            <Icon icon="mdi:close" className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Scheduled Content List Component
interface ScheduledContentListProps {
  walletAddress: string;
}

export function ScheduledContentList({ walletAddress }: ScheduledContentListProps) {
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduledContent = async () => {
    try {
      setLoading(true);
      // Import the function dynamically to avoid circular dependencies
      const { getUpcomingScheduledContent } = await import('@/app/utils/content-scheduling');
      const content = await getUpcomingScheduledContent(walletAddress, 5);
      setScheduledContent(content);
    } catch (error) {
      // console.error('Error fetching scheduled content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchScheduledContent();
    }
  }, [walletAddress]);

  if (loading) {
    return (
      <div className="bg-[#121418] rounded-xl p-6">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (scheduledContent.length === 0) {
    return (
      <div className="bg-[#121418] rounded-xl p-6 text-center">
        <Icon icon="mdi:calendar-clock" className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">No scheduled content</h3>
        <p className="text-gray-500">Schedule content to publish automatically at a specific time</p>
      </div>
    );
  }

  return (
    <div className="bg-[#121418] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Scheduled Content</h2>
        <span className="text-sm text-gray-400">{scheduledContent.length} items</span>
      </div>
      
      <div className="space-y-4">
        {scheduledContent.map((content) => (
          <ScheduledContentCard
            key={content.id}
            content={content}
            onUpdate={fetchScheduledContent}
          />
        ))}
      </div>
    </div>
  );
} 