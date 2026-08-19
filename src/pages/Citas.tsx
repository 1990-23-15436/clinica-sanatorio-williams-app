import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CalendarPlus, Loader2, Clock, UserCheck, Eye, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';

// Interfaces actualizadas
interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  appointment_register: string;
  appointment_date: string;
  is_accepted: boolean | number;
  patient_name: string;
  patient_phone: string;
  patient_age: number;
  patient_gender: string;
  patient_symptoms: string;
  vigencia: boolean;
}


const API_URL = import.meta.env.VITE_API_URL;

const Citas = () => {
  const { user } = useAuth();
  const [acceptedAppointments, setAcceptedAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    doctorId: '',
    patientDPI: '',
    appointmentDate: '',
    appointmentTime: '',
  });

  // ID del doctor (Debería venir de tu contexto de autenticación)
  const currentDoctorId = user.id_perfil; 

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Dentro de tu componente Citas
  const fetchAppointments = async () => {
    try {
      setLoading(true);

      // 1. Traer citas ACEPTADAS por el doctor actual
      // Nota: Es mejor que el backend ya las filtre por el ID del doctor
      const resAceptadas = await axios.get(`${API_URL}/api/appointments/${currentDoctorId}`);

      // Filtramos para que solo queden las citas donde vigencia sea false (o 0)
      const activeAppointments = resAceptadas.data.filter((c: Appointment) => !c.vigencia);
      
      // 2. Traer citas PENDIENTES (disponibles para cualquier doctor)
      const resPendientes = await axios.get(`${API_URL}/api/appointments/pending`);

      setAcceptedAppointments(activeAppointments);
      setPendingAppointments(resPendientes.data);
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error de conexión", 
        description: "No se pudieron obtener las listas de citas." 
      });
    } finally {
      setLoading(false);
    }
  };
  

  const handleAcceptAppointment = async (appointmentId: string) => {
    try {
      await axios.put(`${API_URL}/api/appointments/${appointmentId}/accept`, {
        doctor_id: currentDoctorId,
        is_accepted: 1
      });

      toast({ title: "Cita Aceptada", description: "La cita se ha asignado a su agenda." });
      setIsDetailModalOpen(false);
      setIsPendingModalOpen(false);
      fetchAppointments(); // Recargar listas
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo aceptar la cita." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: {
            dpi: formData.patientDPI,
            date: formData.appointmentDate,
            time: formData.appointmentTime
          },
        })
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ variant: 'destructive', title: 'Error', description: err?.error || 'No se pudo registrar el paciente.' });
      } else {
        toast({ title: 'Éxito', description: 'Cita generada correctamente. Esperando confirmación por correo electrónico o por el personal médico.' });
        setIsDialogOpen(false);
      }
    }catch (error) {
      console.error("Error al generar la cita:", error);
      alert("Hubo un error al generar la cita. Por favor, inténtelo de nuevo.");
      setSubmitting(false);
      setTimeout(() => {
          window.location.reload();
      }, 3000);
      return;
    }
  };

  const handleUnassignAppointment = async (appointmentId: string) => {
    try {
      await axios.put(`${API_URL}/api/appointments/${appointmentId}/unassign`);
      
      toast({
        title: "Cita removida",
        description: "La cita ha sido devuelta a la lista de pendientes exitosamente.",
      });

      // Refrescamos ambas listas para que los cambios se vean reflejados
      fetchAppointments();
    } catch (error) {
      console.error("Error al remover cita:", error);
      toast({
        title: "Error",
        description: "No se pudo remover la cita de tu agenda.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Agenda de Citas</h1>
            <p className="text-muted-foreground">Gestione sus citas aceptadas y solicitudes pendientes.</p>
          </div>

          {/* 2. Contenedor de botones: flex-col para que se apilen uno sobre otro en celulares */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary border-0 w-full sm:w-auto shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Cita
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Programar Nueva Cita</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">

                  <div className="space-y-2">
                    <Label>DPI del Paciente</Label>
                    <Input
                      value={formData.patientDPI}
                      onChange={(e) => setFormData({ ...formData, patientDPI: e.target.value })}
                      required
                    />
                  </div>


                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={formData.appointmentDate}
                        onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora</Label>
                      <Input
                        type="time"
                        value={formData.appointmentTime}
                        onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full gradient-primary border-0" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Programar Cita
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Modal de Citas Pendientes */}
            <Dialog open={isPendingModalOpen} onOpenChange={setIsPendingModalOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary border-0 w-full sm:w-auto shadow-md">
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Asignar Cita Nueva
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Solicitudes de Citas Pendientes</DialogTitle>
                </DialogHeader>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAppointments.length > 0 ? (
                        pendingAppointments.map((apt) => (
                          <TableRow 
                            className="cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => {
                              // 1. Guardamos la cita seleccionada en el estado
                              setSelectedAppointment(apt);
                              // 2. Abrimos el modal de detalles
                              setIsDetailModalOpen(true);
                            }}
                            >
                            <TableCell className="font-medium">{apt.patient_name}</TableCell>
                            <TableCell>{new Date(apt.appointment_date).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(apt.appointment_date).toLocaleTimeString()}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4">No hay citas pendientes.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {/* Modal de Nueva Cita */}
          
          
          
          
          
        </div>

        {/* Listado Principal de Citas Aceptadas */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-6">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Próximas Citas Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="rounded-md border overflow-x-auto"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acceptedAppointments.map((apt) => (
                    <TableRow key={apt.id} className="hover:bg-muted/50">
                      <TableCell className="font-semibold">{apt.patient_name}</TableCell>
                      <TableCell>{new Date(apt.appointment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-primary font-medium">{new Date(apt.appointment_date).toLocaleTimeString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">

                          {/* NUEVO BOTÓN PARA BORRAR (DESASIGNAR) */}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleUnassignAppointment(apt.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Borrar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {acceptedAppointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        No tiene citas programadas próximamente.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal Secundario: Detalle del Paciente antes de Aceptar */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Confirmación de Cita
              </DialogTitle>
            </DialogHeader>
            
            {selectedAppointment && (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-lg border">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Paciente</p>
                    <p className="text-lg font-bold text-gray-800">{selectedAppointment.patient_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Edad</p>
                    <p className="text-lg font-bold text-gray-800">{selectedAppointment.patient_age}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Genero</p>
                    <p className="text-lg font-bold text-gray-800">{selectedAppointment.patient_gender}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Numero de telefono</p>
                    <p className="text-lg font-bold text-gray-800">{selectedAppointment.patient_phone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Síntomas</p>
                    <p className="text-lg font-bold text-gray-800">{selectedAppointment.patient_symptoms}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground font-semibold">Cita: Fecha</p>
                      <p className="font-medium">{new Date(selectedAppointment.appointment_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground font-semibold">Hora</p>
                      <p className="font-medium">{new Date(selectedAppointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white py-6 text-base shadow-md"
                    onClick={() => handleAcceptAppointment(selectedAppointment.id)}
                  >
                    <UserCheck className="w-5 h-5" />
                    Aceptar y Asignar a mi Agenda
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-muted-foreground"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    Volver a la lista
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Citas;