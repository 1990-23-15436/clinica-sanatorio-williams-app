import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, Fingerprint, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export const GenerarCita = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    patientDpi: '', // Este puede venir pre-llenado desde el registro previo
    date: '',
    time: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    let registroExitoso = false; // Variable para controlar redirección después del registro
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: {
            dpi: appointmentData.patientDpi,
            date: appointmentData.date,
            time: appointmentData.time
          },
        })
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ variant: 'destructive', title: 'Error', description: err?.error || 'No se pudo registrar el paciente.' });
      } else {
        toast({ title: 'Éxito', description: 'Cita generada correctamente. Esperando confirmación por correo electrónico o por el personal médico.' });
        registroExitoso = true; // Marcar como exitoso para redirección
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

    if (registroExitoso) {
      // Redirigir y pasar el DPI para que el siguiente formulario ya lo tenga
      navigate('/');
    }

    
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-2xl mx-auto space-y-6 py-10 px-4">
        
        {/* Encabezado */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Programar Cita</h1>
            <p className="text-sm text-muted-foreground">Asigne un horario para el paciente registrado, si no puedes volver al inicio</p>
          </div>
        </div>

        <Card className="shadow-lg border-t-4 border-t-primary bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Calendar className="w-5 h-5 text-primary" />
              Detalles de la Cita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Campo DPI (Identificador del Paciente) */}
              <div className="space-y-2">
                <Label htmlFor="dpi" className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" /> No. DPI del Paciente
                </Label>
                <Input
                  id="dpi"
                  type="number"
                  placeholder="Ingrese el DPI del paciente"
                  value={appointmentData.patientDpi}
                  onChange={(e) => setAppointmentData({ ...appointmentData, patientDpi: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fecha */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Fecha
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={appointmentData.date}
                    onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })}
                    required
                  />
                </div>

                {/* Hora */}
                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Hora
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={appointmentData.time}
                    onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Botón de Confirmación con el nuevo color Primary */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-white border-0 transition-all"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Guardando en Base de Datos...
                    </>
                  ) : (
                    "Confirmar y Agendar Cita"
                  )}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};