'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface UserInfo {
  name: string;
  phone: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  phone: string;
  user: UserInfo;
  login: (phone: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  phone: '',
  user: { name: '管理员', phone: '' },
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('auth_phone');
    if (stored) {
      setIsLoggedIn(true);
      setPhone(stored);
    }
  }, []);

  const login = useCallback((userPhone: string) => {
    localStorage.setItem('auth_phone', userPhone);
    setIsLoggedIn(true);
    setPhone(userPhone);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_phone');
    setIsLoggedIn(false);
    setPhone('');
  }, []);

  const user: UserInfo = { name: '管理员', phone };

  return (
    <AuthContext.Provider value={{ isLoggedIn, phone, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
