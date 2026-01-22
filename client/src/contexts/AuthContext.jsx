import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;
// Create axios instance with base URL
const api = axios.create({
  baseURL: `${apiUrl}`,
  withCredentials: true // ✅ Send cookies with requests
});

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check roles based on user data
  const checkRoles = (userData) => {
    setIsAdmin(userData?.role === 'admin' || userData?.isAdmin === true);
    setIsVolunteer(userData?.role === 'volunteer' || userData?.isVolunteer === true);
  };

  // ✅ Initialization Logic
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        const userData = res.data.user;

        setUser(userData);
        checkRoles(userData);
      } catch (error) {
        // If 401/403, just means not logged in
        setUser(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // ✅ UPDATE: signUp now accepts 'phone'
  const signUp = async (name, email, password, phone) => {
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        phone,
      });

      // Cookie is set by server automatically
      const userData = res.data.user; // Server might return user object without token now

      setUser(userData);
      checkRoles(userData);

      return { error: null };
    } catch (error) {
      return {
        error: error.response?.data?.message || error.message || "Signup failed",
      };
    }
  };

  // ✅ SignIn
  const signIn = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });

      // Cookie is set by server automatically
      const userData = res.data.user;

      setUser(userData);
      checkRoles(userData);

      return { error: null };
    } catch (error) {
      return {
        error: error.response?.data?.message || error.message || "Login failed"
      };
    }
  };

  // ✅ SignOut calls API which clears cookie
  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear Local State
      setUser(null);
      setIsAdmin(false);
      setIsVolunteer(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isVolunteer, isLoading, signIn, signUp, signOut }}>
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