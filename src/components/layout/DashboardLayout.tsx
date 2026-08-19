import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Estado para el menú móvil

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar con prop para cerrar y estado de apertura */}
      <Sidebar 
        role={(user?.rol as 'P_Medico' | 'P_Admin') || 'P_Admin'} 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Ajustamos el margen: ml-0 en móvil, ml-64 en escritorio (lg:ml-64) */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 transition-all duration-300">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="animate-fade-in max-w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay para cerrar el menú al tocar fuera en móviles */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
