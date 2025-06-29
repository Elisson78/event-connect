import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ParticipantSidebar from '@/components/participant/ParticipantSidebar';
import { motion } from 'framer-motion';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const ParticipantDashboard = () => {
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.endsWith('/my-events')) return 'Meus Eventos Inscritos';
    if (path.endsWith('/profile')) return 'Meu Perfil';
    return 'Visão Geral';
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <ParticipantSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <motion.div
            key={location.pathname} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                  {getPageTitle()}
                </h1>
                {location.pathname.endsWith('/participant/dashboard') && profile && (
                  <p className="hidden sm:block text-lg md:text-xl text-gray-600 mt-2">
                    Bem-vindo de volta, <span className="font-semibold text-gradient">{profile.name}</span>!
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
            <Outlet /> 
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default ParticipantDashboard;