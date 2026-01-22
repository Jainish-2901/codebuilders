import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;
// Create axios instance with base URL (if used anywhere else)
const api = axios.create({
  baseURL: `${apiUrl}`,
  withCredentials: true // ✅ Send cookies with requests
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
    setIsAdmin(userData?.role === 'admin' || userData?.isAdmin === true);
    setIsVolunteer(userData?.role === 'volunteer' || userData?.isVolunteer === true);
  };

  // ✅ Initialization Logic
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Just call the API. If cookie exists, it will return user.
        const res = await api.get('/auth/me');
        const userData = res.data.user;

        setUser(userData);
        setSession({ isActive: true }); // Dummy session object
        checkRoles(userData);
      } catch (error) {
        // Not logged in
        setUser(null);
        setSession(null);
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

      const userData = res.data; // Response doesn't contain token anymore

      setUser(userData);
      setSession({ isActive: true });
      checkRoles(userData);

      return { error: null };
    } catch (error) {
      return {
        error: error.response?.data?.message || error.message || "Signup failed",
      };
    }
  };

  // ✅ SignIn accepts 'rememberMe'
  const signIn = async (email, password, rememberMe) => {
    try {
      const res = await api.post('/auth/login', { email, password });

      const { user: userData } = res.data; // Response doesn't contain token anymore

      setUser(userData);
      setSession({ isActive: true });
      checkRoles(userData);

      return { error: null };
    } catch (error) {
      return {
        error: error.response?.data?.message || error.message || "Login failed"
      };
    }
  };

  // ✅ SignOut calls API before clearing storage
  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
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