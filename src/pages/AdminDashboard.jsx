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
import { useTranslation } from '@/hooks/useTranslation';

const AdminDashboard = () => {
  const { t } = useTranslation('common');
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
          toast({ title: t('error_fetching_settings'), description: error.message, variant: "destructive"});
        }
      } else if (data) {
        setPlatformSettings(data);
      }
    } catch (err) {
      toast({ title: t('connection_error'), description: t('failed_to_fetch_settings'), variant: "destructive"});
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
      toast({ title: t('action_not_allowed'), description: t('cannot_remove_own_account'), variant: "destructive"});
      return;
    }
    try {
      const { error } = await supabase.from('users').delete().eq('id', userIdToDelete);
      if (error) throw error;
      toast({ title: t('user_removed'), description: t('user_removed_desc', { name: userName }) });
      refetchAllUsers();
    } catch (error) {
      toast({ title: t('error_removing_user'), description: error.message, variant: "destructive"});
    }
  };

  const handleUpdateUser = async (userIdToUpdate, updatedData) => {
    try {
      const { error } = await supabase.from('users').update(updatedData).eq('id', userIdToUpdate);
      if (error) throw error;
      toast({ title: t('user_updated'), description: t('user_role_changed') });
      refetchAllUsers();
    } catch (error) {
       toast({ title: t('error_updating_user'), description: error.message, variant: "destructive"});
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
      toast({ title: t('settings_saved'), description: t('platform_appearance_updated')});
      setIsSettingsDialogOpen(false);
      fetchPlatformSettings();
    } catch (error) {
      toast({ title: t('error_saving'), description: error.message, variant: "destructive"});
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
      toast({ title: t('settings_saved'), description: t('card_fields_updated')});
      await refetchCardFieldSettings();
    } catch (error) {
      toast({ title: t('error_saving'), description: error.message, variant: "destructive"});
    } finally {
      setLoadingCardSettingsState(false);
    }
  };
  
  const handlePlatformSettingsChange = (field, value) => {
    setPlatformSettings(prev => ({ ...prev, [field]: value }));
  };
  
  const pageTitles = {
    dashboard: t('admin_dashboard'),
    users: t('user_management'),
    roles: t('role_management'),
    organizers: t('organizer_management'),
    plans: t('plans_and_commissions'),
    platform_fees: t('platform_fees'),
    payments: t('payment_settings'),
    manual_payments: t('manual_confirmations'),
    'event-types': t('event_types'),
    pages: t('page_management'),
    marketplace: t('advertising_marketplace'),
    cardSettings: t('card_settings'),
    backup: t('backup_restore'),
    settings: t('site_settings')
  };

  const handleRetry = () => {
    toast({ title: t('trying_to_reconnect'), description: t('fetching_all_data') });
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
            <div><p className="font-bold">{t('connection_failed')}</p><p>{t('connection_failed_desc')}</p></div>
          </div>
          <Button onClick={handleRetry} variant="destructive">{t('try_again')}</Button>
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
