import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { URLS } from '@/integrations/constantes.js';

export default function VerificacionEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState('Verificando tu cuenta...');

  useEffect(() => {
    // 1. Extraemos el token de la URL
    const token = searchParams.get('token');

    if (token) {
      // 2. Enviamos la petición silenciosa al backend
      fetch(`${URLS.BACKEND}/api/verify-email?token=${token}`)
        .then(res => res.json())
        .then(data => {
          setMensaje('¡Cuenta verificada con éxito! Redirigiendo...');
          // 3. Lo enviamos al login después de un par de segundos
          setTimeout(() => navigate('/login'), 3000);
        })
        .catch(err => {
          setMensaje('Error al verificar la cuenta. El enlace pudo expirar.');
        });
    }
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>{mensaje}</h2>
      {/* Aquí puedes agregar el diseño visual de tu clínica */}
    </div>
  );
}