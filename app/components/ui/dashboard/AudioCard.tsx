import Link from 'next/link';
import { Audio } from '@/app/types';
import { PencilIcon, TrashIcon, MusicalNoteIcon, EyeIcon } from '@heroicons/react/24/outline';

interface AudioCardProps {
  audio: Audio;
  onDelete: (id: string) => void;
}

export default function AudioCard({ audio, onDelete }: AudioCardProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 hover:border-purple-500/50 transition-all duration-200">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-lg text-white">{audio.title}</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            audio.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {audio.published ? 'Published' : 'Draft'}
          </span>
        </div>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {audio.description || 'No description available'}
        </p>
        
        <div className="flex items-center text-sm text-gray-400 mb-4">
          <span>{new Date(audio.created_at).toLocaleDateString()}</span>
          {audio.duration && (
            <span className="ml-2">• {Math.floor(audio.duration / 60)}:{(audio.duration % 60).toString().padStart(2, '0')}</span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <Link 
              href={`/dashboard/content/audio/${audio.id}/edit`}
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </Link>
            <Link 
              href={`/dashboard/content/audio/${audio.id}`}
              className="text-gray-400 hover:text-gray-300 transition-colors flex items-center"
            //   target="_blank"
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              View
            </Link>
          </div>
          <button
            onClick={() => onDelete(audio.id)}
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