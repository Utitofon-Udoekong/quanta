import { useUserStore } from '@/app/stores/user';

export function useUserStoreDebug() {
  const { user, loading, error, errorDetails, clearError } = useUserStore();

  const logUserStoreState = () => {
    // console.group('🔍 User Store Debug Info');
    // console.log('User:', user);
    // console.log('Loading:', loading);
    // console.log('Error:', error);
    // console.log('Error Details:', errorDetails);
    // console.groupEnd();
  };

  const logError = () => {
    if (error) {
      // console.group('❌ User Store Error');
      // console.error('Message:', error);
      // console.error('Context:', errorDetails?.context);
      // console.error('Timestamp:', errorDetails?.timestamp);
      // console.error('Stack:', errorDetails?.stack);
      // console.groupEnd();
    }
  };

  return {
    user,
    loading,
    error,
    errorDetails,
    clearError,
    logUserStoreState,
    logError,
    hasError: !!error,
    isAuthenticated: !!user,
    isLoading: loading
  };
} 