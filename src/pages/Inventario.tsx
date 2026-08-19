/*
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Pill, Plus, Loader2, AlertTriangle } from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  quantity: number;
  price: number;
  arrival_date: string;
  expiration_date: string;
  created_at: string;
}

const Inventario = () => {
  const { profile } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    price: '',
    arrivalDate: '',
    expirationDate: '',
  });

  const fetchMedicines = async () => {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el inventario.',
      });
    } else {
      setMedicines(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from('medicines').insert({
      name: formData.name.trim(),
      quantity: parseInt(formData.quantity),
      price: parseFloat(formData.price),
      arrival_date: formData.arrivalDate,
      expiration_date: formData.expirationDate,
      created_by: profile!.id,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo registrar el medicamento.',
      });
    } else {
      toast({
        title: 'Éxito',
        description: 'Medicamento registrado correctamente.',
      });
      setFormData({ name: '', quantity: '', price: '', arrivalDate: '', expirationDate: '' });
      setIsDialogOpen(false);
      fetchMedicines();
    }
    setSubmitting(false);
  };

  const isExpiringSoon = (date: string) => {
    const expDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (date: string) => {
    return new Date(date) < new Date();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Pill className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Inventario de Medicinas</h1>
              <p className="text-sm text-muted-foreground">
                {profile?.role === 'medico' ? 'Consulta de medicamentos disponibles' : 'Gestión del inventario de medicamentos'}
              </p>
            </div>
          </div>

          {profile?.role === 'secretario' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Medicamento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Medicamento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre del Medicamento</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Precio (Q)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de Llegada</Label>
                      <Input
                        type="date"
                        value={formData.arrivalDate}
                        onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Vencimiento</Label>
                      <Input
                        type="date"
                        value={formData.expirationDate}
                        onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary border-0" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Registrar Medicamento
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
            ) : medicines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay medicamentos en el inventario.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Fecha Llegada</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell className="font-medium">{med.name}</TableCell>
                      <TableCell>{med.quantity}</TableCell>
                      <TableCell>Q{med.price.toFixed(2)}</TableCell>
                      <TableCell>{new Date(med.arrival_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(med.expiration_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {isExpired(med.expiration_date) ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Vencido
                          </Badge>
                        ) : isExpiringSoon(med.expiration_date) ? (
                          <Badge className="bg-warning text-warning-foreground flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Por vencer
                          </Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground">Vigente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Inventario;
*/