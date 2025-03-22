"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { AccountCreation } from './components/xion/AccountCreation';
import { Button } from "@burnt-labs/ui";
import { Menu, Transition, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { Content, Metadata, User } from '@prisma/client';
import { useContent } from './hooks/use-content';

type ContentWithRelations = Content & {
  metadata: Metadata;
  creator: User;
};

// Categories with proper spacing
const categories = [
  { id: 'all', name: 'All' },
  { id: 'videos', name: 'Videos' },
  { id: 'articles', name: 'Articles' },
  { id: 'courses', name: 'Courses' },
  { id: 'software', name: 'Software' },
];

export default function LandingPage() {
  const { data: account } = useAbstraxionAccount();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [content, setContent] = useState<ContentWithRelations[]>([]);
  const { isLoading, error, fetchAllContent } = useContent(undefined, {
    onError: (error: string) => console.error('Failed to fetch content:', error)
  });

  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await fetchAllContent();
        if (data) {
          setContent(data);
        }
      } catch (error) {
        // Error is already handled by the hook
      }
    };

    loadContent();
  }, [fetchAllContent]);

  // Filter content based on selected category
  const filteredContent = selectedCategory === 'all' 
    ? content 
    : content.filter(item => item.type.toLowerCase() === selectedCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Content</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#0A0C10]/90 backdrop-blur-md border-b border-gray-800/50 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-12">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  QUANTA
                </span>
              </Link>
              <nav className="hidden md:flex">
                <div className="flex gap-x-4 bg-gray-800/50 px-8 py-2 rounded-lg">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {!account?.bech32Address ? (
                <Button
                  onClick={() => setShowAccountCreation(true)}
                  structure="base"
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                >
                  Sign In
                </Button>
              ) : (
                <Menu as="div" className="relative">
                  <MenuButton className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                      {account.bech32Address.slice(0, 2)}
                    </div>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </MenuButton>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <MenuItems className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-2 py-2">
                        <div className="px-3 py-2 text-sm text-gray-400 border-b border-gray-700">
                          {account.bech32Address.slice(0, 6)}...{account.bech32Address.slice(-4)}
                        </div>
                        <MenuItem>
                          {({ active }) => (
                            <Link
                              href="/dashboard"
                              className={`${
                                active ? 'bg-gray-700' : ''
                              } block px-3 py-2 rounded-md text-sm text-white`}
                            >
                              Dashboard
                            </Link>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <button
                              className={`${
                                active ? 'bg-gray-700' : ''
                              } block w-full text-left px-3 py-2 rounded-md text-sm text-red-400`}
                            >
                              Sign Out
                            </button>
                          )}
                        </MenuItem>
                      </div>
                    </MenuItems>
                  </Transition>
                </Menu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        <div className="container mx-auto px-6 py-8">
          {/* Mobile Categories */}
          <div className="md:hidden overflow-x-auto pb-6">
            <div className="flex space-x-2 bg-gray-800/50 p-1 rounded-lg">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          {filteredContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-200 mb-2">No Content Available</h3>
              <p className="text-gray-400 max-w-md">
                There are no published contents at the moment. Please check back later or try a different category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredContent.map((item) => (
                <Link 
                  href={`/content/${item.type.toLowerCase()}/${item.id}`}
                  key={item.id} 
                  className="group bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
                >
                  <div className="relative">
                    <img
                      src={item.thumbnail || 'https://picsum.photos/320/180'}
                      alt={item.title}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-sm font-medium">
                      {item.type === 'ARTICLE' ? `${item.metadata?.readTime || '5'} min read` :
                       item.type === 'VIDEO' ? `${item.metadata?.duration || '00:00'}` :
                       item.type === 'COURSE' ? `${item.metadata?.duration || '0h 0m'}` : ''}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-2 text-lg group-hover:text-blue-400 transition-colors duration-200">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">{item.creator.name}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{item.viewCount} views</span>
                      {item.price > 0 && (
                        <span className="text-blue-400 font-medium">${item.price}</span>
                      )}
                    </div>
                    {!account?.bech32Address && item.price > 0 && (
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          setShowAccountCreation(true);
                        }}
                        structure="base"
                        className="w-full mt-3 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                      >
                        Sign in to access
                      </Button>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Account Creation Modal */}
      {showAccountCreation && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            // Close modal when clicking the backdrop
            if (e.target === e.currentTarget) {
              setShowAccountCreation(false);
            }
          }}
        >
          <div className="bg-[#1A1D24] rounded-xl p-8 max-w-md w-full border border-gray-800 shadow-xl shadow-blue-500/10 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowAccountCreation(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-800/50 transition-colors duration-200"
              aria-label="Close modal"
            >
              <svg
                className="w-5 h-5 text-gray-400 hover:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Modal Icon */}
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold pb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Create Your XION Account
            </h2>
            
            <p className="text-gray-400 pb-8 text-sm leading-relaxed">
              Get instant access to premium content with gasless transactions. Your XION account enables secure, seamless payments across the platform.
            </p>

            <div className="space-y-6">
              <AccountCreation 
                userId="temp"
                onSuccess={() => {
                  setShowAccountCreation(false);
                }}
                onError={(error) => {
                  console.error('Account creation failed:', error);
                  setShowAccountCreation(false);
                }}
              />

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  By creating an account, you agree to our{' '}
                  <a href="/terms" className="text-blue-400 hover:text-blue-300">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-blue-400 hover:text-blue-300">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
