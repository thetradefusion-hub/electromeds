import { useCallback } from 'react';
import { handleApiError, showApiError, ApiError } from '@/utils/apiErrorHandler';

export const useApiError = () => {
  const handleError = useCallback((error: unknown): ApiError => {
    return handleApiError(error);
  }, []);

  const showError = useCallback((error: unknown, defaultMessage?: string) => {
    return showApiError(error, defaultMessage);
  }, []);

  return {
    handleError,
    showError,
  };
};

