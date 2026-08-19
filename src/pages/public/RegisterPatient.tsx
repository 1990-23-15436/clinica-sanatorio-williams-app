import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, Search, Loader2, NfcIcon, Trash2, Download, ArrowLeft, UserPlus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Patient {
  id: string;
  dpi: string;
  full_name: string;
  nit: string;
  age: number;
  register_date: string;
  gender: string;
  weight: number;
  email: string;
  phone: string;
  address: string;
  symptoms: string;
  medical_condition: string;
  status: string;
  img_list: string[]; // Lista de URLs de imágenes asociadas al paciente
}

const RegisterPatient = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReferidoOpen, setIsReferidoOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const [tempFiles, setTempFiles] = useState<{file: File, preview: string}[]>([]);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    fullName: '',
    dpi: '',
    age: '',
    birthDate: '',
    phone: '',
    gender: '',
    weight: '',
    email: '',
    address: '',
    nit: '',
    symptoms: '',
  });

  const [referidoData, setReferidoData] = useState({
    full_name: '',
    dpi: '',
    nit: '',
    phone: '',
    email: '',
    address: '',
    relation_type: ''
  });

  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_URL}/api/patients`);
      if (!res.ok) throw new Error('Fetch error');
      const data = await res.json();
      setPatients(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los expedientes.' });
    }
    setLoading(false);
  };

  

  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);

  

  useEffect(() => {
    fetchPatients();
  }, []);

  const calcularEdad = (fechaNacimiento: string | undefined | null) => {
    if (!fechaNacimiento) return ""; // Retorna vacío si no hay fecha
    
    const hoy = new Date();
    const cumple = new Date(fechaNacimiento);
    
    // Si la fecha es inválida, retorna vacío
    if (isNaN(cumple.getTime())) return "";

    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
      edad--;
    }
    return edad;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    let registroExitoso = false; // Variable para controlar redirección después del registro
    e.preventDefault();
    setSubmitting(true);
    const edadCalculada = calcularEdad(formData.birthDate);
    

    try {
      const res = await fetch(`${API_URL}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: {
            dpi: formData.dpi,
            full_name: formData.fullName,
            nit: formData.nit,
            age: Number(edadCalculada),
            birthDate: formData.birthDate,
            gender: formData.gender,
            weight: parseFloat(formData.weight),
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            symptoms: formData.symptoms
          },
          referido: {
            full_name: referidoData.full_name,
            dpi: referidoData.dpi,
            nit: referidoData.nit,
            phone: referidoData.phone,
            email: referidoData.email,
            address: referidoData.address,
            relation_type: referidoData.relation_type
          }
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ variant: 'destructive', title: 'Error', description: err?.error || 'No se pudo registrar el paciente.' });
      } else {
        toast({ title: 'Éxito', description: 'Paciente registrado correctamente.' });
        registroExitoso = true; // Marcar como exitoso para redirección
        setIsDialogOpen(false);
        fetchPatients();
      }
    } catch (error) {
      console.error('Error al registrar paciente:', error);
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Asegúrese de poner sus datos correctamente' });
    }
    
    setSubmitting(false);
    if (registroExitoso) {
      // Redirigir y pasar el DPI para que el siguiente formulario ya lo tenga
      navigate('/generar-cita', { state: { dpi: formData.dpi } });
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50"> {/* Contenedor opcional para dar fondo a toda la página */}
        <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
        {/* Encabezado de la página */}
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Registro de Paciente</h1>
            <p className="text-sm text-muted-foreground">Ingrese los datos del paciente</p>
            </div>
        </div>

        <Card className="shadow-lg border-t-4 border-t-primary bg-white">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Información General
            </CardTitle>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Nombre Completo */}
                <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                    id="fullName"
                    placeholder="Ej. Juan Pérez"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                />
                </div>

                {/* Fila: Fecha de Nacimiento, Género, NIT */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate} // Asegúrate de inicializar birthDate en tu useState
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      required
                    />
                  </div>

                <div className="space-y-2">
                    <Label>Género</Label>
                    <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>NIT</Label>
                    <Input
                    type="number"
                    value={formData.nit}
                    onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                    />
                </div>
                </div>

                {/* Fila: DPI y Teléfono */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="dpi">No. DPI</Label>
                    <Input
                    id="dpi"
                    type="number"
                    value={formData.dpi}
                    onChange={(e) => setFormData({ ...formData, dpi: e.target.value })}
                    required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Número de Teléfono</Label>
                    <Input
                    id="phone"
                    type="number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    />
                </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
                </div>

                {/* Dirección */}
                <div className="space-y-2">
                <Label htmlFor="address">Dirección de Residencia</Label>
                <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                />
                </div>

                {/* Sección de Encargado (Opcional) */}
                <div className="pt-2 pb-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-dashed border-primary text-primary hover:bg-primary/5"
                    onClick={() => setIsReferidoOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Encargado / Referido
                  </Button>
                  {referidoData.full_name && (
                    <p className="text-xs text-green-600 mt-1 text-center">
                      ✓ Encargado: {referidoData.full_name} listo para registrar.
                    </p>
                  )}
                </div>

                {/* Condición Médica */}
                <div className="space-y-2">
                <Label htmlFor="medicalCondition">Motivo de Consulta / Síntomas</Label>
                <Textarea
                    id="medicalCondition"
                    className="min-h-[100px]"
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    placeholder="Describa brevemente el estado del paciente..."
                />
                </div>

                {/* Botón de Acción Principal */}
                <div className="pt-4">
                <Button type="submit" className="w-full h-12 text-lg gradient-primary border-0" disabled={submitting}>
                    {submitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Procesando Registro...
                    </>
                    ) : (
                    "Finalizar y Registrar Paciente"
                    )}
                </Button>
                </div>

            </form>
            </CardContent>
        </Card>
        </div>
        <Dialog open={isReferidoOpen} onOpenChange={setIsReferidoOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Datos del Encargado / Referido</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nombre Completo</Label>
            <Input 
              value={referidoData.full_name} 
              onChange={(e) => setReferidoData({...referidoData, full_name: e.target.value})} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>DPI</Label>
              <Input value={referidoData.dpi} onChange={(e) => setReferidoData({...referidoData, dpi: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>NIT</Label>
              <Input value={referidoData.nit} onChange={(e) => setReferidoData({...referidoData, nit: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={referidoData.phone} onChange={(e) => setReferidoData({...referidoData, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Contacto</Label>
              <Select value={referidoData.relation_type} onValueChange={(v) => setReferidoData({...referidoData, relation_type: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="familiar">Familiar</SelectItem>
                  <SelectItem value="conocido">Conocido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={referidoData.email} onChange={(e) => setReferidoData({...referidoData, email: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input value={referidoData.address} onChange={(e) => setReferidoData({...referidoData, address: e.target.value})} />
          </div>
        </div>
        <Button onClick={() => setIsReferidoOpen(false)} className="w-full">
          Guardar Datos de Encargado
        </Button>
      </DialogContent>
    </Dialog>
    </div>
    
    );
};

export default RegisterPatient;
