import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'company' | 'specialist';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  registerCompany: (data: {
    companyName: string;
    email: string;
    password: string;
    location?: string;
    website?: string;
    industry?: string;
  }) => Promise<boolean>;
  registerSpecialist: (data: {
    fullName: string;
    email: string;
    password: string;
    expertise?: string;
    yearsExperience?: number;
    education?: string;
    portfolio?: string;
    programmingLanguages?: string[] | string;
  }) => Promise<boolean>;
  logout: () => void;
  verifyAuth: () => Promise<void>;
  checkAuth: () => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('userType', response.user.userType);
        
        set({ 
          user: response.user, 
          isAuthenticated: true 
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  },

  registerCompany: async (data) => {
    try {
      const response = await authApi.registerCompany(data);
      
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('userType', response.user.userType);
        
        set({ 
          user: response.user, 
          isAuthenticated: true 
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Company registration failed:', error);
      return false;
    }
  },

  registerSpecialist: async (data) => {
    try {
      const response = await authApi.registerSpecialist(data);
      
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('userType', response.user.userType);
        
        set({ 
          user: response.user, 
          isAuthenticated: true 
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Specialist registration failed:', error);
      return false;
    }
  },

  logout: () => {
    authApi.logout();
    set({ 
      user: null, 
      isAuthenticated: false 
    });
  },

  verifyAuth: async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token || !storedUser) {
        set({ isLoading: false });
        return;
      }

      const response = await authApi.verifyToken();
      
      if (response.success && response.user) {
        set({ 
          user: response.user, 
          isAuthenticated: true,
          isLoading: false 
        });
      } else {
        authApi.logout();
        set({ 
          user: null, 
          isAuthenticated: false,
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      authApi.logout();
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  },

  checkAuth: () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    return !!(token && storedUser);
  },
}));

// Initialize auth state on app load
if (typeof window !== 'undefined') {
  useAuth.getState().verifyAuth();
  
  // Listen for unauthorized events (token expired)
  window.addEventListener('unauthorized', () => {
    useAuth.getState().logout();
  });
}