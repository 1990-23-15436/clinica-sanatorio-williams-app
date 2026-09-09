import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, Search, Loader2, NfcIcon, Trash2, Download } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';

interface Patient {
  id: string;
  dpi: string;
  full_name: string;
  nit: string;
  age: number;
  birthDate: string;
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

interface Referido {
  id: string;
  full_name: string;
  dpi: string;
  nit: string;
  phone: string;
  email: string;
  address: string;
  relation_type: string
  }

const Expedientes = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReferidoOpen, setIsReferidoOpen] = useState(false);

  const [isAddReferralOpen, setIsAddReferralOpen] = useState(false);
  const [isReferralListOpen, setIsReferralListOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referido | null>(null);
  const [isReferralDetailOpen, setIsReferralDetailOpen] = useState(false);
  const [submittingRef, setSubmittingRef] = useState(false);
  const [referralToDelete, setReferralToDelete] = useState<string | null>(null);
  const [isDeleteOpenRef, setIsDeleteOpenRef] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editFormData, setEditFormData] = useState<Patient | null>(null);
  const [tempFiles, setTempFiles] = useState<{file: File, preview: string}[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
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

  const fetchReferrals = async (patientId: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/referrals/patient/${patientId}`);
      console.log('id paciente: ', patientId );
      const dataref = res.data;
      setReferidos(dataref);
      console.log(dataref);
    } catch (error) {
      console.error("Error al cargar referidos:", error);
    }
  };

  

  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);

  // Crea esta función para resetear ambos formularios
  const resetForm = () => {
    setFormData({
      fullName: '', dpi: '', age: '', birthDate: '', phone: '', gender: '',
      weight: '', email: '', address: '', nit: '', symptoms: '',
    });
    setReferidoData({
      full_name: '', dpi: '', nit: '', phone: '', email: '',
      address: '', relation_type: ''
    });
  };

  
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
  
  // Función para abrir el detalle
  const handlePatientClick = async (patient: Patient) => {
  try {
    // 1. Llamamos a la API detallada que sí trae las imágenes (img_list)
    const res = await axios.get(`${API_URL}/api/patients/${patient.id}`);
    const fullPatientData = res.data;
    console.log("Datos recibidos del detalle:", fullPatientData);
    // 2. Guardamos los datos completos (con las fotos) en el estado
    setSelectedPatient(fullPatientData);
    setEditFormData({ ...fullPatientData }); 
    /*console.log("Datos completos del paciente:", editFormData.birthDate);*/    
    // 3. Limpiamos estados temporales y abrimos el modal
    setTempFiles([]);// Esto actualiza el estado para el Modal
    setIsViewOpen(true);
  } catch (error) {
    console.error("Error al cargar el detalle del paciente:", error);
    toast({ 
      variant: 'destructive', 
      title: 'Error', 
      description: 'No se pudieron cargar las imágenes y datos completos.' 
    });
  }
};

  const handleAddReferral = async () => {
    setSubmittingRef(true);
    if (!selectedPatient) return;
    try {
      await axios.post(`${API_URL}/api/referrals`, {
        ...referidoData,
        id_patient: selectedPatient.id
      });
      toast({ title: "Éxito", description: "Referido agregado correctamente" });
      setIsAddReferralOpen(false);
      setReferidoData({
        full_name: '', dpi: '', nit: '', phone: '', email: '',
        address: '', relation_type: ''
      });

      console.log('Info: ', referidoData, ', id:', selectedPatient.id)
    } catch (error) {
      console.error('Error al registrar paciente:', error);
      console.error(error);
      toast({ title: "Error", description: "No se pudo agregar el referido", variant: "destructive" });
    }
    setSubmittingRef(false);
  };

  // Manejo de carga de archivos / cámara
  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setTempFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Función para manejar el intento de cierre del modal principal
  const handleOpenChange = (open: boolean) => {
    // Si el usuario intenta cerrar (open es false) y hay datos escritos
    if (!open) {
      const hasData = Object.values(formData).some(val => val !== '') || 
                      Object.values(referidoData).some(val => val !== '');
      
      if (hasData) {
        setIsConfirmExitOpen(true); // Abrir alerta de confirmación
      } else {
        setIsDialogOpen(false); // Cerrar directo si está vacío
      }
    } else {
      setIsDialogOpen(true);
    }
  };

  const generarNombreArchivo = (patientId: string, originalName: string) => {
    const random5 = Math.floor(10000 + Math.random() * 90000); // 5 dígitos al azar
    const ahora = new Date();
    const fechaHora = ahora.toISOString().replace(/[:.]/g, '-').slice(0, 19); // Formato YYYY-MM-DDTHH-MM-SS
    const extension = originalName.split('.').pop(); // Mantiene la extensión original (.jpg, .png, etc)
    
    return `${random5}_${fechaHora}_${patientId}.${extension}`;
  };

  
  
  // Función para confirmar el cierre del modal y resetear el formulario
  const handleFinalUpdate = async () => {
    
    
    try {
        let nombreImagenFinal = "";
        const fechaLimpia = editFormData?.birthDate ? editFormData.birthDate.split('T')[0] : null;

        // 1. Si hay una imagen seleccionada, la subimos primero
        if (tempFiles.length > 0) {
          const archivoOriginal = tempFiles[0].file;
          const formData = new FormData();
          formData.append('patient_id', editFormData?.id);
          // El servidor nos devuelve el nombre con el que se guardó
          nombreImagenFinal = generarNombreArchivo(editFormData?.id.toString() || "0", archivoOriginal.name);
          formData.append('images', archivoOriginal, nombreImagenFinal);

          const resImagen = await axios.post(`${API_URL}/api/upload-image`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });

          nombreImagenFinal = resImagen.data.fileName;
        }

        // 2. Ahora enviamos los datos del paciente (editFormData) 
        // incluyendo el nombre de la imagen si se subió una
        const datosAEnviar = {
            ...editFormData,
            birthDate: fechaLimpia,
            age: calcularEdad(editFormData?.birthDate),
            img_name: nombreImagenFinal || editFormData?.img_list?.[0] || "" // Nueva o la que ya tenía
        };

        console.log("Datos a enviar en actualización:", datosAEnviar);

        await axios.put(`${API_URL}/api/patients/${editFormData?.id}`, datosAEnviar);
        
        toast({ title: 'Éxito', description: 'Expediente actualizado correctamente.' });

        

        if (nombreImagenFinal) {
          setEditFormData(prev => ({
            ...prev!,
            // Actualizamos tanto el nombre principal como la lista del historial
            img_name: nombreImagenFinal,
            img_list: prev?.img_list ? [nombreImagenFinal, ...prev.img_list] : [nombreImagenFinal]
          }));
        }
        setSelectedFiles([]);
        setTimeout(() => {
          window.location.reload();
        }, 1010);
    } catch (error) {
        console.error("Error al guardar:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Hubo un error al procesar la solicitud' });
    }
  };

  // 1. Esta función solo prepara el terreno y abre el modal
  const handleDelete = (id: string) => {
    setPatientToDelete(id); // Guardamos el ID en el estado
    setIsDeleteOpen(true);  // Abrimos el modal de Shadcn
  };

  // 2. Esta función es la que realmente llama al servidor
  const confirmDelete = async () => {
    if (!patientToDelete) return;

    try {
      const res = await axios.delete(`${API_URL}/api/patients`, { 
        data: { ids: [patientToDelete] } 
      });
      
      if (res.data.success) {
        toast({ 
          title: "Expediente eliminado", 
          description: "Se han borrado los datos, referidos e imágenes correctamente." 
        });
        // Filtramos la lista para que el paciente desaparezca de la tabla
        setPatients(prev => prev.filter(p => p.id !== patientToDelete));
      }
    } catch (error) {
      console.error("Error al borrar:", error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "No se pudo completar la eliminación." 
      });
    } finally {
      // Pase lo que pase, cerramos el modal y limpiamos el ID
      setIsDeleteOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleDeleteRef = (id: string) => {
    setReferralToDelete(id);
    setIsDeleteOpenRef(true);  
  };

  const confirmDeleteRef = async () => {
    if (!referralToDelete) return;

    try {
      const res = await axios.delete(`${API_URL}/api/referrals`, { 
        data: { ids: [referralToDelete] } 
      });
      
      if (res.data.success) {
        toast({ 
          title: "Contacto / Encargado eliminado", 
          description: "Se han borrado los datos correctamente." 
        });
        // Filtramos la lista para que el paciente desaparezca de la tabla
        setReferidos(prev => prev.filter(p => p.id !== referralToDelete));
      }
    } catch (error) {
      console.error("Error al borrar:", error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "No se pudo completar la eliminación." 
      });
    } finally {
      // Pase lo que pase, cerramos el modal y limpiamos el ID
      setReferralToDelete(null);
      setIsDeleteOpenRef(false);
    }
  };
  

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const edadCalculada = calcularEdad(formData.birthDate);
    console.log("Datos a enviar:", calcularEdad(formData.birthDate));
  

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
        setFormData({ fullName: '', dpi: '', age: '', birthDate: '', phone: '', gender: '', weight: '', email: '', address: '', nit: '', symptoms: '' });
        setIsDialogOpen(false);
        fetchPatients();
      }
    } catch (error) {
      console.error('Error al registrar paciente:', error);
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo registrar el paciente.' });
    }
    setSubmitting(false);
  };

  const filteredPatients = patients.filter((p) =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generarPDFPaciente = (patient: Patient) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    // --- FUENTES Y ESTILOS ---
    doc.setFont("helvetica", "bold");
    
    // --- ENCABEZADO ---
    doc.setFontSize(16);
    doc.text("SANATORIO DE", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(18);
    doc.text("ATENCIÓN INTEGRAL WILLIAMS", pageWidth / 2, 23, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // --- FILA 1: Nombre ---
    doc.text("Nombre:", margin, 35);
    doc.line(32, 36, 120, 36); // Línea para nombre
    doc.text(`${patient.full_name}`, 33, 35);

    doc.text("Fecha:", 125, 35);
    doc.line(138, 36, pageWidth - margin, 36);
    doc.text(`${new Date(patient.register_date).toLocaleDateString()}`, 139, 35);

    // --- FILA 2: Edad, Sexo, Hora ---
    doc.text("Edad:", margin, 45);
    doc.line(27, 46, 60, 46);
    doc.text(`${patient.age} años`, 28, 45);

    doc.text("Sexo:", 65, 45);
    doc.line(77, 46, 110, 46);
    doc.text(`${patient.gender}`, 78, 45);

    doc.text("Hora:", 115, 45);
    doc.line(126, 46, pageWidth - margin, 46);
    doc.text(`${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 127, 45);

    // --- FILA 3: Dirección y Teléfono ---
    doc.text("Dirección:", margin, 55);
    doc.line(34, 56, 120, 56);
    doc.text(`${patient.address}`, 35, 55);

    doc.text("Teléfono:", 125, 55);
    doc.line(142, 56, pageWidth - margin, 56);
    doc.text(`${patient.phone}`, 143, 55);

    // --- FILA 4: DPI ---
    doc.text("No. DPI:", margin, 65);
    doc.line(32, 66, 100, 66);
    doc.text(`${patient.dpi}`, 33, 65);

    doc.text("Contacto/Encargado:", margin, 65);
    doc.line(32, 66, 100, 66);
    doc.text(`${patient.dpi}`, 33, 65);

    // --- SECCIÓN: MOTIVO DE CONSULTA ---
    doc.setFont("helvetica", "bold");
    doc.text("MOTIVO DE CONSULTA / SÍNTOMAS:", margin, 80);
    doc.rect(margin, 82, pageWidth - (margin * 2), 25); // Recuadro para síntomas
    doc.setFont("helvetica", "normal");
    const symptomsSplit = doc.splitTextToSize(patient.symptoms || "", pageWidth - 35);
    doc.text(symptomsSplit, margin + 2, 87);

    // --- SECCIÓN: SIGNOS VITALES (Como en la foto) ---
    doc.setFont("helvetica", "bold");
    doc.text("Signos Vitales:", margin, 115);
    doc.setFont("helvetica", "normal");
    doc.text("P/A: ________", 45, 115);
    doc.text("Fc: ________", 80, 115);
    doc.text("Fr: ________", 115, 115);
    doc.text("T: ________", 150, 115);

    // --- SECCIÓN: IMPRESIÓN DIAGNÓSTICA ---
    doc.setFont("helvetica", "bold");
    doc.text("IMPRESIÓN DIAGNÓSTICA / INDICACIONES:", margin, 130);
    doc.rect(margin, 132, pageWidth - (margin * 2), 60); // Recuadro más grande
    doc.setFont("helvetica", "normal");
    const diagnosticSplit = doc.splitTextToSize(patient.medical_condition || "", pageWidth - 35);
    doc.text(diagnosticSplit, margin + 2, 137);

    // --- SECCIÓN: EXÁMENES / DATOS POSITIVOS ---
    doc.setFont("helvetica", "bold");
    doc.text("DATOS POSITIVOS AL EXÁMEN FÍSICO / EXÁMENES COMPLEMENTARIOS:", margin, 200);
    doc.rect(margin, 202, pageWidth - (margin * 2), 40);

    // --- FIRMAS ---
    const footerY = 270;
    doc.line(30, footerY, 90, footerY);
    doc.text("Médico Tratante", 45, footerY + 5);
    doc.text("Firma", 55, footerY + 10);

    doc.line(120, footerY, 180, footerY);
    doc.text("Médico Especialista", 135, footerY + 5);
    doc.text("Firma", 145, footerY + 10);

    // Finalizar
    doc.save(`Ficha_${patient.full_name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Expedientes</h1>
              <p className="text-sm text-muted-foreground">Registros médicos de pacientes</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] w-[95vw] lg:max-w-[550px] w-full p-6 overflow-hidden">
              <div className="max-h-[85vh] overflow-y-auto px-2 py-2 space-y-2">
                <DialogHeader className="p-0 pb-0">
                  <DialogTitle>Registrar Nuevo Paciente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de Nacimiento</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
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
                        step="0.1"
                        value={formData.nit}
                        onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dpi">No.DPI</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.dpi}
                        onChange={(e) => setFormData({ ...formData, dpi: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Número de telefono</Label>
                      <Input
                        id="phone"
                        type="number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electronico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  {/*
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
                    */}
                  {/* Dentro del formulario de Nuevo Paciente, antes del botón Submit */}
                  <div className="pt-2 pb-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-dashed border-primary text-primary hover:bg-primary/5"
                    onClick={() => setIsReferidoOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Contacto / Encargado
                  </Button>
                  {referidoData.full_name && (
                    <p className="text-xs text-green-600 mt-1 text-center">
                      ✓ Encargado: {referidoData.full_name} listo para registrar.
                    </p>
                  )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicalCondition">Condición Médica</Label>
                    <Textarea
                      id="medicalCondition"
                      value={formData.symptoms}
                      onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                      placeholder="Descripción de los síntomas..."
                    />
                  </div>
                  <Button type="submit" className="w-full gradient-primary border-0" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Registrar Paciente
                  </Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay pacientes registrados.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DPI</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Edad</TableHead>
                    <TableHead>Género</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow 
                      key={patient.id} 
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => handlePatientClick(patient)} // Aquí pasas el paciente de esta fila
                    >
                      <TableCell className="font-bold">{patient.dpi}</TableCell>
                      <TableCell className="font-bold">{patient.full_name}</TableCell>
                      <TableCell>{calcularEdad(patient.birthDate)} años</TableCell>
                      <TableCell className="capitalize">{patient.gender}</TableCell>
                      <TableCell className="capitalize">{patient.status}</TableCell>
                      
                      {/* CORRECCIÓN 1: El botón debe estar dentro de un TableCell */}
                      <TableCell>
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation(); // IMPORTANTE: Para que no se abra el modal al querer bajar el PDF
                              generarPDFPaciente(patient); // CORRECCIÓN 2: Usar 'patient' (el de la fila), no 'selectedPatient'
                            }}
                            className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10"
                          >
                            <Download className="w-4 h-4" />
                            PDF
                          </Button>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation(); // Evita que se abra el modal de detalles
                            handleDelete(patient.id); // Pasas el ID específico de esta fila
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Borrar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
                    <SelectValue />
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
          <Button onClick={() => setIsReferidoOpen(false)} className="w-full">Guardar Datos de Encargado</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={isConfirmExitOpen} onOpenChange={setIsConfirmExitOpen}>
        <DialogContent className="sm:max-w-[400px] border-2 border-destructive/20">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-destructive">¿Estás seguro de salir?</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
            <p>Los cambios realizados no se guardarán y los datos introducidos se borrarán por completo.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmExitOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                resetForm();             // Borra todo
                setIsConfirmExitOpen(false); // Cierra la alerta
                setIsDialogOpen(false);      // Cierra el formulario
              }}
              className="flex-1"
            >
              Salir y borrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalle y Edición de Expediente */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-[800px] h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-slate-50 border-b">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-2xl font-bold text-primary">
                  Expediente: {selectedPatient?.full_name}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* SECCIÓN 1: Datos Personales (Editables) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Información Personal</h3>
                  <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    <Input 
                      value={editFormData?.full_name || ''} 
                      onChange={(e) => setEditFormData(prev => prev ? {...prev, full_name: e.target.value} : null)}
                    />
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>DPI</Label>
                    <Input type="number" value={editFormData?.dpi || ''} onChange={(e) => {
                      const val = e.target.value;
                      setEditFormData(prev => prev ? { ...prev, dpi: val || 0 } as any : null);}} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>NIT</Label>
                    <Input type="number" value={editFormData?.nit || ''} onChange={(e) => {
                      const val = e.target.value;
                      setEditFormData(prev => prev ? { ...prev, nit: val || 0 } as any : null);}} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Nacimiento</Label>
                    <Input 
                      type="date" 
                      value={editFormData?.birthDate ? editFormData.birthDate.split('T')[0] : ''} 
                      onChange={(e) => {
                        const { value } = e.target;
                        
                        // 2. Si el usuario borra la fecha, no procesamos el cálculo
                        if (!value) return;

                        setEditFormData((prev) => 
                          prev ? { 
                            ...prev, 
                            birthDate: value,
                            age: calcularEdad(value) // Calculamos la edad al cambiar la fecha 
                          } as typeof prev : null
                        );
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Peso (kg)</Label>
                    <Input type="number" value={editFormData?.weight || ''} onChange={(e) => {
                      const { value } = e.target;
                      setEditFormData((prev) => 
                        prev ? { ...prev, weight: Number(value) } as typeof prev : null
                      );}} 
                    />
                  </div>

                  <div className="space-y-2">
                      <Label>Género</Label>
                      <Select value={editFormData?.gender} onValueChange={(v) => setEditFormData(prev => prev ? {...prev, gender: v } : null)}>
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
                    <Label>Teléfono</Label>
                    <Input value={editFormData?.phone || ''} onChange={(e) => setEditFormData(prev => prev ? {...prev, phone: e.target.value} : null)} />
                  </div>
                  
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editFormData?.email || ''} onChange={(e) => setEditFormData(prev => prev ? {...prev, email: e.target.value} : null)} />
                </div>

                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input value={editFormData?.address || ''} onChange={(e) => setEditFormData(prev => prev ? {...prev, address: e.target.value} : null)} />
                </div>
                <div className="bg-muted rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Fecha de registro:</strong> {editFormData?.register_date ? new Date(editFormData.register_date).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Estado Clínico</h3>
                <div className="space-y-2">
                  <Label>Síntomas previos</Label>
                  <Textarea 
                    className="min-h-[120px]"
                    value={editFormData?.symptoms || ''}
                    onChange={(e) => setEditFormData(prev => prev ? {...prev, symptoms: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Diagnóstico / Condición Médica</Label>
                  <Textarea 
                    className="min-h-[120px]"
                    value={editFormData?.medical_condition || ''}
                    onChange={(e) => setEditFormData(prev => prev ? {...prev, medical_condition: e.target.value} : null)}
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Gestión de Referidos
              </h3>
              <div className="flex gap-4">
                <Button 
                  className="flex-1 gap-2 gradient-primary hover:bg-blue-700"
                  onClick={() => setIsAddReferralOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Contacto / Encargado
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 border-primary text-primary hover:bg-blue-50"
                  onClick={() => {
                    if (selectedPatient) {
                      fetchReferrals(selectedPatient.id);
                      setIsReferralListOpen(true);
                    }
                  }}
                >
                  <FolderOpen className="w-4 h-4" />
                  Ver Contactos/Encargados registrados
                </Button>
              </div>
            </div>

            

            {/* SECCIÓN 2: Carga de Multimedia */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Galería de Apoyo (Radiografías / Informes)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opción Cámara */}
                <div className="relative border-2 border-dashed border-primary/30 rounded-xl p-6 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center cursor-pointer">
                  <input 
                    type="file" accept="image/*" capture="environment" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileAdd}
                  />
                  <NfcIcon className="w-8 h-8 text-primary mb-2" />
                  <span className="text-sm font-medium">Usar Cámara del Celular</span>
                </div>

                {/* Opción Archivo */}
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center cursor-pointer">
                  <input 
                    type="file" accept="image/*" multiple 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileAdd}
                  />
                  <Plus className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm font-medium">Subir desde Galería</span>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t mt-6">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  Historial de Imágenes del Paciente
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Aquí iteramos sobre las imágenes que ya están en el servidor */}
                  
                  {editFormData?.img_list?.map((imgName, index) => (
                    <div key={index} className="group relative aspect-square rounded-lg border overflow-hidden cursor-zoom-in">
                      <img 
                        src={`${API_URL}/uploads/patients/${editFormData?.id}/${imgName}`}
                        alt="Radiografía/Informe"
                        className="object-cover w-full h-full hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate text-center">{imgName}</p>
                      </div>
                    </div>
                  ))}
                  
                  {(!editFormData?.img_list || editFormData.img_list.length === 0) && (
                    <p className="col-span-full text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-lg">
                      No hay imágenes previas en este expediente.
                    </p>
                  )}
                </div>
              </div>              

              {/* Previsualización de nuevas fotos */}
              {tempFiles.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                  {tempFiles.map((item, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                      <img src={item.preview} className="object-cover w-full h-full" alt="preview" />
                      <Button 
                        variant="destructive" size="icon" 
                        className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setTempFiles(prev => prev.filter((_, i) => i !== index))}
                      >
                        <Plus className="w-3 h-3 rotate-45" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="gradient-primary px-10"
              onClick={() => setIsConfirmUpdateOpen(true)} // <--- Abre la confirmación aquí
            >
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isConfirmUpdateOpen} onOpenChange={setIsConfirmUpdateOpen}>
        <DialogContent className="sm:max-w-[400px] border-t-4 border-t-primary">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              ¿Confirmar Actualización?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
            <p>Se guardarán los cambios en el expediente de <strong>{selectedPatient?.full_name}</strong>.</p>
            <p className="text-sm mt-2">Esta acción actualizará la información clínica y los archivos adjuntos.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmUpdateOpen(false)}
              className="flex-1"
            >
              Revisar de nuevo
            </Button>
            <Button 
              className="flex-1 gradient-primary" 
              onClick={() => {
                handleFinalUpdate(); // Esta es la función que realmente hace el fetch
                setIsConfirmUpdateOpen(false);
              }}
            >
              Sí, Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] border-t-4 border-t-destructive">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                <Search className="w-6 h-6 text-destructive" /> {/* Puedes usar un icono de basura aquí */}
              </div>
              ¿Eliminar Expediente?
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 text-center text-muted-foreground">
            <p>Esta acción es <strong>irreversible</strong>.</p>
            <p className="text-sm mt-2">
              Se borrarán los datos personales, el historial de referidos y todas las imágenes médicas del servidor.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              className="flex-1" 
              onClick={confirmDelete}
            >
              Sí, Eliminar Todo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isReferralListOpen} onOpenChange={setIsReferralListOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Historial de Referencias Médicas</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomnbre</TableHead>
                  <TableHead>Numero de telefono</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referidos.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">{ref.full_name}</TableCell>
                    <TableCell>{ref.phone}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedReferral(ref);
                        setIsReferralDetailOpen(true);
                      }}>

                        Ver Detalle
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation(); // Evita que se abra el modal de detalles
                            handleDeleteRef(ref.id); // Pasas el ID específico de esta fila
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Borrar
                        </Button>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isReferralDetailOpen} onOpenChange={setIsReferralDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Información de la Referencia</DialogTitle>
          </DialogHeader>
          {selectedReferral && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-bold">{selectedReferral.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Numero de Telefono</Label>
                  <p className="font-bold">{selectedReferral.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">DPI</Label>
                  <p className="font-bold">{selectedReferral.dpi}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">NIT</Label>
                  <p className="font-bold">{selectedReferral.nit}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo de contacto</Label>
                  <p className="font-bold">{selectedReferral.relation_type}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <div className="p-3 bg-slate-50 border rounded-md italic">
                  {selectedReferral.email}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Direccion</Label>
                <div className="p-3 bg-slate-50 border rounded-md italic">
                  {selectedReferral.address}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteOpenRef} onOpenChange={setIsDeleteOpenRef}>
        <DialogContent className="sm:max-w-[425px] border-t-4 border-t-destructive">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                <Search className="w-6 h-6 text-destructive" /> {/* Puedes usar un icono de basura aquí */}
              </div>
              ¿Eliminar Expediente?
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 text-center text-muted-foreground">
            <p>Esta acción es <strong>irreversible</strong>.</p>
            <p className="text-sm mt-2">
              Se borrarán los datos personales, el historial de referidos y todas las imágenes médicas del servidor.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteOpenRef(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              className="flex-1" 
              onClick={confirmDeleteRef}
            >
              Sí, Eliminar Todo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isAddReferralOpen} onOpenChange={setIsAddReferralOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Datos del Encargado / Referido</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddReferral} className="space-y-4">
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
                      <SelectValue />
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
          
            <Button type="submit" className="w-full gradient-primary border-0" disabled={submittingRef}>
              {submittingRef ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Añadir datos de Contacto / Encargado
            </Button>
          </form>
        </DialogContent>
      </Dialog>      
    </DashboardLayout>
  
    
  );
};

export default Expedientes;
