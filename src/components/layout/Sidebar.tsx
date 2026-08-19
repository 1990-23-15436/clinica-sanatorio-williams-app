import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Stethoscope, 
  FolderOpen, 
  FileText, 
  CalendarPlus, 
  Pill 
} from 'lucide-react';

interface SidebarProps {
  role: 'P_Medico' | 'P_Admin';
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ role, isOpen, onClose }: SidebarProps) => {
  const location = useLocation();

  const tools = [
    { 
      label: 'Expedientes', 
      path: '/dashboard/expedientes', 
      icon: FolderOpen,
      description: 'Registros de pacientes'
    },
    /*{ 
      label: 'Recetas', 
      path: '/dashboard/recetas', 
      icon: FileText,
      description: role === 'P_Medico' ? 'Crear recetas' : 'Recibir recetas'
    },*/
    { 
      label: 'Asignación de Citas', 
      path: '/dashboard/citas', 
      icon: CalendarPlus,
      description: role === 'P_Medico' ? 'Asignar tus citas' : 'Asignar citas a médicos'
    },
    ,
  ];

  return (
    <aside className={cn("fixed left-0 top-0 h-full w-64 bg-sidebar z-50 transition-transform duration-300 ease-in-out", "lg:translate-x-0", "fixed left-0 top-0 h-full w-68 bg-sidebar text-sidebar-foreground flex flex-col",// Siempre visible en escritorio
    isOpen ? "translate-x-0" : "-translate-x-full" // Se desliza en móvil
    )}
    >
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-lg">Sanatorio Williams</h1>
            <p className="text-xs text-sidebar-foreground/70">Sistema de Gestión</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-3 mb-4">
          Herramientas
        </p>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = location.pathname === tool.path;

          return (
            <Link
              key={tool.path}
              to={tool.path}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{tool.label}</p>
                <p className={cn(
                  'text-xs truncate',
                  isActive ? 'text-sidebar-primary-foreground/70' : 'text-sidebar-foreground/50'
                )}>
                  {tool.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-3">
          <p className="text-xs text-sidebar-foreground/70">Sesión activa como</p>
          <p className="text-sm font-medium capitalize">
            {role === 'P_Medico' ? 'Médico' : 'Secretario/a'}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
