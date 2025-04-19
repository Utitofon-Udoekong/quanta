"use client";

import { useAbstraxionAccount, useModal, Abstraxion } from "@burnt-labs/abstraxion";
import { useEffect, useState } from 'react';
import { Button } from "@burnt-labs/ui";
import { 
  UserCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
  WalletIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { createClient } from "@/app/utils/supabase/client";
import { UserData } from "@/app/types";
import { toast } from "@/app/components/helpers/toast";
import { useUserStore } from "@/app/stores/user";

export default function ProfilePage() {
  const { data: account } = useAbstraxionAccount();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const supabase = createClient();
  const [, setShowModal] = useModal();
  const { user, error } = useUserStore()

  useEffect(() => {
    const fetchProfileData = async () => {
      
      try {
        setLoading(true);
        
        // Get current user from Supabase auth
        if (error || !user) {
          throw new Error('Failed to fetch user data');
        }
        if (account?.bech32Address && !user.wallet_address) {
          await supabase.from('users').update({
            wallet_address: account.bech32Address,
            updated_at: new Date().toISOString()
          }).eq('id', user.id);
        }
        // Combine auth user data with extended data
        setUserData(user);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast('Failed to load profile data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [supabase, user]);

  const handleSaveProfile = async () => {
    if (!userData) return;

    if (!account?.bech32Address) {
      toast('Please connect your wallet to update your profile', 'error');
      return;
    }
    
    setSaving(true);
    try {
      // Update user metadata in auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          bio: userData.bio
        }
      });

      if (authError) {
        toast('Failed to update profile', 'error');
        throw authError;
      };

      // Update extended user data
      const { error: extendedError } = await supabase
        .from('users')
        .update({
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (extendedError) {
        toast('Failed to update profile', 'error');
        throw extendedError;
      };

      toast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = (updates: Partial<UserData>) => {
    setUserData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates
      };
    });
  };

  const handleChangeWallet = () => {
    setShowModal(true);
  };

  const handleCloseModal = async () => {
    setShowModal(false);
    const { error: extendedError } = await supabase
        .from('users')
        .update({
          wallet_address: account?.bech32Address,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData?.id);
    if (extendedError) {
      toast('Failed to update wallet address', 'error');
      throw extendedError;
    };
    toast('Wallet address updated successfully', 'success');
  };

  if (!account?.bech32Address) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0C10]">
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

  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0C10]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Profile Settings</h1>
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
                    <div className="w-20 h-20 rounded-full bg-gray-800/50 border border-gray-700/50 flex items-center justify-center overflow-hidden">
                      {userData.avatar_url ? (
                        <img 
                          src={userData.avatar_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PhotoIcon className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <button
                      className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={userData.full_name || ''}
                    onChange={(e) => handleUpdateUser({ full_name: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={userData.email}
                    disabled
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                  <textarea
                    value={userData.bio || ''}
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
                    userData.wallet_address 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {userData.wallet_address ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">Admin Status</h3>
                    <p className="text-sm text-gray-400">Platform administration privileges</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    userData.is_admin 
                      ? 'bg-blue-500/10 text-blue-400' 
                      : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {userData.is_admin ? 'Active' : 'Inactive'}
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
                  <Button
                    className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg"
                    onClick={handleChangeWallet}
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
                {/* <Button
                  structure="base"
                  className="w-full bg-gray-700 hover:bg-gray-600"
                >
                  Change Password
                </Button> */}
                <button
                  className="w-full px-6 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Abstraxion Modal */}
      <Abstraxion onClose={handleCloseModal} />
    </div>
  );
} 