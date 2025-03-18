"use client";

import { useState } from 'react';
import { useModal } from "@burnt-labs/abstraxion";
import { Abstraxion } from "@burnt-labs/abstraxion";
import { useXion } from './XionProvider';
import { Button } from "@burnt-labs/ui";

interface AccountCreationProps {
  userId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function AccountCreation({ userId, onSuccess, onError }: AccountCreationProps) {
  const [loading, setLoading] = useState(false);
  const [, setShowModal] = useModal();
  const { setPendingUserId } = useXion();

  const handleCreateAccount = () => {
    setLoading(true);
    setPendingUserId(userId);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setPendingUserId(null);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Button 
        fullWidth 
        onClick={handleCreateAccount} 
        structure="base"
        disabled={loading}
      >
        {loading ? "Creating Account..." : "Create XION Account"}
      </Button>

      <Abstraxion onClose={handleClose} />
    </div>
  );
} 