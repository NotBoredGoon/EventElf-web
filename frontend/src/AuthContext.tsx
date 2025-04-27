import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
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

  const login = useCallback(() => {
    // open the OAuth URL in a popup
    window.open(
      '/auth/login',
      'AuthPopup',
      'width=500,height=700'
    );

    // listen for the message from the popup
    window.addEventListener('message', onAuthMessage);

    function onAuthMessage(event: MessageEvent<{ success: boolean; token: string }>) {
      // // only accept messages from backend origin
      if (event.origin !== window.origin) return;

      // event.data might be { success: true, token: '…', user: {…} }
      const { success, token } = event.data;
      if (success && token) {
        // store token however you like (e.g. localStorage, context, etc.)
        localStorage.setItem('jwt', token);
        setToken(token);
      }
      window.removeEventListener('message', onAuthMessage);
    }

    window.addEventListener('message', onAuthMessage);
  }, []);

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