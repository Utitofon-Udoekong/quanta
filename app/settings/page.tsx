'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import SearchInput from '@/app/components/ui/SearchInput';
import Link from 'next/link';
import { Button } from '@headlessui/react';

const TABS = ['My Profile', 'Password', 'Notification'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('My Profile');
  const [avatar, setAvatar] = useState('https://robohash.org/206');

  return (
    <div className="mx-auto p-8">
      {/* Top Navigation Bar */}
      <nav className="flex items-center gap-x-4 justify-between bg-transparent mb-8 shadow-lg sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <Link
            href={`/settings`}
            className="py-2 font-medium text-sm transition-colors text-white"
          >
            Settings
          </Link>
        </div>
       
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-[#212121] transition-colors">
            <Icon icon="mdi:bell" className="w-6 h-6 text-gray-400" />
          </button>
          <Button className="bg-gradient-to-r from-[#8B25FF] to-[#350FDD] cursor-pointer text-white px-6 py-2 rounded-full font-semibold shadow-lg">Create</Button>
        </div>
      </nav>
      {/* Tabs */}
      <div className="flex space-x-8 border-b border-gray-700 mb-8">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`pb-2 px-1 text-sm font-semibold transition-colors ${activeTab === tab ? 'border-b-2 border-white text-white' : 'text-gray-400 hover:text-white'
              }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'My Profile' && (
        <div>
          {/* Title and subtitle */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">Customizes Profile</h2>
            <p className="text-xs text-gray-400">Share Your Next Big Hit — Add Details and Upload Your Content</p>
          </div>

          {/* Avatar upload */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-24 h-24 mb-2">
              <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-gray-800" />
              <button className="absolute bottom-0 right-0 bg-gray-900 border-2 border-white rounded-full p-2 hover:bg-gray-800">
                <Icon icon="mdi:camera" className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Profile form */}
          <form className="space-y-5">
            <input
              type="text"
              placeholder="Name"
              className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <textarea
              placeholder="Introduction about your..."
              className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 min-h-[70px]"
            />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            {/* Thumbnail upload */}
            <div className="w-full border border-gray-700 rounded-lg bg-black/30 flex flex-col items-center justify-center py-8 mb-2">
              <Icon icon="mdi:cloud-upload" className="w-10 h-10 text-blue-400 mb-2" />
              <p className="text-gray-300 text-sm">Upload your Thumbnail/drag and drop<br />Thumbnail file for your banner</p>
            </div>
            <input
              type="text"
              placeholder="Add social media link"
              className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="w-full mt-4 py-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-lg shadow-lg hover:from-purple-600 hover:to-blue-600 transition-colors"
            >
              Submit
            </button>
          </form>
        </div>
      )}
      {activeTab === 'Password' && (
        <div className="mx-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">Password Settings</h2>
            <p className="text-xs text-gray-400">Update your password to maintain top-level security</p>
          </div>
          <form className="space-y-5">
            <div className="relative">
              <input
                type="password"
                placeholder="New Password"
                className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 pr-12"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <Icon icon="mdi:eye-outline" className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 pr-12"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <Icon icon="mdi:eye-outline" className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
      {activeTab === 'Notification' && (
        <div className="mx-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">Notification Settings</h2>
            <p className="text-xs text-gray-400">Customize How You Receive Alerts and Updates</p>
          </div>
          <div className="divide-y divide-gray-800">
            {[
              {
                label: 'Comments',
                desc: 'These are notifications for comment on your posts and replies to your comment',
              },
              {
                label: 'Security Alerts',
                desc: 'Stay informed about scheduled maintenance, platform updates, transaction alerts, and security notifications.',
              },
              {
                label: 'Transaction Alerts',
                desc: 'Receive real-time updates on payment activity, account changes, security alerts.',
              },
              {
                label: 'Reminders',
                desc: 'These are notifications that reminds you about the updates you might have missed',
              },
              {
                label: 'Promotions & Offers',
                desc: 'Get news about new features, discounts, or events.',
              },
              {
                label: 'System Updates',
                desc: 'Stay informed about scheduled maintenance and platform updates',
              },
            ].map((item, idx) => (
              <div key={item.label} className="flex items-center justify-between py-5">
                <div>
                  <div className="text-sm font-semibold text-white mb-1">{item.label}</div>
                  <div className="text-xs text-gray-400 max-w-xs">{item.desc}</div>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked readOnly className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 transition-colors duration-200 relative">
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-200 peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 