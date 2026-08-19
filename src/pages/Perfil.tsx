import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Save, Loader2 } from 'lucide-react';

const Perfil = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    names: user?.nombres || '',
    lastnames: user?.apellidos || '',
    dpi: '',
    phone: '',
    email: '',
    birth_date: user?.birth_date || '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL;

  if (formData.lastnames === undefined || formData.lastnames === null) {
    formData.lastnames = '';
    user?.apellidos ? formData.lastnames = user.apellidos : formData.lastnames = '';
  }

  useEffect(() => {
    if (user) {
      setFormData({
        names: user.nombres,
        lastnames: user.apellidos,
        dpi: user.dpi_perfil,
        phone: user.phone, // No se proporciona teléfono en el objeto user
        email: user.email,
        birth_date: user.birth_date, // No se proporciona fecha de nacimiento en el objeto user
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 3. REEMPLAZO DE SUPABASE POR TU API
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dpi: user.dpi_perfil,
          nombres: formData.names,
          apellidos: formData.lastnames,
          email: formData.email,
          phone: formData.phone, // Asegúrate de que tu API acepte este campo si lo necesitas
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error('Error al actualizar');

      toast({
        title: 'Éxito',
        description: data.message,
      });
      
      // Opcional: Actualizar el localStorage con los nuevos datos
      const updatedUser = { ...user, ...formData, dpi_m_a: formData.dpi };
      localStorage.setItem('userSession', JSON.stringify(updatedUser));

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo conectar con el servidor de la laptop.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Mi Perfil</h1>
            <p className="text-sm text-muted-foreground">Edita tu información personal</p>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombres</Label>
                <Input
                  id="fullName"
                  value={`${formData.names}`}
                  onChange={(e) => setFormData({ ...formData, names: e.target.value.split(' ')[0],  })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Apellidos</Label>
                <Input
                  id="fullName"
                  value={`${formData.lastnames}`}
                  onChange={(e) => setFormData({ ...formData, lastnames: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="pt-4">
                <div className="bg-muted rounded-lg p-4 mb-4">
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Fecha de nacimiento:</strong> {formData.birth_date ? new Date(formData.birth_date).toLocaleDateString() : '-'}
                  </p>
                </div>

                <Button type="submit" className="w-full gradient-primary border-0" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Perfil;
