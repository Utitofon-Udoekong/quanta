"use client";
import { useState } from 'react';
import { useAbstraxionAccount, useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import { ContentType } from '@prisma/client';
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";

interface ContentPlayerProps {
  contentId: string;
  type: ContentType;
  price: number;
  creatorId: string;
  contentUrl: string;
  previewUrl: string;
}

export function ContentPlayer({
  contentId,
  type,
  price,
  creatorId,
  contentUrl,
  previewUrl,
}: ContentPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();

  const handlePurchase = async () => {
    try {
      setError(null);
      
      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          price,
          creatorId,
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
          toAddress: creatorId,
          amount: [
            {
              denom: "uxion",
              amount: (price * 1_000_000).toString(), // Convert to micro XION
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
          <p className="text-xl font-semibold">Price: ${price}</p>
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
      {type === ContentType.VIDEO ? (
        <video
          src={contentUrl}
          controls
          className="w-full h-full"
          autoPlay={isPlaying}
        />
      ) : type === ContentType.AUDIO ? (
        <audio
          src={contentUrl}
          controls
          className="w-full"
          autoPlay={isPlaying}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-white">Preview not available for this content type</p>
        </div>
      )}
    </div>
  );
} 