import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminDashboardHeader from '@/components/admin/AdminDashboardHeader';
import AdminStatsCards from '@/components/admin/AdminStatsCards';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminSettingsDialog from '@/components/admin/AdminSettingsDialog';
import AdminCardSettings from '@/components/admin/AdminCardSettings';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminRoleManagement from '@/components/admin/AdminRoleManagement';
import AdminMarketplace from '@/components/admin/AdminMarketplace';
import AdminEventTypes from '@/components/admin/AdminEventTypes';
import AdminOrganizersManagement from '@/components/admin/AdminOrganizersManagement';
import AdminPagesManagement from '@/components/admin/AdminPagesManagement';
import AdminPlansManagement from '@/components/admin/AdminPlansManagement';
import AdminPaymentSettings from '@/components/admin/AdminPaymentSettings';
import AdminPlatformFees from '@/components/admin/AdminPlatformFees';
import AdminManualPayments from '@/components/admin/AdminManualPayments';
import AdminBackupRestore from '@/components/admin/AdminBackupRestore';
import { useProfile } from '@/contexts/ProfileContext';
import { useEvents } from '@/contexts/EventContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const AdminDashboard = () => {
  const { profile: currentUser } = useProfile();
  const { 
    events, 
    loadingEvents, 
    allUsers,
    loadingUsers,
    cardFieldSettings: initialCardFieldSettings, 
    loadingCardSettings: initialLoadingCardSettings, 
    networkError,
    refetchEvents,
    refetchAllUsers,
    refetchRegistrations,
    refetchCardFieldSettings,
    refetchAdPlans,
    refetchEventCategories,
    eventCategories,
  } = useEvents();
  const { toast } = useToast();

  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState({
    logo_url: '',
    primary_color: '#1A73E8',
    secondary_color: '#FFA500',
    platform_name: 'EventiConnect'
  });
  
  const [cardSettings, setCardSettings] = useState([]);
  const [loadingCardSettingsState, setLoadingCardSettingsState] = useState(true);
  const [loadingPlatformSettings, setLoadingPlatformSettings] = useState(true);
  const [currentSection, setCurrentSection] = useState('dashboard');

  const fetchPlatformSettings = useCallback(async () => {
    setLoadingPlatformSettings(true);
    try {
      const { data, error } = await supabase.from('platform_settings').select('*').eq('id', 1).single();
      if (error) {
        console.error("Error fetching platform settings:", error);
        if (error.code !== 'PGRST116') {
          toast({ title: "Erro ao buscar configurações", description: error.message, variant: "destructive"});
        }
      } else if (data) {
        setPlatformSettings(data);
      }
    } catch (err) {
      toast({ title: "Erro de conexão", description: "Falha ao buscar configurações.", variant: "destructive"});
    } finally {
      setLoadingPlatformSettings(false);
    }
  }, [toast]);
  
  useEffect(() => {
    setLoadingCardSettingsState(initialLoadingCardSettings);
    if (!initialLoadingCardSettings) {
      const settingsArray = Object.values(initialCardFieldSettings);
      setCardSettings(settingsArray);
    }
  }, [initialCardFieldSettings, initialLoadingCardSettings]);

  useEffect(() => {
    fetchPlatformSettings();
  }, [fetchPlatformSettings]);

  const organizers = allUsers.filter(u => u.role === 'organizer');
  const participants = allUsers.filter(u => u.role === 'participant');
  const admins = allUsers.filter(u => u.role === 'admin');
  const totalParticipantsInEvents = events.reduce((sum, event) => sum + (event.current_participants || 0), 0);

  const stats = {
    totalUsers: allUsers.length,
    newUsersThisWeek: allUsers.filter(u => new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    totalEvents: events.length,
    activeEvents: events.filter(e => e.status === 'available').length,
    totalParticipations: totalParticipantsInEvents,
    totalOrganizers: organizers.length,
  };

  const usersData = { organizers, participants, admins, all: allUsers };

  const handleDeleteUser = async (userIdToDelete, userName) => {
    if (userIdToDelete === currentUser?.id) {
      toast({ title: "Ação não permitida", description: "Você não pode remover sua própria conta.", variant: "destructive"});
      return;
    }
    try {
      const { error } = await supabase.from('users').delete().eq('id', userIdToDelete);
      if (error) throw error;
      toast({ title: "Usuário removido", description: `${userName} foi removido com sucesso.` });
      refetchAllUsers();
    } catch (error) {
      toast({ title: "Erro ao remover usuário", description: error.message, variant: "destructive"});
    }
  };

  const handleUpdateUser = async (userIdToUpdate, updatedData) => {
    try {
      const { error } = await supabase.from('users').update(updatedData).eq('id', userIdToUpdate);
      if (error) throw error;
      toast({ title: "Usuário atualizado!", description: "A função do usuário foi alterada." });
      refetchAllUsers();
    } catch (error) {
       toast({ title: "Erro ao atualizar usuário", description: error.message, variant: "destructive"});
       throw error;
    }
  };
  
  const handleSavePlatformSettings = async () => {
    setLoadingPlatformSettings(true);
    try {
      const { error } = await supabase.from('platform_settings').update({ 
        ...platformSettings,
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      if (error) throw error;
      toast({ title: "Configurações salvas!", description: "A aparência da plataforma foi atualizada."});
      setIsSettingsDialogOpen(false);
      fetchPlatformSettings();
    } catch (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive"});
    } finally {
      setLoadingPlatformSettings(false);
    }
  };

  const handleSaveCardFieldSettings = async (updatedFieldsArray) => {
    setLoadingCardSettingsState(true);
    try {
      for (const field of updatedFieldsArray) {
          const { error } = await supabase
            .from('card_field_settings')
            .upsert(field, { onConflict: 'field_name' });
          if (error) throw error;
      }
      toast({ title: "Configurações salvas!", description: "Os campos do card de evento foram atualizados."});
      await refetchCardFieldSettings();
    } catch (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive"});
    } finally {
      setLoadingCardSettingsState(false);
    }
  };
  
  const handlePlatformSettingsChange = (field, value) => {
    setPlatformSettings(prev => ({ ...prev, [field]: value }));
  };
  
  const pageTitles = {
    dashboard: 'Dashboard',
    users: 'Gerenciamento de Usuários',
    roles: 'Gerenciamento de Funções',
    organizers: 'Gerenciamento de Organizadores',
    plans: 'Planos e Comissões',
    platform_fees: 'Taxas da Plataforma',
    payments: 'Configurações de Pagamento',
    manual_payments: 'Confirmações Manuais',
    'event-types': 'Tipos de Evento',
    pages: 'Gerenciamento de Páginas',
    marketplace: 'Mercado de Publicidade',
    cardSettings: 'Configurações do Card',
    backup: 'Backup e Restauração',
    settings: 'Configurações do Site'
  };

  const handleRetry = () => {
    toast({ title: "Tentando reconectar...", description: "Buscando todos os dados novamente." });
    refetchEvents();
    refetchAllUsers();
    refetchRegistrations();
    refetchCardFieldSettings();
    fetchPlatformSettings();
    refetchAdPlans();
    refetchEventCategories();
  };

  const sectionComponents = {
    dashboard: () => <AdminStatsCards stats={stats} />,
    users: () => <AdminUserManagement usersData={usersData} onUserDelete={handleDeleteUser} onUserUpdate={handleUpdateUser} currentUserId={currentUser?.id} />,
    roles: () => <AdminRoleManagement />,
    organizers: () => <AdminOrganizersManagement />,
    plans: () => <AdminPlansManagement />,
    platform_fees: () => <AdminPlatformFees />,
    payments: () => <AdminPaymentSettings />,
    manual_payments: () => <AdminManualPayments />,
    'event-types': () => <AdminEventTypes />,
    pages: () => <AdminPagesManagement />,
    marketplace: () => <AdminMarketplace />,
    cardSettings: () => <AdminCardSettings settings={cardSettings} onSave={handleSaveCardFieldSettings} loading={loadingCardSettingsState} eventCategories={eventCategories} />,
    backup: () => <AdminBackupRestore />,
    settings: () => <AdminSettings />,
  };

  const CurrentSectionComponent = sectionComponents[currentSection] || (() => <AdminStatsCards stats={stats} />);
  const isLoading = loadingUsers || loadingEvents || loadingPlatformSettings || loadingCardSettingsState;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {networkError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 flex justify-between items-center" role="alert">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 mr-3" />
            <div><p className="font-bold">Falha na Conexão</p><p>Não foi possível conectar ao servidor.</p></div>
          </div>
          <Button onClick={handleRetry} variant="destructive">Tentar Novamente</Button>
        </div>
      )}
      <div className="flex pt-16">
        <AdminSidebar onNavigate={setCurrentSection} onOpenSettings={() => setIsSettingsDialogOpen(true)} />
        <main className="flex-1 p-4 md:p-8 lg:ml-64">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <AdminDashboardHeader 
                pageTitle={pageTitles[currentSection]}
                currentUser={currentUser}
                showCreateAdmin={currentSection === 'users'}
                onAdminCreated={refetchAllUsers}
            />
            {isLoading ? (
                <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>
            ) : (
                <CurrentSectionComponent />
            )}
          </motion.div>
        </main>
      </div>
      <AdminSettingsDialog 
        isOpen={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        settings={platformSettings}
        onSettingsChange={handlePlatformSettingsChange}
        onSave={handleSavePlatformSettings}
      />
    </div>
  );
};

export default AdminDashboard;
