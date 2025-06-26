-- Migration: Enable real-time subscriptions for notifications table
-- This allows the frontend to receive live updates when notifications are created or updated

-- Enable replication for real-time subscriptions
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Add index for faster queries by user_id and created_at
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC);

-- Add comment explaining the purpose
COMMENT ON TABLE notifications IS 'User notifications with real-time subscription support'; 