import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple';
}

export default function EmptyState({ 
  title, 
  description, 
  actionText, 
  actionHref, 
  icon,
  color = 'blue'
}: EmptyStateProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    purple: 'bg-purple-500/10 text-purple-400'
  };

  const buttonClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700'
  };

  return (
    <div className="bg-gray-800/50 p-8 rounded-lg border border-gray-700/50 text-center">
      <div className={`w-16 h-16 ${colorClasses[color]} rounded-full flex items-center justify-center mx-auto mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      <Link
        href={actionHref}
        className={`${buttonClasses[color]} text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center`}
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        {actionText}
      </Link>
    </div>
  );
} 