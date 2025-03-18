"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { AccountCreation } from './components/xion/AccountCreation';
import { Button } from "@burnt-labs/ui";
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { prisma } from '@/app/lib/db/client';

// Categories with proper spacing
const categories = [
  { id: 'all', name: 'All' },
  { id: 'videos', name: 'Videos' },
  { id: 'articles', name: 'Articles' },
  { id: 'courses', name: 'Courses' },
  { id: 'software', name: 'Software' },
];

async function getContent() {
  const content = await prisma.content.findMany({
    where: {
      status: 'PUBLISHED'
    },
    include: {
      creator: true,
      metadata: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  return content;
}

export default async function LandingPage() {
  const { data: account } = useAbstraxionAccount();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const content = await getContent();

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
                <div className="flex space-x-2 bg-gray-800/50 p-1 rounded-lg">
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
                  <Menu.Button className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                      {account.bech32Address.slice(0, 2)}
                    </div>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-2 py-2">
                        <div className="px-3 py-2 text-sm text-gray-400 border-b border-gray-700">
                          {account.bech32Address.slice(0, 6)}...{account.bech32Address.slice(-4)}
                        </div>
                        <Menu.Item>
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
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={`${
                                active ? 'bg-gray-700' : ''
                              } block w-full text-left px-3 py-2 rounded-md text-sm text-red-400`}
                            >
                              Sign Out
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {content.map((item) => (
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
        </div>
      </main>

      {/* Account Creation Modal */}
      {showAccountCreation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800/90 backdrop-blur-md rounded-lg p-6 max-w-md w-full border border-gray-700/50 shadow-xl shadow-blue-500/10">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Create Your XION Account
            </h2>
            <p className="text-gray-300 mb-6">
              Create your XION account to access premium content with gasless transactions.
            </p>
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
          </div>
        </div>
      )}
    </div>
  );
}
