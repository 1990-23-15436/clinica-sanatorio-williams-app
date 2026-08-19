import React, { createContext, useContext, useEffect, useState } from 'react';
//import { User, Session } from '@supabase/supabase-js';
//import { supabase } from '@/integrations/supabase/client';

// 1. Define tu propio tipo de Usuario (ajustado a tus columnas de Debian)
export interface User {
  id_perfil: number;
  dpi_perfil: string;
  nombres: string;
  apellidos: string;
  birth_date: string;
  rol: string;
  phone: string;
  email: string;
}

// 2. Simplifica la interfaz del Contexto
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => void;
}


// ... (dentro del componente AuthProvider)


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  const setUser = (userData: User | null) => {
  // Aquí puedes agregar lógica adicional si es necesario, como formatear datos o manejar casos especiales.
    localStorage.setItem('userSession', JSON.stringify(userData));
    return userData;
  };

  return { ...context, setUser };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Este bloque permite entrar al dashboard sin loguearse
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      setUser({
        id_perfil: 0,
        dpi_perfil: 'DEMO-0000000',
        nombres: 'Usuario',
        apellidos: 'Demo',
        birth_date: '2000-01-01',
        rol: 'administrador',
        phone: '00000000',
        email: 'demo@sanatoriowilliams.com',
      });
      setLoading(false);
      return; // no llega a tocar localStorage
    }

    // Al cargar la app, revisamos si hay una sesión guardada en la laptop
    const savedUser = localStorage.getItem('userSession');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signOut = () => {
      // 1. Limpiamos TODO el almacenamiento
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. Ponemos los estados a cero
    setUser(null);
    setLoading(false);

    // 3. En lugar de usar navigate, usamos href para FORZAR la recarga
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut}}>
      {children}
    </AuthContext.Provider>
  );
}