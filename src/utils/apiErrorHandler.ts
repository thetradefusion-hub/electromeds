import { toast } from 'sonner';
import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const response = error.response;
    
    if (response) {
      const data = response.data as any;
      
      // Handle validation errors
      if (response.status === 400 && data.errors) {
        const errorMessages = Object.values(data.errors).flat() as string[];
        return {
          message: errorMessages.join(', ') || data.message || 'Validation error',
          status: response.status,
          errors: data.errors,
        };
      }
      
      // Handle other API errors
      return {
        message: data.message || error.message || 'An error occurred',
        status: response.status,
      };
    }
    
    // Network error
    if (error.code === 'ERR_NETWORK') {
      return {
        message: 'Network error. Please check your internet connection.',
        status: 0,
      };
    }
  }
  
  // Unknown error
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred',
    };
  }
  
  return {
    message: 'An unexpected error occurred',
  };
};

export const showApiError = (error: unknown, defaultMessage?: string) => {
  const apiError = handleApiError(error);
  toast.error(apiError.message || defaultMessage || 'An error occurred');
  return apiError;
};

