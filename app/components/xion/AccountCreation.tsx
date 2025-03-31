"use client";

import { useState, useEffect } from 'react';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';
import { useUserStore } from '@/app/store/use-user-store';
import { useModal } from '@/app/hooks/use-modal';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';

export function AccountCreation() {
  const { data: account } = useAbstraxionAccount();
  const { user, updateUser, fetchUser } = useUserStore();
  const { onClose } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (account?.bech32Address) {
      fetchUser(account.bech32Address);
    }
  }, [account?.bech32Address, fetchUser]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account?.bech32Address) {
      toast.error('Wallet address is required');
      return;
    }

    setIsLoading(true);
    try {
      await updateUser({
        walletAddress: account.bech32Address,
        metaAccountId: account.bech32Address,
        ...formData,
      });
      toast.success('Profile updated successfully');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!account?.bech32Address) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
        <p className="text-gray-600 mb-4">
          Please connect your wallet to create or update your account.
        </p>
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
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            onClick={onClose}
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