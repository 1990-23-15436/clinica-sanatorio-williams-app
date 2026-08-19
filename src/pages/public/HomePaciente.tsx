import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Calendar, Newspaper, LogIn } from 'lucide-react';
import RegisterPatient from './RegisterPatient';

const HomePaciente = () => {
  const publicActions = [
    { 
      label: 'Registro y Cita', 
      path: '/registro-paciente', 
      icon: UserPlus, 
      color: 'bg-blue-500/10 text-blue-600',
      description: 'Regístrate y agenda tu primera cita médica.'
    },
    /*{ 
      label: 'Noticias y Promociones', 
      path: '/noticias', 
      icon: Newspaper, 
      color: 'bg-green-500/10 text-green-600',
      description: 'Conoce nuestras jornadas de salud y ofertas.'
    },*/
    { 
      label: 'Acceso Personal', 
      path: '/login', 
      icon: LogIn, 
      color: 'bg-purple-500/10 text-purple-600',
      description: 'Si eres parte de nuestro equipo, accede a tu panel de control.'
    }
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
        <div className="absolute inset-0 z-0">
          <img 
            src="../assets/Fondo inicial.jpeg" // Cambia esto por tu imagen en /public
            alt="Background"
            className="w-full h-full object-cover" // La opacidad baja ayuda a que sea "discreta"
          />
          {/* Overlay para suavizar la imagen si es muy brillante */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50" />
        </div>
        
        <div className="max-w-4xl w-full bg-slate-100/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-blue-200/30">
          {/* Header Público Simple */}
          <div className="overflow-hidden rounded-lg">
            <img 
              src="../assets/Logo (Sin Fondo).png" // Reemplaza con la ruta de tu imagen
              alt="Sanatorio Williams Logo" 
              className="h-32 w-auto object-contain" // Ajusta h-12 para cambiar el tamaño
            />
          </div>

          <main className="max-w-6xl mx-auto p-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">¡Bienvenido!</h1>
              <p className="text-slate-600 max-w-2xl mx-auto">
                En Sanatorio Williams nos preocupamos por brindarle una atención integral y humana. 
                Utilice nuestras herramientas digitales para agilizar su proceso.
              </p>
            </div>

            <div className="grid grid-cols-1 md:gradient-hero-3 gap-8">
              {publicActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.path} to={action.path} className="group">
                    <Card className="h-full border-none shadow-md hover:shadow-xl transition-all duration-300">
                      <CardHeader className="flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-2xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon size={32} />
                        </div>
                        <CardTitle className="text-xl">{action.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center text-slate-500 text-sm">
                        {action.description}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
  
};

export default HomePaciente;