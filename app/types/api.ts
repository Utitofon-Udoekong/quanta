export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code?: string | number;
    message: string;
    details?: any;
  };
} 