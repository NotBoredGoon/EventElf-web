import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (onSuccess?: () => void) => void;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  token: null,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [onAuthSuccess, setOnAuthSuccess] = useState<(() => void) | undefined>();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/auth/status', {
        credentials: 'include', // Important for cookies/sessions
      });
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback((callback?: () => void) => {
    if (callback) {
      setOnAuthSuccess(() => callback);
    }
    // open the OAuth URL in a popup
    window.open(
      '/auth/login',
      'AuthPopup',
      'width=500,height=700'
    );

    function onAuthMessage(event: MessageEvent<{ success: boolean; token: string }>) {
      console.log('function onAuthMessage is called');
      // only accept messages from backend origin
      if (event.origin !== 'http://127.0.0.1:5000') {
        console.warn('Ignored message from unknown origin:', event.origin);
        return;
      }

      // event.data might be { success: true, token: '…', user: {…} }
      const { success, token } = event.data;
      console.log("Success: ", success, "Token: ", token);
      if (success && token) {
        // store token however you like (e.g. localStorage, context, etc.)
        console.log('in success && token if statement');
        localStorage.setItem('jwt', token);
        setToken(token);
        setIsAuthenticated(true);
        // Call the success callback if it exists
        if (onAuthSuccess) {
          onAuthSuccess();
          setOnAuthSuccess(undefined);
        }
      }
      window.removeEventListener('message', onAuthMessage);
    }

    window.addEventListener('message', onAuthMessage);
  }, [onAuthSuccess]);

  const logout = () => {
    // Redirect to the backend logout route
    window.location.href = '/auth/logout';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};