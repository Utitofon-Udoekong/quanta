"use client";
import { useState, useEffect } from 'react';
import { useAbstraxionAccount, useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { ContentData } from '@/app/old/lib/supabase';
import { supabase } from '@/app/old/lib/supabase';

interface ContentPlayerProps {
  content: ContentData;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export function ContentPlayer({ content, onProgress, onComplete }: ContentPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPurchased, setIsPurchased] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();

  useEffect(() => {
    // Reset player state when content changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [content.id]);

  useEffect(() => {
    const trackUsage = async () => {
      try {
        const { data: usage, error } = await supabase
          .from('content_usage')
          .insert([{
            user_id: content.creator_id,
            content_id: content.id,
            start_time: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) {
          throw error;
        }

        return usage.id;
      } catch (error) {
        console.error('Error tracking content usage:', error);
      }
    };

    trackUsage();
  }, [content.id, content.creator_id]);

  const handlePurchase = async () => {
    try {
      setError(null);
      
      if (!account?.bech32Address) {
        throw new Error('User not authenticated');
      }

      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': account.bech32Address,
        },
        body: JSON.stringify({
          contentId: content.id,
          price: content.price,
          creatorId: content.creator_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { paymentIntentId } = await response.json();

      // Process payment using XION
      if (!client || !account?.bech32Address) {
        throw new Error('Client or account not initialized');
      }

      const sendMsg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.fromPartial({
          fromAddress: account.bech32Address,
          toAddress: content.creator_id,
          amount: [
            {
              denom: "uxion",
              amount: (content.price * 1_000_000).toString(), // Convert to micro XION
            },
          ],
        }),
      };

      const result = await client.signAndBroadcast(
        account.bech32Address,
        [sendMsg],
        "auto"
      );

      if (result.code === 0) {
        setIsPurchased(true);
        setIsPlaying(true);
      } else {
        throw new Error('Payment failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  const handleTimeUpdate = async (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const progress = (video.currentTime / video.duration) * 100;
    setCurrentTime(video.currentTime);
    setDuration(video.duration);

    if (onProgress) {
      onProgress(progress);
    }

    if (progress >= 100 && onComplete) {
      onComplete();
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  if (!account?.bech32Address) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600">Please connect your wallet to purchase content</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={handlePurchase}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!isPurchased) {
    return (
      <div className="text-center p-4">
        <div className="mb-4">
          <p className="text-xl font-semibold">Price: ${content.price}</p>
        </div>
        <button
          onClick={handlePurchase}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Purchase Content
        </button>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
      {content.type === 'VIDEO' ? (
        <video
          src={content.content_url}
          className="w-full h-full"
          controls
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={onComplete}
        />
      ) : content.type === 'AUDIO' ? (
        <audio
          src={content.content_url}
          controls
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={onComplete}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white">
          Course content viewer not implemented yet
        </div>
      )}
    </div>
  );
} 