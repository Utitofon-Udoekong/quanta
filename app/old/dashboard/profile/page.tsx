"use client";

import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { useEffect, useState } from 'react';
import { Button } from "@burnt-labs/ui";
import { 
  UserCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
  WalletIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useUserStore } from '@/app/store/use-user-store';

interface UserData {
  id: string;
  wallet_address: string;
  meta_account_id: string;
  full_name: string;
  email: string;
  is_creator: boolean;
  is_admin: boolean;
  bio?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { data: account } = useAbstraxionAccount();
  const { user, setUser, updateUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extendedUser, setExtendedUser] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!account?.bech32Address) return;
      
      try {
        const response = await fetch(`/api/user?walletAddress=${account.bech32Address}`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        const data = await response.json();
        setUser(data);
        setExtendedUser(data as UserData);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [account?.bech32Address]);

  const handleSaveProfile = async () => {
    if (!extendedUser || !account?.bech32Address) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': account.bech32Address,
        },
        body: JSON.stringify({
          full_name: extendedUser.full_name,
          email: extendedUser.email,
          bio: extendedUser.bio,
          avatar: extendedUser.avatar,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      updateUser(updatedUser);
      setExtendedUser(updatedUser as UserData);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = (updates: Partial<UserData>) => {
    setExtendedUser(prev => prev ? { ...prev, ...updates } : null);
  };

  if (!account?.bech32Address) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-200 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-4">Please connect your wallet to access your profile.</p>
        </div>
      </div>
    );
  }

  if (loading || !extendedUser) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className="text-gray-400">Manage your account and preferences</p>
          </div>
          <Button
            structure="base"
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <UserCircleIcon className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-semibold">Basic Information</h2>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Profile Picture</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full bg-gray-800/50 border border-gray-700/50 flex items-center justify-center">
                      {extendedUser.avatar ? (
                        <img src={extendedUser.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <PhotoIcon className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <Button
                      structure="base"
                      className="bg-gray-700 hover:bg-gray-600"
                    >
                      Change Photo
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={extendedUser.full_name}
                    onChange={(e) => handleUpdateUser({ full_name: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={extendedUser.email}
                    onChange={(e) => handleUpdateUser({ email: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                  <textarea
                    value={extendedUser.bio || ''}
                    onChange={(e) => handleUpdateUser({ bio: e.target.value })}
                    rows={4}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                  <h2 className="text-xl font-semibold">Account Status</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">Creator Status</h3>
                    <p className="text-sm text-gray-400">Ability to create and publish content</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    extendedUser.is_creator 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {extendedUser.is_creator ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">Admin Status</h3>
                    <p className="text-sm text-gray-400">Platform administration privileges</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    extendedUser.is_admin 
                      ? 'bg-blue-500/10 text-blue-400' 
                      : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {extendedUser.is_admin ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Wallet Information */}
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <WalletIcon className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-semibold">Wallet</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Connected Wallet</label>
                    <div className="flex items-center space-x-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                        {account.bech32Address.slice(0, 2)}
                      </div>
                      <span className="text-sm text-gray-300">
                        {account.bech32Address.slice(0, 6)}...{account.bech32Address.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">XION Account ID</label>
                    <div className="flex items-center space-x-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2">
                      <span className="text-sm text-gray-300">
                        {extendedUser.meta_account_id || 'Not connected'}
                      </span>
                    </div>
                  </div>
                  <Button
                    structure="base"
                    className="w-full bg-gray-700 hover:bg-gray-600"
                  >
                    Change Wallet
                  </Button>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <KeyIcon className="w-5 h-5 text-red-400" />
                  <h2 className="text-xl font-semibold">Account Actions</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <Button
                  structure="base"
                  className="w-full bg-gray-700 hover:bg-gray-600"
                >
                  Change Password
                </Button>
                <Button
                  structure="base"
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 