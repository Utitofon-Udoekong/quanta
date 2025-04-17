'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/client';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();
  }, [supabase]);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  };
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
          Content Platform
        </Link>
        
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm bg-gray-100 py-2 px-4 rounded hover:bg-gray-200"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}