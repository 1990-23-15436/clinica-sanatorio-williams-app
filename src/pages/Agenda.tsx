import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';

interface Appointment {
  id: string;
  doctor_id: string;
  appointment_date: string;
  patient_name: string;
  patient_phone: string;
  patient_age: number;
  patient_gender: string;
  patient_symptoms: string | null;
}

const Agenda = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL;

  // Estados
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]); // Para los puntos verdes
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([]); // Para el modal del día
  const [loading, setLoading] = useState(false);
  const [showAppointmentsDialog, setShowAppointmentsDialog] = useState(false);

  // Función unificada para cargar datos -- Actualizda
  const fetchAgendaData = async (date: Date | null, dateParam?: Date) => {
    // Si no hay usuario o id_perfil, no intentamos cargar
    if (!user?.id_perfil) return;

    const targetDate = dateParam || currentDate;
    const month = targetDate.getMonth() + 1;
    const year = targetDate.getFullYear();

    try {
      if (!dateParam) setLoading(true);

      // 1. Agregamos el doctor_id como parámetro en la URL
      // Esto permite que el backend (Node.js) filtre los resultados desde la base de datos
      const res = await fetch(
        `${API_URL}/api/appointments?month=${month}&year=${year}&doctor_id=${user.id_perfil}`,
        { credentials: 'include' }
      );

      if (!res.ok) throw new Error('Error en servidor');
      const data = await res.json();

      // 2. Filtramos los datos en el frontend para asegurar que coincidan con el ID del perfil actual
      // Convertimos ambos a String por si uno viene como número y otro como cadena
      const doctorAppointments = (data || []).filter((apt: any) => 
        String(apt.doctor_id) === String(user.id_perfil)
      );

      if (date) {
          // Filtramos las citas del doctor para un día específico (Modal)
          const dateStr = date.toISOString().split('T')[0];
          const dailyFiltered = doctorAppointments.filter((a: any) => 
            a.appointment_date && a.appointment_date.split('T')[0] === dateStr
          );
          setDayAppointments(dailyFiltered); 
      } else {
          // Guardamos todas las citas del doctor para los indicadores del mes (Puntos verdes)
          setMonthAppointments(doctorAppointments);
      }
    } catch (error) {
      console.error("Error al cargar agenda:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudieron cargar sus citas personales.' 
      });
    } finally {
      setLoading(false);
    }
  };

  

  // Cargar indicadores cada vez que cambie el mes visible
  useEffect(() => {
    fetchAgendaData(null, currentDate);
  }, [currentDate]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    fetchAgendaData(date); // Carga y filtra las citas de ese día
    setShowAppointmentsDialog(true);
  };

  // Funciones auxiliares para el calendario
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    
    return days;
  };

  const isToday = (date: Date) => new Date().toDateString() === date.toDateString();

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return monthAppointments.filter(apt => 
      apt.appointment_date && apt.appointment_date.split('T')[0] === dateStr
    );
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mi Agenda Médica</h1>
            <p className="text-sm text-muted-foreground">Gestiona tus citas programadas y pacientes del mes.</p>
          </div>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wider">
                  {day}
                </div>
              ))}
              {getDaysInMonth(currentDate).map((date, index) => {
                if (!date) return <div key={index} className="aspect-square" />;
                
                const hasApts = getAppointmentsForDay(date).length > 0;
                const today = isToday(date);

                return (
                  <div key={index} className="aspect-square p-1 relative">
                    <button
                      onClick={() => handleDateClick(date)}
                      className={`w-full h-full rounded-lg flex items-center justify-center text-sm transition-all relative
                        ${today 
                          ? 'gradient-primary text-primary-foreground font-bold shadow-md' 
                          : hasApts 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100' 
                            : 'hover:bg-muted'
                        }
                      `}
                    >
                      {date.getDate()}
                      {hasApts && (
                        <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                          today ? 'bg-white' : 'bg-green-500'
                        }`} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Modal de Citas del Día - Actualización*/}
        <Dialog open={showAppointmentsDialog} onOpenChange={setShowAppointmentsDialog}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
                <CalendarIcon className="w-5 h-5" />
                Citas del día
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {selectedDate?.toLocaleDateString('es-GT', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </DialogHeader>

            <div className="px-6 pb-6 space-y-4">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Cargando detalles...</p>
                </div>
              ) : dayAppointments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No hay citas para esta fecha.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {dayAppointments.map((apt) => {
                    // Extraemos la hora de la fecha de la cita
                    const appointmentTime = new Date(apt.appointment_date).toLocaleTimeString('es-GT', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });

                    return (
                      <div 
                        key={apt.id} 
                        className="p-4 rounded-xl border bg-white shadow-sm border-slate-200 hover:border-primary/30 transition-colors space-y-3"
                      >
                        {/* Encabezado: Nombre y Hora */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-primary">
                              {appointmentTime}
                            </p>
                            <h4 className="font-semibold text-gray-900 leading-tight">
                              {apt.patient_name}
                            </h4>
                          </div>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase">
                            {apt.patient_age} años
                          </span>
                        </div>

                        {/* Síntomas / Observaciones */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <p className="text-[11px] font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Motivo / Síntomas:
                          </p>
                          <p className="text-sm text-slate-700 leading-relaxed italic">
                            "{apt.patient_symptoms || 'Sin síntomas registrados.'}"
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Agenda;