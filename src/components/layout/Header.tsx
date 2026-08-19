import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, Calendar, User, HelpCircle, LogOut, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Inicio', path: '/dashboard', icon: Home },
    { label: 'Agenda', path: '/dashboard/agenda', icon: Calendar },
    { label: 'Perfil', path: '/dashboard/profile', icon: User },
    { label: 'Ayuda', path: '/dashboard/help', icon: HelpCircle },
  ];

  let role;

  if (user?.rol == "P_Medico") {
        role = "Médico";
    } else if (user?.rol == "P_Admin") {
        role = "Administración";
    } else {
        console.log({ error: 'Rol no válido' });
    }

  return (
    <header className="h-16 border-b bg-card shadow-sm flex items-center justify-between px-6">
      {/* Contenedor del Botón de Menú y la Navegación */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        {/* Botón de Menú (Hamburguesa) */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden flex-shrink-0" 
          onClick={onMenuClick}
        >
          <Menu className="w-6 h-6 text-muted-foreground" />
        </Button>

        {/* Navegación con Scroll Horizontal */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1 pr-4 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className="flex-shrink-0" // IMPORTANTE: evita que el botón se encoja
              >
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2 whitespace-nowrap', // Evita que el texto salte de línea
                    isActive && 'gradient-primary border-0'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
      

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{user?.nombres} {user?.apellidos}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {role}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={signOut}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
