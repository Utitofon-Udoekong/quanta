'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from "@headlessui/react"
import { UserData } from "@/app/types";
import { toast } from "@/app/components/helpers/toast";
import { useUserStore } from "@/app/stores/user";
import { supabase } from "@/app/utils/supabase/client";
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';

const TABS = ['My Profile', 'Subscription Settings', 'Account Security', 'Notifications'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('My Profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { data: account } = useAbstraxionAccount();
  const { user, error } = useUserStore();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        if (error || !user) {
          throw new Error('Failed to fetch user data');
        }
        setUserData(user);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user, error]);

  const handleSaveProfile = async () => {
    if (!userData) return;
    setSaving(true);
    try {
      const { error: extendedError } = await supabase
        .from('users')
        .update({
          username: userData.username,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
          subscription_price: userData.subscription_price,
          subscription_currency: userData.subscription_currency,
          subscription_type: userData.subscription_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (extendedError) {
        toast.error('Failed to update profile');
        throw extendedError;
      }
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (updates: Partial<UserData>) => {
    if (!userData) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('wallet_address', userData.wallet_address);

      if (error) throw error;
      setUserData({ ...userData, ...updates });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!account?.bech32Address) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0C10]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-200 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-4">Please connect your wallet to access your profile.</p>
        </div>
      </div>
    );
  }

  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0C10]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 px-6 py-3 rounded-lg"
          onClick={handleSaveProfile}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      
      <div className="flex space-x-8 border-b border-gray-700 mb-8">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`pb-2 px-1 text-sm font-semibold transition-colors ${activeTab === tab ? 'border-b-2 border-white text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'My Profile' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">Customize Profile</h2>
            <p className="text-xs text-gray-400">Share Your Next Big Hit — Add Details and Upload Your Content</p>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="relative w-24 h-24 mb-2">
              <img 
                src={userData.avatar_url || 'https://robohash.org/206'} 
                alt="Avatar" 
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-800" 
              />
              <button className="absolute bottom-0 right-0 bg-gray-900 border-2 border-white rounded-full p-2 hover:bg-gray-800">
                <Icon icon="mdi:camera" className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
            <input
              type="text"
              placeholder="Username"
              value={userData.username || ''}
              onChange={(e) => handleUpdateUser({ username: e.target.value })}
              className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <textarea
              placeholder="Bio - Introduction about yourself..."
              value={userData.bio || ''}
              onChange={(e) => handleUpdateUser({ bio: e.target.value })}
              className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 min-h-[70px]"
            />
            <input
              type="text"
              placeholder="Wallet Address"
              value={userData.wallet_address}
              disabled
              className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
            />
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
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Submit'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'Subscription Settings' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">Subscription Settings</h2>
            <p className="text-xs text-gray-400">Configure your creator subscription pricing and preferences</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Subscription Price (USD)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={userData.subscription_price ?? 5.00}
                onChange={e => handleUpdateUser({ subscription_price: parseFloat(e.target.value) })}
                className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Currency</label>
              <select
                value={userData.subscription_currency ?? 'USD'}
                onChange={e => handleUpdateUser({ subscription_currency: e.target.value })}
                className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Subscription Type</label>
              <select
                value={userData.subscription_type ?? 'monthly'}
                onChange={e => handleUpdateUser({ subscription_type: e.target.value })}
                className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Account Security' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">Account Security</h2>
            <p className="text-xs text-gray-400">Manage your wallet connection and account security</p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Icon icon="heroicons:wallet" className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold">Connected Wallet</h3>
              </div>
              <div className="flex items-center space-x-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                  {account.bech32Address?.slice(0, 2)}
                </div>
                <span className="text-sm text-gray-300">
                  {account.bech32Address?.slice(0, 6)}...{account.bech32Address?.slice(-4)}
                </span>
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Icon icon="heroicons:shield-check" className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold">Account Status</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-200">Creator Status</h4>
                    <p className="text-sm text-gray-400">Ability to create and publish content</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${userData.wallet_address ? 'bg-green-500/10 text-green-400' : 'bg-gray-700/50 text-gray-400'}`}>
                    {userData.wallet_address ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-200">Admin Status</h4>
                    <p className="text-sm text-gray-400">Platform administration privileges</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${userData.is_admin ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-700/50 text-gray-400'}`}>
                    {userData.is_admin ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Icon icon="heroicons:key" className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold">Account Actions</h3>
              </div>
              <div className="space-y-3">
                <button className="w-full px-6 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Notifications' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">Notification Settings</h2>
            <p className="text-xs text-gray-400">Customize How You Receive Alerts and Updates</p>
          </div>
          <div className="divide-y divide-gray-800">
            {[
              { label: 'Comments', desc: 'These are notifications for comment on your posts and replies to your comment' },
              { label: 'Security Alerts', desc: 'Stay informed about scheduled maintenance, platform updates, transaction alerts, and security notifications.' },
              { label: 'Transaction Alerts', desc: 'Receive real-time updates on payment activity, account changes, security alerts.' },
              { label: 'Reminders', desc: 'These are notifications that reminds you about the updates you might have missed' },
              { label: 'Promotions & Offers', desc: 'Get news about new features, discounts, or events.' },
              { label: 'System Updates', desc: 'Stay informed about scheduled maintenance and platform updates' },
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
