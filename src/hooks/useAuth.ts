// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'klypp_token';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const stored = await AsyncStorage.getItem(TOKEN_KEY);
      if (stored) {
        // Validate expiry
        const payload = JSON.parse(atob(stored.split('.')[1]));
        if (!payload.exp || payload.exp > Math.floor(Date.now() / 1000)) {
          setToken(stored);
          setUser(payload);
        } else {
          await AsyncStorage.removeItem(TOKEN_KEY);
        }
      }
    } catch {}
    setLoading(false);
  };

  const login = useCallback(async (newToken: string) => {
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    const payload = JSON.parse(atob(newToken.split('.')[1]));
    setToken(newToken);
    setUser(payload);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return { token, user, loading, login, logout };
}

// Simple base64 decode for JWT (works on RN)
function atob(str: string) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}
