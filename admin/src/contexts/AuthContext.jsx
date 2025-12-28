import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;
// Create axios instance with base URL
const api = axios.create({ baseURL: `${apiUrl}` });

// Add token to every request if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check roles based on user data
  const checkRoles = (userData) => {
    // Modify this logic based on how your database stores roles
    // Example: userData.role === 'admin' or userData.isAdmin === true
    setIsAdmin(userData?.role === 'admin' || userData?.isAdmin === true);
    setIsVolunteer(userData?.role === 'volunteer' || userData?.isVolunteer === true);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token and get user data from backend
          // Ensure your backend has a GET /api/auth/me route
          const res = await api.get('/auth/me'); 
          const userData = res.data;
          
          setUser(userData);
          setSession({ access_token: token });
          checkRoles(userData);
        } catch (error) {
          console.error('Error restoring session:', error);
          localStorage.removeItem('token');
          setUser(null);
          setSession(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (name, email, password) => {
  try {
    // Ensure backend route exists: POST /auth/register
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
    });

    const { token, user: userData } = res.data;

    localStorage.setItem('token', token);
    setUser(userData);
    setSession({ access_token: token });
    checkRoles(userData);

    return { error: null };
  } catch (error) {
    return {
      error:
        error.response?.data?.message ||
        error.message ||
        "Signup failed",
    };
  }
};


  const signIn = async (email, password) => {
    try {
      // Ensure your backend has a POST /api/auth/login route
      const res = await api.post('/auth/login', { email, password });
      
      const { token, user: userData } = res.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      setSession({ access_token: token });
      checkRoles(userData);
      
      return { error: null };
    } catch (error) {
      return { 
        error: error.response?.data?.message || error.message || "Login failed" 
      };
    }
  };

  const signOut = async () => {
    try {
      // Optional: Call logout endpoint if needed
      // await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsVolunteer(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isVolunteer, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}