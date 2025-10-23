import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/index';

interface AuthContextType {
  user: User | null;    
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    // Check for existing token on app startup AND when localStorage changes
    useEffect(() => {
        const checkAuthStatus = () => {
            const token = localStorage.getItem('token');
            if (token) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
            setIsLoading(false);
        };

        checkAuthStatus();

        // Listen for storage changes (when token is added/removed)
        const handleStorageChange = () => {
            checkAuthStatus();
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Also listen for custom events when we set token manually
        window.addEventListener('authStateChange', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authStateChange', handleStorageChange);
        };
    }, []);

    const setAuthenticated = (value: boolean) => {
        setIsAuthenticated(value);
        if (!value) {
            localStorage.removeItem('token');
        }
        // Dispatch custom event to trigger re-check
        window.dispatchEvent(new Event('authStateChange'));
    };

    const login = async (email: string, password: string) => {
        console.log(email, password);
    }

    const logout = async () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        window.dispatchEvent(new Event('authStateChange'));
        console.log('logout');
    }

    const values={
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        setAuthenticated
    }

    return (
        <AuthContext.Provider value={values}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
