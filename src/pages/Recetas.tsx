import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Send, Loader2, Check } from 'lucide-react';

interface Prescription {
  id: string;
  patient_name: string;
  patient_age: number;
  patient_weight: number | null;
  medical_condition: string | null;
  prescription_content: string;
  sent_at: string | null;
  created_at: string;
  doctor_id: string;
  secretary_id: string | null;
}

interface Profile {
  id: string;
  full_name: string;
  role: 'medico' | 'secretario';
}

const Recetas = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [secretaries, setSecretaries] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    patientWeight: '',
    medicalCondition: '',
    prescriptionContent: '',
  });

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prescriptions`, { credentials: 'include' });
      if (!res.ok) throw new Error('Fetch error');
      const data = await res.json();
      setPrescriptions(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las recetas.' });
    }
    setLoading(false);
  };

  const fetchSecretaries = async () => {
    try {
      const res = await fetch('/api/secretaries');
      if (!res.ok) throw new Error('Fetch error');
      const data = await res.json();
      setSecretaries(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    if (user?.rol === 'medico') {
      fetchSecretaries();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          patient_name: formData.patientName.trim(),
          patient_age: parseInt(formData.patientAge) || null,
          patient_weight: formData.patientWeight ? parseFloat(formData.patientWeight) : null,
          medical_condition: formData.medicalCondition.trim() || null,
          prescription_content: formData.prescriptionContent.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ variant: 'destructive', title: 'Error', description: err?.error || 'No se pudo crear la receta.' });
      } else {
        toast({ title: 'Éxito', description: 'Receta creada correctamente.' });
        setFormData({ patientName: '', patientAge: '', patientWeight: '', medicalCondition: '', prescriptionContent: '' });
        setIsDialogOpen(false);
        fetchPrescriptions();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la receta.' });
    }
    setSubmitting(false);
  };

  const handleSendPrescription = async (secretaryId: string) => {
    if (!selectedPrescription) return;
    setSubmitting(true);

    if (!selectedPrescription) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/prescriptions/${selectedPrescription.id}/send`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ secretary_id: secretaryId }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ variant: 'destructive', title: 'Error', description: err?.error || 'No se pudo enviar la receta.' });
      } else {
        toast({ title: 'Éxito', description: 'Receta enviada correctamente.' });
        setIsSendDialogOpen(false);
        setSelectedPrescription(null);
        fetchPrescriptions();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la receta.' });
    }
    setSubmitting(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Recetas</h1>
              <p className="text-sm text-muted-foreground">
                {user?.rol === 'medico' ? 'Crear y enviar recetas médicas' : 'Recetas recibidas de médicos'}
              </p>
            </div>
          </div>

          {user?.rol === 'medico' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Receta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Receta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Nombre del Paciente</Label>
                      <Input
                        value={formData.patientName}
                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Edad</Label>
                      <Input
                        type="number"
                        value={formData.patientAge}
                        onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Peso (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.patientWeight}
                        onChange={(e) => setFormData({ ...formData, patientWeight: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Condición Médica</Label>
                    <Input
                      value={formData.medicalCondition}
                      onChange={(e) => setFormData({ ...formData, medicalCondition: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contenido de la Receta</Label>
                    <Textarea
                      value={formData.prescriptionContent}
                      onChange={(e) => setFormData({ ...formData, prescriptionContent: e.target.value })}
                      rows={6}
                      placeholder="Escriba los medicamentos, dosis e instrucciones..."
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full gradient-primary border-0" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Crear Receta
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay recetas {user?.rol === 'secretario' ? 'recibidas' : 'creadas'}.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Edad</TableHead>
                    <TableHead>Condición</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    {user?.rol === 'medico' && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell className="font-medium">{prescription.patient_name}</TableCell>
                      <TableCell>{prescription.patient_age} años</TableCell>
                      <TableCell>{prescription.medical_condition || '-'}</TableCell>
                      <TableCell>{new Date(prescription.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {prescription.sent_at ? (
                          <span className="inline-flex items-center gap-1 text-success text-sm">
                            <Check className="w-3 h-3" /> Enviada
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Pendiente</span>
                        )}
                      </TableCell>
                      {user?.rol === 'medico' && (
                        <TableCell>
                          {!prescription.sent_at && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPrescription(prescription);
                                setIsSendDialogOpen(true);
                              }}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Enviar
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Send Dialog */}
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Receta a Secretario</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {secretaries.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay secretarios registrados.
                </p>
              ) : (
                secretaries.map((sec) => (
                  <Button
                    key={sec.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSendPrescription(sec.id)}
                    disabled={submitting}
                  >
                    {sec.full_name}
                  </Button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Recetas;
