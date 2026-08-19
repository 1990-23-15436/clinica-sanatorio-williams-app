import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FolderOpen, 
  FileText, 
  CalendarPlus, 
  Pill,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

console.log('inciado secion Dashboard');

const Dashboard = () => { 
  const { user, loading } = useAuth();
  const [totalPatients, setTotalPatients] = useState<number | string>('---');
  const [todayAppointments, setTodayAppointments] = useState<number | string>('---');
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/stats/summary`,{
          params: { doctorId: user?.id_perfil }
        });


        setTotalPatients(res.data.totalPatients);
        setTodayAppointments(res.data.todayAppointments || 0);
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      }
    };

    if (!loading && user) {
      fetchStats();
    }
  }, [loading, user, API_URL]);

  const quickActions = [
    { 
      label: 'Expedientes', 
      path: '/dashboard/expedientes', 
      icon: FolderOpen,
      color: 'bg-primary/10 text-primary',
      description: 'Ver registros de pacientes'
    },
    /*{ 
      label: 'Recetas', 
      path: '/dashboard/recetas', 
      icon: FileText,
      color: 'bg-accent/10 text-accent',
      description: user?.rol === 'medico' ? 'Crear nuevas recetas' : 'Ver recetas recibidas'
    },*/
    { 
      label: 'Citas', 
      path: '/dashboard/citas', 
      icon: CalendarPlus,
      color: 'bg-success/10 text-success',
      description: user?.rol === 'medico' ? 'Gestionar tus citas' : 'Asignar citas a médicos'
    },
    /*
    { 
      label: 'Inventario', 
      path: '/dashboard/inventario', 
      icon: Pill,
      color: 'bg-warning/10 text-warning',
      description: user?.rol === 'medico' ? 'Ver medicamentos' : 'Gestionar medicamentos'
    },
    */
  ];

  const stats = [
    { label: 'Pacientes', value: totalPatients.toString(), icon: Users, trend: 'Pacientes registrados' },
    { label: 'Citas', value: todayAppointments.toString(), icon: Calendar, trend: 'Citas pendientes' },
    //{ label: 'Recetas', value: '---', icon: FileText, trend: 'Esta semana' },
  ];

  if (loading) return <div>Cargando sesión...</div>;
  if (!user) return <div>No hay usuario, redirigiendo...</div>;

  return (
      <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="gradient-primary rounded-2xl p-6 text-primary-foreground">
          <h1 className="text-2xl font-display font-bold">
            ¡Bienvenido/a, {user?.nombres || 'Usuario'}!
          </h1>
          <p className="mt-1 opacity-90">
            {user?.rol === 'medico' 
              ? 'Gestiona tus citas y atiende a tus pacientes desde aquí.'
              : 'Administra la clínica y apoya al equipo médico.'
            }
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold font-display mt-1">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {stat.trend}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-display font-semibold mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.path} to={action.path}>
                  <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-base">{action.label}</CardTitle>
                      <CardDescription className="text-xs">
                        {action.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;