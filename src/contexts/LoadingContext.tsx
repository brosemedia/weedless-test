import React, { createContext, useContext, useState, useCallback } from 'react';
import { LoadingOverlay } from '../components/LoadingOverlay';

type LoadingContextType = {
  isLoading: boolean;
  showLoading: (message?: string, useAnimation?: boolean) => void;
  hideLoading: () => void;
  loadingMessage: string | undefined;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);
  const [useAnimation, setUseAnimation] = useState(false);

  const showLoading = useCallback((message?: string, useAnimationFlag?: boolean) => {
    setLoadingMessage(message);
    setUseAnimation(useAnimationFlag ?? false);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(undefined);
    setUseAnimation(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading, loadingMessage }}>
      {children}
      <LoadingOverlay visible={isLoading} message={loadingMessage} useAnimation={useAnimation} />
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};

