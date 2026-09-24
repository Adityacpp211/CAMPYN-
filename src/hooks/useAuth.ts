import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { User } from '../types';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const sessionRes = await api.auth.getSession();
      if (sessionRes && sessionRes.user) {
        setCurrentUser({
          ...sessionRes.user,
          role: sessionRes.role,
          permissions: sessionRes.permissions,
          departmentId: sessionRes.department?.id,
        });
        setSessionExpired(false);
      } else {
        setCurrentUser(null);
      }
    } catch (err: any) {
      console.warn('[useAuth] Session check failed:', err.message);
      setCurrentUser(null);
      setError(err.message || 'Session expired or invalid');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    // Subscribe to global 401 unauthorized events from api client
    const unsubscribe = api.onUnauthorized(() => {
      setCurrentUser(null);
      setSessionExpired(true);
    });

    return unsubscribe;
  }, [fetchSession]);

  const login = async (email: string, pass: string): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(email, pass);
      const user: User = {
        ...res.user,
        role: res.session?.role || res.user.role,
        permissions: res.session?.permissions || res.user.permissions,
        departmentId: res.session?.departmentId || res.user.departmentId,
      };
      setCurrentUser(user);
      setSessionExpired(false);
      return user;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.auth.logout();
    } catch (err) {
      console.error('[useAuth] Error logging out:', err);
    } finally {
      setCurrentUser(null);
      setLoading(false);
    }
  };

  return {
    currentUser,
    loading,
    error,
    sessionExpired,
    isAuthenticated: !!currentUser,
    login,
    logout,
    refetchSession: fetchSession,
  };
}
