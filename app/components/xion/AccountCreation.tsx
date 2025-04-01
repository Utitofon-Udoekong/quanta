"use client";

import { useState, useEffect } from 'react';
import { useAbstraxionAccount, useModal } from '@burnt-labs/abstraxion';
import { Abstraxion } from '@burnt-labs/abstraxion';
import { useUserStore } from '@/app/store/use-user-store';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { UserData } from '@/app/lib/supabase';

interface AccountCreationProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function AccountCreation({ onSuccess, onError }: AccountCreationProps) {
  const { data: account } = useAbstraxionAccount();
  const { user, updateUser, fetchUser } = useUserStore();
  const [, setShowModal] = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleClose = () => {
    setShowModal(false);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account?.bech32Address) {
      toast.error('Wallet address is required');
      return;
    }

    setIsLoading(true);
    try {
      // First, try to create the user
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': account.bech32Address,
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          is_creator: false,
          is_admin: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const userData = await response.json();
      await updateUser(userData);
      // Only fetch the user after successful creation
      await fetchUser(account.bech32Address);
      toast.success('Profile updated successfully');
      handleClose();
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update profile');
      toast.error(err.message);
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!account?.bech32Address) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
        <p className="text-gray-600 mb-4">
          Please connect your wallet to create or access your account.
        </p>
        <Button 
          onClick={() => setShowModal(true)} 
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600"
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </Button>
        <Abstraxion onClose={handleClose} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        {user ? 'Update Profile' : 'Create Account'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Name</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Enter your name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : user ? 'Update Profile' : 'Create Account'}
          </Button>
        </div>
      </form>
    </div>
  );
} 