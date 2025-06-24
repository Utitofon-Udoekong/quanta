'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@burnt-labs/ui";
import { useUserStore } from '@/app/stores/user';
import { Icon } from '@iconify/react';
import { 
  getUserSubscriptions, 
  getCreatorSubscribers, 
  followCreator, 
  unfollowCreator,
  createPaidSubscription,
  cancelPaidSubscription,
  CreatorSubscription,
  Subscriber
} from '@/app/utils/subscription';

export default function SubscriptionsPage() {
  const [mySubscriptions, setMySubscriptions] = useState<CreatorSubscription[]>([]);
  const [mySubscribers, setMySubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');
  const [processing, setProcessing] = useState<string | null>(null);
  
  const { user } = useUserStore();
  const router = useRouter();
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.wallet_address) return;
      
      try {
        setLoading(true);
        
        // Fetch both user's subscriptions and creator's subscribers
        const [subscriptions, subscribers] = await Promise.all([
          getUserSubscriptions(user.wallet_address),
          getCreatorSubscribers(user.wallet_address)
        ]);
        
        setMySubscriptions(subscriptions);
        setMySubscribers(subscribers);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.wallet_address]);

  const handleFollow = async (creatorWallet: string) => {
    if (!user?.wallet_address) return;
    
    setProcessing(creatorWallet);
    try {
      const success = await followCreator(user.wallet_address, creatorWallet);
      if (success) {
        // Refresh data
        const subscriptions = await getUserSubscriptions(user.wallet_address);
        setMySubscriptions(subscriptions);
      }
    } catch (error) {
      console.error('Error following creator:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleUnfollow = async (creatorWallet: string) => {
    if (!user?.wallet_address) return;
    
    setProcessing(creatorWallet);
    try {
      const success = await unfollowCreator(user.wallet_address, creatorWallet);
      if (success) {
        // Refresh data
        const subscriptions = await getUserSubscriptions(user.wallet_address);
        setMySubscriptions(subscriptions);
      }
    } catch (error) {
      console.error('Error unfollowing creator:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleSubscribe = async (creatorWallet: string, type: 'monthly' | 'yearly' | 'one-time', amount: number) => {
    if (!user?.wallet_address) return;
    
    setProcessing(creatorWallet);
    try {
      const success = await createPaidSubscription(user.wallet_address, creatorWallet, type, amount);
      if (success) {
        // Refresh data
        const subscriptions = await getUserSubscriptions(user.wallet_address);
        setMySubscriptions(subscriptions);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelSubscription = async (creatorWallet: string) => {
    if (!user?.wallet_address) return;
    
    setProcessing(creatorWallet);
    try {
      const success = await cancelPaidSubscription(user.wallet_address, creatorWallet);
      if (success) {
        // Refresh data
        const subscriptions = await getUserSubscriptions(user.wallet_address);
        setMySubscriptions(subscriptions);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      <div className="max-w-screen-xl mx-auto space-y-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-white">Subscriptions</h1>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-[#121418] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
              activeTab === 'following'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon icon="mdi:account-group" className="w-5 h-5 mr-2 inline" />
            Following ({mySubscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
              activeTab === 'followers'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon icon="mdi:account-multiple" className="w-5 h-5 mr-2 inline" />
            Followers ({mySubscribers.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'following' ? (
          <div className="bg-[#121418] rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Creators You Follow</h2>
              <p className="text-gray-400 mt-1">Manage your subscriptions and follows</p>
            </div>
            
            {mySubscriptions.length === 0 ? (
              <div className="p-12 text-center">
                <Icon icon="mdi:account-group-outline" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No subscriptions yet</h3>
                <p className="text-gray-500 mb-6">Start following creators to see their content here</p>
                <Button
                  onClick={() => router.push('/discover')}
                  className="px-6 py-3 bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white rounded-lg"
                >
                  Discover Creators
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {mySubscriptions.map((subscription) => (
                  <div key={subscription.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={subscription.avatar_url || `https://robohash.org/${subscription.wallet_address.slice(0, 8)}?set=set4&size=200x200`}
                        alt={subscription.username || 'Creator'}
                        className="w-12 h-12 rounded-full border border-gray-700"
                      />
                      <div>
                        <h3 className="font-semibold text-white">
                          {subscription.username || 'Anonymous Creator'}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {subscription.wallet_address.slice(0, 8)}...{subscription.wallet_address.slice(-6)}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            subscription.type === 'monthly' 
                              ? 'bg-purple-900/40 text-purple-400'
                              : 'bg-gray-900/40 text-gray-400'
                          }`}>
                            {subscription.type === 'monthly' ? 'Monthly' : subscription.type}
                          </span>
                          {subscription.amount && (
                            <span className="text-sm text-gray-400">
                              ${subscription.amount} {subscription.currency}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {subscription.status === 'active' ? (
                        <Button
                          onClick={() => handleCancelSubscription(subscription.wallet_address)}
                          disabled={processing === subscription.wallet_address}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                        >
                          {processing === subscription.wallet_address ? (
                            <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                          ) : (
                            'Cancel'
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleFollow(subscription.wallet_address)}
                          disabled={processing === subscription.wallet_address}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                        >
                          {processing === subscription.wallet_address ? (
                            <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                          ) : (
                            'Follow'
                          )}
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => router.push(`/content/${subscription.creator_id}`)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                      >
                        View Content
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#121418] rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Your Followers</h2>
              <p className="text-gray-400 mt-1">People who follow your content</p>
            </div>
            
            {mySubscribers.length === 0 ? (
              <div className="p-12 text-center">
                <Icon icon="mdi:account-multiple-outline" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No followers yet</h3>
                <p className="text-gray-500 mb-6">Start creating content to attract followers</p>
                <Button
                  onClick={() => router.push('/dashboard/content/create')}
                  className="px-6 py-3 bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white rounded-lg"
                >
                  Create Content
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {mySubscribers.map((subscriber) => (
                  <div key={subscriber.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={subscriber.avatar_url || `https://robohash.org/${subscriber.wallet_address.slice(0, 8)}?set=set4&size=200x200`}
                        alt={subscriber.username || 'Subscriber'}
                        className="w-12 h-12 rounded-full border border-gray-700"
                      />
                      <div>
                        <h3 className="font-semibold text-white">
                          {subscriber.username || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {subscriber.wallet_address.slice(0, 8)}...{subscriber.wallet_address.slice(-6)}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            subscriber.subscription_type === 'free' 
                              ? 'bg-gray-900/40 text-gray-400' 
                              : 'bg-purple-900/40 text-purple-400'
                          }`}>
                            {subscriber.subscription_type === 'free' ? 'Free' : subscriber.subscription_type}
                          </span>
                          {subscriber.amount && (
                            <span className="text-sm text-gray-400">
                              ${subscriber.amount} {subscriber.currency}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Since {new Date(subscriber.subscribed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => router.push(`/content/${subscriber.subscriber_id}`)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 