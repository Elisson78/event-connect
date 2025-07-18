import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ParticipantSidebar from '@/components/participant/ParticipantSidebar';

import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import ParticipantPrizes from '@/components/participant/ParticipantPrizes';
import { useTranslation } from 'react-i18next';

const ParticipantDashboard = () => {
  const { t } = useTranslation();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();
  
  console.log('ParticipantDashboard - Profile:', profile);
  console.log('ParticipantDashboard - Profile Loading:', profileLoading);
  console.log('ParticipantDashboard - Location:', location.pathname);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.endsWith('/my-events')) return t('participant.myEvents') || 'Meus Eventos';
    if (path.endsWith('/profile')) return t('participant.profile') || 'Perfil';
    return t('participant.overview') || 'Visão Geral';
  };

  console.log('ParticipantDashboard render - Profile Loading:', profileLoading);
  if (profileLoading) {
    console.log('ParticipantDashboard - Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    console.log('ParticipantDashboard - No profile, redirecting to login');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Usuário não autenticado</h2>
          <p className="text-gray-500">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  console.log('ParticipantDashboard - Rendering main content');
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-yellow-100 p-2 text-center text-yellow-800 font-bold">
        Debug: ParticipantDashboard is rendering - {new Date().toISOString()}
      </div>
      <Navbar />
      <div className="flex flex-1 pt-16">
        <ParticipantSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="bg-green-100 p-2 mb-4 text-center text-green-800 font-bold">
            Debug: Main content area is rendering - {new Date().toISOString()}
          </div>
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                  {getPageTitle()}
                </h1>
                {location.pathname.endsWith('/participant/dashboard') && profile && (
                  <p className="hidden sm:block text-lg md:text-xl text-gray-600 mt-2">
                    {t('participant.overviewWelcome') || 'Bem-vindo ao seu painel de participante'}
                  </p>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
            {location.pathname.endsWith('/participant/dashboard') && <ParticipantPrizes />}
            <Outlet /> 
          </div>
        </main>
      </div>
    </div>
  );
};

export default ParticipantDashboard;