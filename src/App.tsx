import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Expedientes from "./pages/Expedientes";
import Recetas from "./pages/Recetas";
import Citas from "./pages/Citas";
import Perfil from "./pages/Perfil";
import Ayuda from "./pages/Ayuda";
import Agenda from "./pages/Agenda";
import NotFound from "./pages/NotFound";
import HomePaciente from './pages/public/HomePaciente';
import RegisterPatient from './pages/public/RegisterPatient';
import { GenerarCita } from "./pages/public/CitasPatient";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* RUTA PRINCIPAL: Portal del Paciente */}
            <Route path="/" element={<HomePaciente />} />
            <Route path="/registro-paciente" element={<RegisterPatient />} />
            <Route path="/generar-cita" element={<GenerarCita />} />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/expedientes" element={
              <ProtectedRoute>
                <Expedientes />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/recetas" element={
              <ProtectedRoute>
                <Recetas />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/citas" element={
              <ProtectedRoute>
                <Citas />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/profile" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/help" element={
              <ProtectedRoute>
                <Ayuda />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/agenda" element={
              <ProtectedRoute>
                <Agenda />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
