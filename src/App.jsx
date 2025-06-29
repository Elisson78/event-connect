
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { EventProvider } from '@/contexts/EventContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import OrganizerDashboard from '@/pages/OrganizerDashboard';
import OrganizerProfilePage from '@/pages/OrganizerProfilePage';
import ParticipantDashboard from '@/pages/ParticipantDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import EventDetailsPage from '@/pages/EventDetailsPage';
import EventsPage from '@/pages/EventsPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import AboutOrganizersPage from '@/pages/AboutOrganizersPage';
import DynamicPage from '@/pages/DynamicPage';
import PricingPage from '@/pages/PricingPage';
import ManualPaymentPage from '@/pages/ManualPaymentPage';
import PaymentPage from '@/pages/PaymentPage';

import ParticipantOverview from '@/components/participant/ParticipantOverview';
import ParticipantMyEvents from '@/components/participant/ParticipantMyEvents';
import ParticipantProfile from '@/components/participant/ParticipantProfile';

import OrganizerOverview from '@/components/organizer/OrganizerOverview';
import OrganizerProfile from '@/components/organizer/OrganizerProfile';
import OrganizerEventsManagement from '@/components/organizer/OrganizerEventsManagement';
import OrganizerRegistrations from '@/components/organizer/OrganizerRegistrations';
import OrganizerGiveaways from '@/components/organizer/OrganizerGiveaways';
import OrganizerMarketplace from '@/components/organizer/OrganizerMarketplace';
import OrganizerCollaborators from '@/components/organizer/OrganizerCollaborators';
import OrganizerFinances from '@/components/organizer/OrganizerFinances';

const PageTitleUpdater = () => {
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkConnection = async () => {
      if (sessionStorage.getItem('supabase_connection_toast_shown')) {
        return;
      }
      sessionStorage.setItem('supabase_connection_toast_shown', 'true');

      const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });

      if (error && error.code !== '42501') {
        toast({
          title: "Erro de Conexão com Supabase",
          description: "Não foi possível conectar ao projeto 'EVENTFY'.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conexão Estabelecida!",
          description: "Conectado ao projeto Supabase 'EVENTFY' com sucesso. 🚀",
          className: "bg-green-100 border-green-400 text-green-700",
        });
      }
    };
    
    const timer = setTimeout(checkConnection, 500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const path = location.pathname;
    let title = "EventiConnect";
    if (path === "/") title = "EventiConnect - Sua Plataforma de Eventos";
    else if (path === "/events") title = "Eventos - EventiConnect";
    else if (path.startsWith("/event/")) title = "Detalhes do Evento - EventiConnect";
    else if (path.startsWith("/payment/")) title = "Pagamento - EventiConnect";
    else if (path === "/login") title = "Login - EventiConnect";
    else if (path === "/register") title = "Cadastro - EventiConnect";
    else if (path === "/para-organizadores") title = "Para Organizadores - EventiConnect";
    else if (path === "/planos") title = "Planos e Preços - EventiConnect";
    else if (path.startsWith("/organizer/dashboard")) {
      if (path.endsWith("/registrations")) title = "Inscritos - Dashboard do Organizador - EventiConnect";
      else if (path.endsWith("/profile")) title = "Perfil da Empresa - Dashboard do Organizador - EventiConnect";
      else if (path.endsWith("/events-management")) title = "Gerenciar Eventos - Dashboard do Organizador - EventiConnect";
      else if (path.endsWith("/giveaways")) title = "Sorteios - Dashboard do Organizador - EventiConnect";
      else if (path.endsWith("/marketplace")) title = "Mercado - Dashboard do Organizador - EventiConnect";
      else if (path.endsWith("/collaborators")) title = "Colaboradores - Dashboard do Organizador - EventiConnect";
      else if (path.endsWith("/finances")) title = "Financeiro - Dashboard do Organizador - EventiConnect";
      else if (path.endsWith("/manual-payment")) title = "Pagamento Manual - Dashboard do Organizador - EventiConnect";
      else title = "Dashboard do Organizador - EventiConnect";
    }
    else if (path.startsWith("/organizador/")) title = "Perfil do Organizador - EventiConnect";
    else if (path.startsWith("/participant/dashboard")) title = "Dashboard do Participante - EventiConnect";
    else if (path.startsWith("/admin/dashboard")) {
      if (path.includes("settings")) title = "Configurações - Dashboard do Admin - EventiConnect";
      else if (path.includes("roles")) title = "Funções - Dashboard do Admin - EventiConnect";
      else if (path.includes("marketplace")) title = "Mercado - Dashboard do Admin - EventiConnect";
      else if (path.includes("organizers")) title = "Organizadores - Dashboard do Admin - EventiConnect";
      else if (path.includes("pages")) title = "Páginas - Dashboard do Admin - EventiConnect";
      else if (path.includes("plans")) title = "Planos e Comissões - Dashboard do Admin - EventiConnect";
      else if (path.includes("manual_payments")) title = "Confirmações Manuais - Dashboard do Admin - EventiConnect";
      else title = "Dashboard do Admin - EventiConnect";
    }
    
    document.title = title;
  }, [location]);
  return null;
};

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <EventProvider>
          <Router>
            <PageTitleUpdater />
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/event/:id" element={<EventDetailsPage />} />
                <Route path="/organizador/:organizerId" element={<ProtectedRoute><OrganizerProfilePage /></ProtectedRoute>} />
                <Route path="/para-organizadores" element={<AboutOrganizersPage />} />
                <Route path="/planos" element={<PricingPage />} />
                <Route path="/p/:slug" element={<DynamicPage />} />
                <Route path="/payment/:eventId" element={<ProtectedRoute requiredRole="participant"><PaymentPage /></ProtectedRoute>} />

                <Route 
                  path="/organizer/dashboard/*" 
                  element={
                    <ProtectedRoute requiredRole="organizer">
                      <OrganizerDashboard />
                    </ProtectedRoute>
                  } 
                >
                  <Route index element={<OrganizerOverview />} />
                  <Route path="profile" element={<OrganizerProfile />} />
                  <Route path="events-management" element={<OrganizerEventsManagement />} />
                  <Route path="registrations" element={<OrganizerRegistrations />} />
                  <Route path="giveaways" element={<OrganizerGiveaways />} />
                  <Route path="marketplace" element={<OrganizerMarketplace />} />
                  <Route path="collaborators" element={<OrganizerCollaborators />} />
                  <Route path="finances" element={<OrganizerFinances />} />
                  <Route path="manual-payment" element={<ManualPaymentPage />} />
                </Route>

                <Route 
                  path="/participant/dashboard/*" 
                  element={
                    <ProtectedRoute requiredRole="participant">
                      <ParticipantDashboard />
                    </ProtectedRoute>
                  } 
                >
                  <Route index element={<ParticipantOverview />} />
                  <Route path="my-events" element={<ParticipantMyEvents />} />
                  <Route path="profile" element={<ParticipantProfile />} />
                </Route>
                
                <Route 
                  path="/admin/dashboard/*" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </EventProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
