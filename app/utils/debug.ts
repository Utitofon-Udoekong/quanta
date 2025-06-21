import { useUserStore } from '@/app/stores/user';

// Debug utilities for browser console
export const debugUserStore = {
  // Get current state
  getState: () => useUserStore.getState(),
  
  // Log current state
  logState: () => {
    const state = useUserStore.getState();
    console.group('🔍 User Store State');
    console.log('User:', state.user);
    console.log('Loading:', state.loading);
    console.log('Error:', state.error);
    console.log('Error Details:', state.errorDetails);
    console.groupEnd();
    return state;
  },
  
  // Clear error
  clearError: () => {
    useUserStore.getState().clearError();
    console.log('✅ Error cleared');
  },
  
  // Clear user
  clearUser: () => {
    useUserStore.getState().clearUser();
    console.log('✅ User cleared');
  },
  
  // Test fetch user
  testFetchUser: (walletAddress: string) => {
    console.log(`🔄 Testing fetch user for: ${walletAddress}`);
    return useUserStore.getState().fetchUser(walletAddress);
  },
  
  // Get user info
  getUserInfo: () => {
    const { user } = useUserStore.getState();
    if (user) {
      console.group('👤 User Info');
      console.log('ID:', user.id);
      console.log('Wallet:', user.wallet_address);
      console.log('Chain:', user.wallet_chain);
      console.log('Created:', user.created_at);
      console.log('Last Login:', user.last_login_at);
      console.groupEnd();
      return user;
    } else {
      console.log('❌ No user found');
      return null;
    }
  },
  
  // Check authentication status
  checkAuth: () => {
    const { user, loading, error } = useUserStore.getState();
    console.group('🔐 Auth Status');
    console.log('Has User:', !!user);
    console.log('Loading:', loading);
    console.log('Has Error:', !!error);
    console.log('Error:', error);
    console.groupEnd();
    return { hasUser: !!user, loading, hasError: !!error, error };
  }
};

// Make it available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugUserStore = debugUserStore;
  console.log('🔧 User Store Debug available: window.debugUserStore');
  console.log('📖 Available methods:');
  console.log('  - debugUserStore.logState() - Log current state');
  console.log('  - debugUserStore.clearError() - Clear error');
  console.log('  - debugUserStore.clearUser() - Clear user');
  console.log('  - debugUserStore.testFetchUser(address) - Test fetch');
  console.log('  - debugUserStore.getUserInfo() - Get user details');
  console.log('  - debugUserStore.checkAuth() - Check auth status');
} 