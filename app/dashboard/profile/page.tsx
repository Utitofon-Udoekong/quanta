"use client";

import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { useEffect, useState } from 'react';
import { Button } from "@burnt-labs/ui";
import { 
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  WalletIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

interface ProfileData {
  name: string;
  email: string;
  bio: string;
  avatar: string;
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  security: {
    twoFactor: boolean;
    emailVerification: boolean;
  };
}

export default function ProfilePage() {
  const { data: account } = useAbstraxionAccount();
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    bio: '',
    avatar: '',
    notifications: {
      email: true,
      push: true,
      marketing: false
    },
    security: {
      twoFactor: false,
      emailVerification: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!account?.bech32Address) return;
      
      try {
        // TODO: Replace with actual API call
        // Simulated data for now
        setProfile({
          name: 'John Doe',
          email: 'john@example.com',
          bio: 'Web3 developer and content creator',
          avatar: '',
          notifications: {
            email: true,
            push: true,
            marketing: false
          },
          security: {
            twoFactor: false,
            emailVerification: true
          }
        });
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [account?.bech32Address]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // TODO: Implement profile update API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      // Show success message or handle response
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
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

  if (loading) {
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
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
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
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                  <h2 className="text-xl font-semibold">Security</h2>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                  </div>
                  <Button
                    structure="base"
                    className={`${profile.security.twoFactor ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={() => setProfile({
                      ...profile,
                      security: { ...profile.security, twoFactor: !profile.security.twoFactor }
                    })}
                  >
                    {profile.security.twoFactor ? 'Enabled' : 'Enable'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">Email Verification</h3>
                    <p className="text-sm text-gray-400">Verify your email address for enhanced security</p>
                  </div>
                  <Button
                    structure="base"
                    className={`${profile.security.emailVerification ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={() => setProfile({
                      ...profile,
                      security: { ...profile.security, emailVerification: !profile.security.emailVerification }
                    })}
                  >
                    {profile.security.emailVerification ? 'Verified' : 'Verify'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
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
                    structure="base"
                    className="w-full bg-gray-700 hover:bg-gray-600"
                  >
                    Change Wallet
                  </Button>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <BellIcon className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-xl font-semibold">Notifications</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">Email Notifications</h3>
                    <p className="text-sm text-gray-400">Receive updates via email</p>
                  </div>
                  <Button
                    structure="base"
                    className={`${profile.notifications.email ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={() => setProfile({
                      ...profile,
                      notifications: { ...profile.notifications, email: !profile.notifications.email }
                    })}
                  >
                    {profile.notifications.email ? 'On' : 'Off'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">Push Notifications</h3>
                    <p className="text-sm text-gray-400">Receive browser notifications</p>
                  </div>
                  <Button
                    structure="base"
                    className={`${profile.notifications.push ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={() => setProfile({
                      ...profile,
                      notifications: { ...profile.notifications, push: !profile.notifications.push }
                    })}
                  >
                    {profile.notifications.push ? 'On' : 'Off'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">Marketing Emails</h3>
                    <p className="text-sm text-gray-400">Receive promotional content</p>
                  </div>
                  <Button
                    structure="base"
                    className={`${profile.notifications.marketing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={() => setProfile({
                      ...profile,
                      notifications: { ...profile.notifications, marketing: !profile.notifications.marketing }
                    })}
                  >
                    {profile.notifications.marketing ? 'On' : 'Off'}
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