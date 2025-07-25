import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from './AuthContext';
import { useProfile } from '@/contexts/ProfileContext';

const EventContext = createContext();

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents deve ser usado dentro de um EventProvider');
  }
  return context;
};

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [cardFieldSettings, setCardFieldSettings] = useState([]);
  const [adPlans, setAdPlans] = useState([]);
  const [eventCategories, setEventCategories] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [loadingCardSettings, setLoadingCardSettings] = useState(true);
  const [loadingAdPlans, setLoadingAdPlans] = useState(true);
  const [loadingEventCategories, setLoadingEventCategories] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const [platformSettings, setPlatformSettings] = useState({});
  const [loadingPlatformSettings, setLoadingPlatformSettings] = useState(true);

  const handleNetworkError = (error, context) => {
    console.error(`Network error in ${context}:`, error);
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      setNetworkError(true);
    }
  };

  const fetchEventCategories = useCallback(async () => {
    setLoadingEventCategories(true);
    try {
      const { data, error } = await supabase.from('event_categories').select('*').order('name');
      if (error) {
        console.error("Error fetching event categories:", error);
        setEventCategories([]);
      } else {
        console.log("Fetched event categories:", data);
        setEventCategories(data || []);
      }
    } catch (networkError) {
      handleNetworkError(networkError, 'fetchEventCategories');
    } finally {
      setLoadingEventCategories(false);
      console.log("Loading event categories finished. State:", false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      console.log('Fetching events...');
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          ad_plan:ad_plan_id (
            name,
            platform,
            is_featured_plan
          ),
          category:event_categories (
            name,
            details_schema
          )
        `)
        .order('start_date', { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } else {
        console.log('Events fetched:', data);
        const sortedEvents = (data || []).sort((a, b) => (b.is_featured === a.is_featured) ? 0 : b.is_featured ? 1 : -1);
        setEvents(sortedEvents);
        setNetworkError(false);
      }
    } catch (networkError) {
      handleNetworkError(networkError, 'fetchEvents');
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const fetchAdPlans = useCallback(async () => {
    console.log("Fetching ad plans...");
    setLoadingAdPlans(true);
    try {
      const { data, error } = await supabase
        .from('ad_plans')
        .select('*')
        
        .order('price', { ascending: true });
      if (error) {
        console.error("Error fetching ad plans:", error);
        setAdPlans([]);
      } else {
        console.log("Fetched ad plans:", data);
        setAdPlans(data || []);
      }
    } catch (error) {
      handleNetworkError(error, 'fetchAdPlans');
      setAdPlans([]);
    } finally {
      setLoadingAdPlans(false);
      console.log("Loading ad plans finished. State:", false);
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error("Error fetching all users:", error);
        setAllUsers([]);
      } else {
        setAllUsers(data || []);
        setNetworkError(false);
      }
    } catch (networkError) {
      handleNetworkError(networkError, 'fetchAllUsers');
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    setLoadingRegistrations(true);
    try {
      console.log('Fetching registrations...');
      const { data, error } = await supabase.from('registrations').select('*');
      if (error) {
        console.error("Error fetching registrations:", error);
        setRegistrations([]);
      } else {
        console.log('Registrations fetched:', data);
        setRegistrations(data || []);
        setNetworkError(false);
      }
    } catch (networkError) {
      handleNetworkError(networkError, 'fetchRegistrations');
      setRegistrations([]);
    } finally {
      setLoadingRegistrations(false);
    }
  }, []);

  const fetchCardFieldSettings = useCallback(async () => {
    setLoadingCardSettings(true);
    try {
      const { data, error } = await supabase.from('card_field_settings').select('*');
      if (error) {
        console.error("Error fetching card field settings:", error);
        setCardFieldSettings([]);
      } else {
        const settingsMap = (data || []).reduce((acc, setting) => {
          acc[setting.field_name] = setting;
          return acc;
        }, {});
        setCardFieldSettings(settingsMap);
        setNetworkError(false);
      }
    } catch (networkError) {
      handleNetworkError(networkError, 'fetchCardFieldSettings');
      setCardFieldSettings([]);
    } finally {
      setLoadingCardSettings(false);
    }
  }, []);

  const fetchPlatformSettings = useCallback(async () => {
    setLoadingPlatformSettings(true);
    try {
      const { data, error } = await supabase.from('platform_settings').select('*').eq('id', 1).single();
      if (!error && data) {
        setPlatformSettings(data);
      }
    } finally {
      setLoadingPlatformSettings(false);
    }
  }, []);

  useEffect(() => {
    console.log('EventContext - Initial data fetch...');
    console.log('EventContext - User:', user);
    console.log('EventContext - Profile:', profile);
    fetchEvents();
    fetchCardFieldSettings();
    fetchAllUsers();
    fetchAdPlans();
    console.log("Calling fetchEventCategories from useEffect");
    fetchEventCategories();
    fetchPlatformSettings();
  }, [fetchEvents, fetchCardFieldSettings, fetchAllUsers, fetchAdPlans, fetchEventCategories, fetchPlatformSettings]);

  useEffect(() => {
    console.log('EventContext - User changed, fetching registrations...');
    fetchRegistrations();
  }, [fetchRegistrations, user]);

  const createEvent = async (eventData) => {
    console.log('=== CREATE EVENT DEBUG ===');
    console.log('Received eventData:', eventData);
    console.log('end_date in eventData:', eventData.end_date);
    console.log('end_time in eventData:', eventData.end_time);
    console.log('========================');
    
    // Usar ad_plan_id para determinar se é featured (marketing)
    const marketingPlan = adPlans.find(p => p.id === eventData.ad_plan_id);
    const payload = {
      ...eventData,
      is_featured: marketingPlan ? marketingPlan.is_featured_plan : false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('=== FINAL PAYLOAD TO SUPABASE ===');
    console.log('Payload to insert:', payload);
    console.log('end_date in payload:', payload.end_date);
    console.log('end_time in payload:', payload.end_time);
    console.log('================================');
    
    const { data, error } = await supabase
      .from('events')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    await fetchEvents();
    return data;
  };

  const updateEvent = async (eventId, eventData) => {
    // Usar ad_plan_id para determinar se é featured (marketing)
    const marketingPlan = adPlans.find(p => p.id === eventData.ad_plan_id);
    const payload = {
      ...eventData,
      is_featured: marketingPlan ? marketingPlan.is_featured_plan : false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', eventId)
      .select()
      .single();
    if (error) throw error;
    await fetchEvents();
    return data;
  };

  const deleteEvent = async (eventId) => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) throw error;
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
  };
  
  const createRegistration = async (eventId, userId, status) => {
    if (!userId) {
      console.error("User ID is undefined, cannot register for event.");
      throw new Error("User ID is undefined.");
    }
    const { data: newRegistration, error } = await supabase
      .from('registrations')
      .insert([{ event_id: eventId, user_id: userId, status }])
      .select()
      .single();

    if (error) throw error;
    
    await fetchRegistrations();
    
    return newRegistration;
  };

  const uploadPaymentProof = async (registrationId, file) => {
    if (!profile) throw new Error("Usuário não autenticado.");
    // Buscar a inscrição para pegar event_id
    const { data: reg, error: regError } = await supabase
      .from('registrations')
      .select('event_id')
      .eq('id', registrationId)
      .single();
    if (regError) throw regError;
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${registrationId}-${Date.now()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;
    const { error: uploadError } = await supabase.storage
        .from('user_files')
        .upload(filePath, file);
    if (uploadError) {
        console.error("Storage Error:", uploadError);
        throw new Error("Falha ao enviar o arquivo.");
    }
    const { data: urlData } = supabase.storage.from('user_files').getPublicUrl(filePath);
    // Cria novo registro na tabela payment_proofs
    const { error: insertError } = await supabase
      .from('payment_proofs')
      .insert({
        registration_id: registrationId,
        user_id: profile.id,
        event_id: reg.event_id,
            receipt_url: urlData.publicUrl,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    if (insertError) {
      console.error("Insert Error:", insertError);
      throw new Error("Falha ao registrar comprovante.");
    }
    await fetchRegistrations();
    return true;
  };

  const getEventRegistrations = (eventId) => {
    return registrations.filter(reg => reg.event_id === eventId);
  };

  const getUserRegistrations = (userId) => {
    console.log('getUserRegistrations called with userId:', userId);
    console.log('Current registrations:', registrations);
    if (!userId) return [];
    const userRegs = registrations.filter(reg => reg.user_id === userId);
    console.log('User registrations found:', userRegs);
    return userRegs;
  };

  const isUserRegistered = (eventId, userId) => {
    if (!userId) return false;
    return registrations.some(reg => reg.event_id === eventId && reg.user_id === userId);
  };

  // Função para buscar stands de um evento
  const getEventStands = async (eventId) => {
    if (!eventId) return [];
    
    try {
      // Buscar stands com informações de pagamento
      const { data: standsData, error: standsError } = await supabase
        .from('event_stands')
        .select(`
          *,
          stand_payments!left(
            id,
            status,
            amount,
            payment_receipt_url,
            created_at
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { foreignTable: 'stand_payments', ascending: false });
        
      if (standsError) {
        console.error('Erro ao buscar stands:', standsError);
        return [];
      }
      
      // Processar os dados para incluir informações de pagamento
      const processedStands = (standsData || []).map(stand => {
        // Pegar o pagamento mais recente (se houver)
        const payments = stand.stand_payments || [];
        const latestPayment = payments.length > 0 ? payments[0] : null;
        
        console.log(`Stand ${stand.name}:`, {
          stand_status: stand.status,
          payments_count: payments.length,
          latest_payment_status: latestPayment?.status,
          latest_payment_created: latestPayment?.created_at
        });
        
        return {
          ...stand,
          payment_status: latestPayment?.status || null,
          payment_amount: latestPayment?.amount || null,
          payment_receipt_url: latestPayment?.payment_receipt_url || null,
          payment_created_at: latestPayment?.created_at || null,
          // Se há pagamento aprovado, atualizar status do stand
          status: latestPayment?.status === 'pago' ? 'vendido' : stand.status
        };
      });
      
      return processedStands;
    } catch (error) {
      console.error('Erro geral ao buscar stands:', error);
      return [];
    }
  };

  const value = {
    events,
    allUsers,
    registrations,
    cardFieldSettings,
    adPlans,
    eventCategories,
    createEvent,
    updateEvent,
    deleteEvent,
    createRegistration,
    uploadPaymentProof,
    getEventRegistrations,
    getUserRegistrations,
    isUserRegistered,
    getEventStands,
    loadingEvents,
    loadingUsers,
    loadingRegistrations,
    loadingCardSettings,
    loadingAdPlans,
    loadingEventCategories,
    networkError,
    refetchEvents: fetchEvents,
    refetchAllUsers: fetchAllUsers,
    refetchRegistrations: fetchRegistrations,
    refetchCardFieldSettings: fetchCardFieldSettings,
    refetchAdPlans: fetchAdPlans,
    refetchEventCategories: fetchEventCategories,
    platformSettings,
    refetchPlatformSettings: fetchPlatformSettings,
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};
