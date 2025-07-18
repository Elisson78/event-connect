import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { EventProvider } from '@/contexts/EventContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
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
import ParticipantPrizes from '@/components/participant/ParticipantPrizes';
import ParticipantDocuments from '@/components/participant/ParticipantDocuments';
import ParticipantFinances from './components/participant/ParticipantFinances';
import TestComponent from './components/TestComponent';
import I18nDebug from './components/I18nDebug';
import DirectI18nTest from './components/DirectI18nTest';
import ErrorBoundary from './components/ErrorBoundary';

import OrganizerOverview from '@/components/organizer/OrganizerOverview';
import OrganizerProfile from '@/components/organizer/OrganizerProfile';
import OrganizerEventsManagement from '@/components/organizer/OrganizerEventsManagement';
import OrganizerRegistrations from '@/components/organizer/OrganizerRegistrations';
import OrganizerGiveaways from '@/components/organizer/OrganizerGiveaways';
import OrganizerMarketplace from '@/components/organizer/OrganizerMarketplace';
import OrganizerCollaborators from '@/components/organizer/OrganizerCollaborators';
import OrganizerFinances from '@/components/organizer/OrganizerFinances';
import OrganizerPayments from '@/components/organizer/OrganizerPayments';
import FooterInstallApp from './components/ui/FooterInstallApp';

import { LanguageProvider } from '@/contexts/LanguageContext';
// Removido import do i18n para usar solução simplificada

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
    let title = "Event Connect";
    if (path === "/") title = "Event Connect - Sua Plataforma de Eventos";
    else if (path === "/events") title = "Eventos - Event Connect";
    else if (path.startsWith("/event/")) title = "Detalhes do Evento - Event Connect";
    else if (path.startsWith("/payment/")) title = "Pagamento - Event Connect";
    else if (path === "/login") title = "Login - Event Connect";
    else if (path === "/register") title = "Cadastro - Event Connect";
    else if (path === "/para-organizadores") title = "Para Organizadores - Event Connect";
    else if (path === "/planos") title = "Planos e Preços - Event Connect";
    else if (path.startsWith("/organizer/dashboard")) {
      if (path.endsWith("/registrations")) title = "Inscritos - Dashboard do Organizador - Event Connect";
      else if (path.endsWith("/profile")) title = "Perfil da Empresa - Dashboard do Organizador - Event Connect";
      else if (path.endsWith("/events-management")) title = "Gerenciar Eventos - Dashboard do Organizador - Event Connect";
      else if (path.endsWith("/giveaways")) title = "Sorteios - Dashboard do Organizador - Event Connect";
      else if (path.endsWith("/marketplace")) title = "Mercado - Dashboard do Organizador - Event Connect";
      else if (path.endsWith("/collaborators")) title = "Colaboradores - Dashboard do Organizador - Event Connect";
      else if (path.endsWith("/finances")) title = "Financeiro - Dashboard do Organizador - Event Connect";
      else if (path.endsWith("/manual-payment")) title = "Pagamento Manual - Dashboard do Organizador - Event Connect";
      else if (path.endsWith("/payments")) title = "Pagamentos - Dashboard do Organizador - Event Connect";
      else title = "Dashboard do Organizador - Event Connect";
    }
    else if (path.startsWith("/organizador/")) title = "Perfil do Organizador - Event Connect";
    else if (path.startsWith("/participant/dashboard")) title = "Dashboard do Participante - Event Connect";
    else if (path.startsWith("/admin/dashboard")) {
      if (path.includes("settings")) title = "Configurações - Dashboard do Admin - Event Connect";
      else if (path.includes("roles")) title = "Funções - Dashboard do Admin - Event Connect";
      else if (path.includes("marketplace")) title = "Mercado - Dashboard do Admin - Event Connect";
      else if (path.includes("organizers")) title = "Organizadores - Dashboard do Admin - Event Connect";
      else if (path.includes("pages")) title = "Páginas - Dashboard do Admin - Event Connect";
      else if (path.includes("plans")) title = "Planos e Comissões - Dashboard do Admin - Event Connect";
      else if (path.includes("manual_payments")) title = "Confirmações Manuais - Dashboard do Admin - Event Connect";
      else title = "Dashboard do Admin - Event Connect";
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
          <SettingsProvider>
            <LanguageProvider>
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
                      <Route path="payments" element={<OrganizerPayments />} />
                    </Route>

                    <Route 
                      path="/participant/dashboard/*" 
                      element={
                        <ProtectedRoute requiredRole="participant">
                          <ErrorBoundary>
                            <ParticipantDashboard />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } 
                    >
                      <Route index element={
                        <ErrorBoundary>
                          <div className="space-y-4">
                            <TestComponent />
                            <I18nDebug />
                            <DirectI18nTest />
                          </div>
                        </ErrorBoundary>
                      } />
                      <Route path="my-events" element={<ParticipantMyEvents />} />
                      <Route path="profile" element={<ParticipantProfile />} />
                      <Route path="prizes" element={<ParticipantPrizes />} />
                      <Route path="documents" element={<ParticipantDocuments />} />
                      <Route path="finances" element={<ParticipantFinances />} />
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
                  <FooterInstallApp />
                </div>
              </Router>
            </LanguageProvider>
          </SettingsProvider>
        </EventProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
