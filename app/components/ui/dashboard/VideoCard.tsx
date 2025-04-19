import Link from 'next/link';
import { Video } from '@/app/types';
import { PencilIcon, TrashIcon, VideoCameraIcon, EyeIcon } from '@heroicons/react/24/outline';

interface VideoCardProps {
  video: Video;
  onDelete: (id: string) => void;
}

export default function VideoCard({ video, onDelete }: VideoCardProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 hover:border-green-500/50 transition-all duration-200">
      {video.thumbnail_url && (
        <div className="h-40 overflow-hidden">
          <img 
            src={video.thumbnail_url} 
            alt={video.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-lg text-white">{video.title}</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            video.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {video.published ? 'Published' : 'Draft'}
          </span>
        </div>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {video.description || 'No description available'}
        </p>
        
        <div className="flex items-center text-sm text-gray-400 mb-4">
          <span>{new Date(video.created_at).toLocaleDateString()}</span>
          {video.duration && (
            <span className="ml-2">• {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <Link 
              href={`/dashboard/content/videos/${video.id}/edit`}
              className="text-green-400 hover:text-green-300 transition-colors flex items-center"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </Link>
            <Link 
              href={`/dashboard/content/videos/${video.id}`}
              className="text-gray-400 hover:text-gray-300 transition-colors flex items-center"
            //   target="_blank"
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              View
            </Link>
          </div>
          <button
            onClick={() => onDelete(video.id)}
            className="text-red-400 hover:text-red-300 transition-colors flex items-center"
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
} 