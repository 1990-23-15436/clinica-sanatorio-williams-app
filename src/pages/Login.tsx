import { useState , useEffect } from 'react';
import { URLS } from '@/integrations/constantes.js';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Stethoscope, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { set } from 'date-fns';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL;
  const { user, setUser } = useAuth();

  useEffect(() => {
  // Verificamos si ya recargamos para no entrar en un bucle infinito
  const hasRefreshed = sessionStorage.getItem('loginRefreshed');

  if (!hasRefreshed) {
      sessionStorage.setItem('loginRefreshed', 'true');
    }
  }, []);
  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      

      const data = await response.json();
      console.log("Respuesta del servidor:", data.user.id_perfil);
      

      if (!response.ok) {
        // Manejo de errores (Credenciales incorrectas)
        toast({
          variant: 'destructive',
          title: 'Error al iniciar sesión',
          description: data.message,
        });
        localStorage.removeItem('userSession');
        setLoading(false);
        setTimeout(() => {
          window.location.reload(); 
        }, 3000);
      } else {
        // ¡Login exitoso! 
        // Guardamos la sesión en el navegador para que el usuario no se desloguee al recargar
        localStorage.setItem('userSession', JSON.stringify(data.user));
        setUser(data.user); // Actualizamos el contexto de autenticación con los datos del usuario
        

        toast({
          title: '¡Bienvenido!',
          description: `Has iniciado sesión como ${data.user.nombres}`,
        });
        setLoading(false);
        setTimeout(() => {
          navigate('/dashboard');
          window.location.reload();
        }, 900);
        
        
      }
    } catch (error) {
      
      
      setUser(null);
      setLoading(false);
      toast({
        variant: 'destructive',
        title: 'Error al iniciar sesión',
        description: error.message === 'Invalid login credentials' 
          ? 'Credenciales inválidas. Verifica tu correo y contraseña.'
          : error.message,
      });
      console.log("API_URL: ", API_URL);
      setTimeout(() => {
          window.location.reload();
        }, 3000);
      

    } 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 gradient-hero opacity-5" />
      
      
      <Card className="w-full max-w-md shadow-card animate-fade-in relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Stethoscope className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display">Clínica Médica</CardTitle>
            <CardDescription className="mt-2">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full gradient-primary border-0"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Regístrate aquí
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
  
};

export default Login;
