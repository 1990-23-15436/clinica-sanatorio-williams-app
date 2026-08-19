import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, FolderOpen, FileText, CalendarPlus, Pill, Home, Calendar, User } from 'lucide-react';

const Ayuda = () => {
  const { user } = useAuth();

  const generalHelp = [
    {
      icon: Home,
      title: 'Página de Inicio',
      description: 'La página de inicio muestra un resumen de las actividades y accesos rápidos a las herramientas principales.',
    },
    {
      icon: Calendar,
      title: 'Agenda',
      description: 'En la agenda puedes ver un calendario con todas las citas programadas. Haz clic en un día para ver las citas de esa fecha.',
    },
    {
      icon: User,
      title: 'Perfil',
      description: 'En tu perfil puedes editar tu información personal como nombre, DPI, teléfono y correo electrónico.',
    },
  ];

  const doctorHelp = [
    {
      icon: FolderOpen,
      title: 'Expedientes',
      description: 'Aquí puedes ver todos los pacientes registrados con su información médica, puedes actualizar su información e incluso subir imágenes de apoyo. También puedes agregar nuevos pacientes al sistema, y agregar la información de un contacto o encargado del paciente.',
    },
    {
      icon: FileText,
      title: 'Recetas',
      description: 'Aun no habilitado.',
    },
    {
      icon: CalendarPlus,
      title: 'Asignación de Citas',
      description: 'Programa tus propias citas médicas. Con el botón "Nueva Cita", podra crear una cita con el DPI del paciente y luego podrá asignarse una cita con el botón "Asignar Cita Nueva", habrá una tabla con las citas creadas y al darle click se mostrara una breve información del paciente antes de aceptar la cita. Si se acepta la cita, se le enviará un correo electrónico de recordatorio al paciente',
    },
    {
      icon: Pill,
      title: 'Inventario de Medicinas',
      description: 'Aun no esta habilitado.',
    },
  ];

  const secretaryHelp = [
    {
      icon: FolderOpen,
      title: 'Expedientes',
      description: 'Administra los expedientes de los pacientes. Puedes ver toda la información médica y agregar nuevos pacientes.',
    },
    {
      icon: FileText,
      title: 'Recetas',
      description: 'Recibe las recetas enviadas por los médicos. Aquí podrás ver todas las recetas pendientes para su procesamiento.',
    },
    {
      icon: CalendarPlus,
      title: 'Asignación de Citas',
      description: 'Programa citas para los médicos de la clínica. Selecciona el médico, ingresa los datos del paciente y elige la fecha y hora.',
    },
    {
      icon: Pill,
      title: 'Inventario de Medicinas',
      description: 'Gestiona el inventario de medicamentos. Puedes agregar nuevos medicamentos con su nombre, cantidad, precio, fecha de llegada y fecha de vencimiento.',
    },
  ];

  const toolsHelp = user?.rol === 'medico' ? doctorHelp : secretaryHelp;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Centro de Ayuda</h1>
            <p className="text-sm text-muted-foreground">Aprende a usar el sistema de gestión clínica</p>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Navegación General</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {generalHelp.map((item, index) => {
                const Icon = item.icon;
                return (
                  <AccordionItem key={index} value={`general-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span>{item.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pl-11">
                      {item.description}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              Herramientas para {user?.rol === 'medico' ? 'Médicos' : 'Secretarios'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {toolsHelp.map((item, index) => {
                const Icon = item.icon;
                return (
                  <AccordionItem key={index} value={`tools-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-accent" />
                        </div>
                        <span>{item.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pl-11">
                      {item.description}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">¿Necesitas más ayuda?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Si tienes alguna duda adicional sobre el uso del sistema, contacta al administrador de la clínica.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Ayuda;
