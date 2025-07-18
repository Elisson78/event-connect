import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Zap, Loader2, RefreshCw, Eye } from 'lucide-react';
import OrganizerEventForm from '@/components/organizer/OrganizerEventForm';
import OrganizerEventList from '@/components/organizer/OrganizerEventList';
import OrganizerStatsCards from '@/components/organizer/OrganizerStatsCards';
import { useEvents } from '@/contexts/EventContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';

const initialFormData = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  start_time: '',
  end_time: '',
  location: '',
  card_image_url: '', 
  banner_image_url: '',
  category_id: '',
  details: {},
  max_participants: '',
  price: '',
  current_participants: 0,
  status: 'available',
  ad_plan_id: '',
};

const OrganizerOverview = () => {
  const { t } = useTranslation('common');
  const { profile: user } = useProfile();
  const { events, createEvent, updateEvent, deleteEvent, getEventRegistrations, loadingEvents, refetchEvents, allUsers, getEventStands } = useEvents();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stands, setStands] = useState([]);
  const [standsLoading, setStandsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dados'); // Adicionado para controlar a aba ativa

  useEffect(() => {
    if (user) {
      refetchEvents();
    }
  }, [user, refetchEvents]);

  // Adicione este useEffect para buscar stands ao abrir a aba 'Status dos Stands'
  useEffect(() => {
    if (activeTab === 'status-stands' && editingEvent?.id) {
      fetchStandsForEvent(editingEvent.id);
    }
  }, [activeTab, editingEvent]);

  const organizerEvents = events.filter(event =>
    event.organizer_id === user?.id ||
    event.organizer_id === user?.user_id ||
    event.organizer_id === user?.user_metadata?.id
  );
  const totalParticipants = organizerEvents.reduce((sum, event) => sum + (event.current_participants || 0), 0);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingEvent(null);
  };

  const createTestEvents = async () => {
    if (!user?.id) {
      toast({ title: t('error'), description: t('organizer_not_identified'), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const testEventsData = [
      {
        name: 'Corrida Matinal de Verão',
        description: 'Participe da nossa corrida de 5km pela orla da praia. Kit atleta incluso!',
        start_date: '2025-07-20',
        end_date: '2025-07-20',
        start_time: '06:00',
        end_time: '09:00',
        location: 'Praia Central - Rio de Janeiro, RJ',
        card_image_url: 'https://source.unsplash.com/random/400x300?running,morning',
        banner_image_url: 'https://source.unsplash.com/random/1200x400?running,beach,sunrise',
        category_id: events.find(e => e?.category?.name === 'Corrida')?.category_id || null,
        details: { distance: '5km', kit_details: 'Camiseta, Viseira e Medalha' },
        max_participants: 200,
        price: 75.00,
      },
      {
        name: 'Desafio de Ciclismo nas Montanhas',
        description: 'Um percurso desafiador de 50km com trilhas e vistas incríveis.',
        start_date: '2025-08-15',
        end_date: '2025-08-15',
        start_time: '08:00',
        end_time: '14:00',
        location: 'Serra da Mantiqueira - Campos do Jordão, SP',
        card_image_url: 'https://source.unsplash.com/random/400x300?cycling,mountain',
        banner_image_url: 'https://source.unsplash.com/random/1200x400?cycling,mountain,trail',
        category_id: events.find(e => e?.category?.name === 'Ciclismo')?.category_id || null,
        details: { distance: '50km' },
        max_participants: 100,
        price: 120.00,
      }
    ];

    try {
      for (const eventData of testEventsData) {
        await createEvent({
          ...eventData,
          organizer_id: user.id,
          current_participants: Math.floor(Math.random() * (eventData.max_participants / 2)), 
          status: 'available',
        });
      }
      toast({ title: "Eventos de teste criados!", description: `${testEventsData.length} eventos foram adicionados.` });
    } catch (error) {
      console.error("Error creating test events:", error);
      toast({ title: "Erro ao criar eventos de teste", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEvent = async (e, isEditing = false) => {
    e.preventDefault();
    if (!user?.id) {
      toast({ title: t('error'), description: t('organizer_not_identified_error'), variant: "destructive" });
      return;
    }

    // Debug: Log form data before validation
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Form data before validation:', formData);
    console.log('start_date:', formData.start_date, 'type:', typeof formData.start_date);
    console.log('start_time:', formData.start_time, 'type:', typeof formData.start_time);
    console.log('end_date:', formData.end_date, 'type:', typeof formData.end_date);
    console.log('end_time:', formData.end_time, 'type:', typeof formData.end_time);
    console.log('================================');

    // --- Validação robusta dos dados do formulário ---
    if (!formData.name || !formData.start_date || !formData.start_time || !formData.location || !formData.max_participants) {
        console.log('Validation failed - missing required fields');
        console.log('name:', !!formData.name);
        console.log('start_date:', !!formData.start_date);
        console.log('start_time:', !!formData.start_time);
        console.log('location:', !!formData.location);
        console.log('max_participants:', !!formData.max_participants);
        
        toast({
            title: t('required_fields'),
            description: t('fill_required_fields'),
            variant: "destructive",
        });
        return;
    }

    if (formData.end_date && formData.start_date > formData.end_date) {
        toast({
            title: t('invalid_date'),
            description: t('end_date_before_start'),
            variant: "destructive",
        });
        return;
    }

    if (formData.start_date === formData.end_date && formData.end_time && formData.start_time > formData.end_time) {
        toast({
            title: t('invalid_time'),
            description: t('end_time_before_start'),
            variant: "destructive",
        });
        return;
    }
    // --- Fim da Validação ---

    setIsSubmitting(true);
    try {
      // Log para depuração do objeto user
      console.log('DEBUG USER OBJ:', user);
      // Limpa e converte o valor do preço para um formato numérico que o banco de dados aceita.
      // Remove "R$", outros caracteres não numéricos (exceto vírgula/ponto) e converte vírgula para ponto.
      // Se o campo estiver vazio, define como null.
      const priceValue = formData.price 
        ? parseFloat(String(formData.price).replace(/[^0-9,.]/g, '').replace(',', '.')) 
        : null;

      // Formata as datas para o formato correto (YYYY-MM-DD)
      const formatDate = (dateString) => {
        if (!dateString || dateString.trim() === '') return null;
        // Garante que a data está no formato YYYY-MM-DD
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0];
      };

      // Garante que o organizer_id é o da tabela users
      const organizerId = user.id ?? user.user_id ?? user.user_metadata?.id;

      // Se for instituição sem fins lucrativos, força evento gratuito
      let priceFinal = priceValue;
      let isFree = false;
      if (user.is_nonprofit) {
        priceFinal = 0;
        isFree = true;
      }

      const eventPayload = {
        ...formData,
        organizer_id: organizerId,
        max_participants: parseInt(formData.max_participants),
        current_participants: isEditing && editingEvent ? editingEvent.current_participants : 0,
        ad_plan_id: formData.ad_plan_id || null,
        start_date: formatDate(formData.start_date), // Formata a data de início
        end_date: formatDate(formData.end_date), // Formata a data de término
        end_time: formData.end_time && formData.end_time.trim() !== '' ? formData.end_time : null, // Garante que horas vazias se tornem null
        price: priceFinal, // Usa o valor do preço limpo ou 0
        is_free: isFree,
      };

      // Debug: Log final payload
      console.log('=== FINAL PAYLOAD DEBUG ===');
      console.log('Event payload:', eventPayload);
      console.log('Payload start_date:', eventPayload.start_date);
      console.log('Payload start_time:', eventPayload.start_time);
      console.log('Payload end_date:', eventPayload.end_date);
      console.log('Payload end_time:', eventPayload.end_time);
      console.log('end_date type:', typeof eventPayload.end_date);
      console.log('end_date is null:', eventPayload.end_date === null);
      console.log('end_date is empty string:', eventPayload.end_date === '');
      console.log('Original start_date:', formData.start_date);
      console.log('Original end_date:', formData.end_date);
      console.log('Formatted start_date:', formatDate(formData.start_date));
      console.log('Formatted end_date:', formatDate(formData.end_date));
      console.log('================================');

      if (isEditing && editingEvent) {
        await updateEvent(editingEvent.id, eventPayload);
        // Atualizar stands ao editar evento
        if (editingEvent.id) {
          // Remove todos os stands antigos
          await supabase.from('event_stands').delete().eq('event_id', editingEvent.id);
          // Insere os stands atuais
          if (stands.length > 0) {
            const standRows = stands.map(s => ({
              event_id: editingEvent.id,
              name: s.name,
              description: s.description,
              price: parseFloat(s.price) || 0,
              status: s.status || 'disponivel'
            }));
            const { error: standError } = await supabase.from('event_stands').insert(standRows);
            if (standError) {
              toast({ title: t('error_saving_stands'), description: standError.message, variant: "destructive" });
            }
          }
        }
        toast({ title: t('event_updated'), description: t('event_updated_success', { name: formData.name }) });
        setIsEditDialogOpen(false);
      } else {
        const createdEvent = await createEvent(eventPayload);
        // Salvar stands se houver
        if (createdEvent && createdEvent.id && stands.length > 0) {
          const standRows = stands.map(s => ({
            event_id: createdEvent.id,
            name: s.name,
            description: s.description,
            price: parseFloat(s.price) || 0,
            status: 'disponivel'
          }));
          const { error: standError } = await supabase.from('event_stands').insert(standRows);
          if (standError) {
            toast({ title: t('error_saving_stands'), description: standError.message, variant: "destructive" });
          }
        }
        toast({ title: t('event_created'), description: t('event_created_success') });
        setIsCreateDialogOpen(false);
        resetForm();
        refetchEvents();
      }
    } catch (error) {
      console.error("Error saving event:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast({ title: t('error_saving_event'), description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId, eventName) => {
    try {
      await deleteEvent(eventId);
      toast({ title: t('event_deleted'), description: t('event_deleted_success', { name: eventName }) });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({ title: t('error_deleting_event'), description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = async (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      start_date: event.start_date || '',
      end_date: event.end_date || '',
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      location: event.location,
      category_id: event.category_id,
      details: event.details || {},
      max_participants: event.max_participants.toString(),
      price: event.price != null ? String(event.price) : '',
      status: event.status,
      current_participants: event.current_participants,
      card_image_url: event.card_image_url || '',
      banner_image_url: event.banner_image_url || '',
      ad_plan_id: event.ad_plan_id || '',
    });
    // Buscar stands do evento no Supabase
    if (event.id) {
      const { data: standsData, error } = await supabase
        .from('event_stands')
        .select('id, name, description, price, status, reserved_by')
        .eq('event_id', event.id);
      if (!error && Array.isArray(standsData)) {
        setStands(standsData.map(s => ({
          name: s.name,
          description: s.description,
          price: s.price,
          status: s.status,
          id: s.id,
          reserved_by: s.reserved_by
        })));
      } else {
        setStands([]);
      }
    } else {
      setStands([]);
    }
    setIsEditDialogOpen(true);
  };

  // Função para buscar stands atualizados
  const fetchStandsForEvent = async (eventId) => {
    if (!eventId) return;
    setStandsLoading(true);
    try {
      const standsData = await getEventStands(eventId);
      console.log('Stands carregados com pagamentos:', standsData);
      setStands(standsData);
    } catch (error) {
      console.error('Erro ao buscar stands:', error);
      toast({ title: t('error_loading_stands'), description: error.message, variant: 'destructive' });
    } finally {
      setStandsLoading(false);
    }
  };

  const handleSaveStandsStatus = async () => {
    setIsSubmitting(true);
    try {
      for (const stand of stands) {
        // Atualizar o status do stand
        await supabase
          .from('event_stands')
          .update({
            status: stand.status,
            reserved_by: stand.reserved_by || null,
          })
          .eq('id', stand.id);

        // Se o status foi mudado para "vendido", atualizar o pagamento para "pago"
        if (stand.status === 'vendido') {
          // Buscar o pagamento mais recente deste stand
          const { data: payments, error: paymentError } = await supabase
            .from('stand_payments')
            .select('id, status')
            .eq('stand_id', stand.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!paymentError && payments && payments.length > 0) {
            const latestPayment = payments[0];
            // Atualizar o status do pagamento para "pago"
            await supabase
              .from('stand_payments')
              .update({ status: 'pago' })
              .eq('id', latestPayment.id);
          }
        }
        // Se o status foi mudado para "reservado", atualizar o pagamento para "em_analise"
        else if (stand.status === 'reservado') {
          // Buscar o pagamento mais recente deste stand
          const { data: payments, error: paymentError } = await supabase
            .from('stand_payments')
            .select('id, status')
            .eq('stand_id', stand.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!paymentError && payments && payments.length > 0) {
            const latestPayment = payments[0];
            // Atualizar o status do pagamento para "em_analise" se estava "pago"
            if (latestPayment.status === 'pago') {
              await supabase
                .from('stand_payments')
                .update({ status: 'em_analise' })
                .eq('id', latestPayment.id);
            }
          }
        }
      }
      toast({ title: t('stands_status_updated'), variant: 'success' });
      // Atualiza lista após salvar
      if (editingEvent?.id) await fetchStandsForEvent(editingEvent.id);
    } catch (e) {
      toast({ title: t('error_saving_changes'), description: e.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingEvents && !organizerEvents.length) {
     return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div></div>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => { setIsCreateDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="btn-primary text-white shadow-md hover:shadow-blue-500/40 transition-all duration-300">
                    <Plus className="h-5 w-5 mr-2" />{t('create_event')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-8 rounded-xl shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-800">{t('create_new_event')}</DialogTitle>
                    <DialogDescription className="text-gray-600">{t('fill_event_details')}</DialogDescription>
                  </DialogHeader>
                  <OrganizerEventForm 
                    formData={formData} 
                    onInputChange={handleInputChange} 
                    onSubmit={(e) => handleSubmitEvent(e, false)} 
                    onCancel={() => { setIsCreateDialogOpen(false); resetForm();}} 
                    submitButtonText={isSubmitting ? t('creating') : t('create_event')}
                    onStandsChange={setStands}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        <OrganizerStatsCards eventsCount={organizerEvents.length} participantsCount={totalParticipants} activeEventsCount={organizerEvents.filter(e => e.status === 'available').length} />

        <Card className="shadow-xl border-0 rounded-xl overflow-hidden">
        <CardHeader className="bg-white p-6 border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-800">{t('my_created_events')}</CardTitle>
            <CardDescription className="text-gray-500">{t('track_manage_events')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <OrganizerEventList 
            events={organizerEvents} 
            onEdit={openEditDialog} 
            onDelete={handleDeleteEvent} 
            onShowCreateDialog={() => setIsCreateDialogOpen(true)} 
            getEventRegistrations={getEventRegistrations} 
            />
        </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-8 rounded-xl shadow-2xl">
            <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">{t('edit_event')}</DialogTitle>
            <DialogDescription className="text-gray-600">{t('update_event_info')}</DialogDescription>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="dados">{t('data_tab')}</TabsTrigger>
                <TabsTrigger value="stands">{t('stands_tab')}</TabsTrigger>
                <TabsTrigger value="status-stands">{t('stands_status_tab')}</TabsTrigger>
              </TabsList>
              <TabsContent value="dados">
            <OrganizerEventForm 
            formData={formData} 
            onInputChange={handleInputChange} 
            onSubmit={(e) => handleSubmitEvent(e, true)} 
            onCancel={() => { setIsEditDialogOpen(false); resetForm();}} 
            submitButtonText={isSubmitting ? t('saving') : t('save_changes')}
                  stands={stands}
                  onStandsChange={setStands}
                />
              </TabsContent>
              <TabsContent value="stands">
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-900 text-lg mb-2">{t('manage_stands')}</h3>
                  <table className="min-w-full bg-white border rounded shadow text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left">{t('name')}</th>
                        <th className="px-3 py-2 text-left">{t('description')}</th>
                        <th className="px-3 py-2 text-left">{t('value_currency')}</th>
                        <th className="px-3 py-2 text-left">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stands.map((stand, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-3 py-2 font-medium">
                            <input
                              className="border rounded px-2 py-1 w-full"
                              value={stand.name}
                              onChange={e => {
                                const updated = [...stands];
                                updated[idx].name = e.target.value;
                                setStands(updated);
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="border rounded px-2 py-1 w-full"
                              value={stand.description}
                              onChange={e => {
                                const updated = [...stands];
                                updated[idx].description = e.target.value;
                                setStands(updated);
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="border rounded px-2 py-1 w-full"
                              value={stand.price}
                              onChange={e => {
                                const updated = [...stands];
                                updated[idx].price = e.target.value;
                                setStands(updated);
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 flex gap-2">
                            <button type="button" className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => {
                              const updated = stands.filter((_, i) => i !== idx);
                              setStands(updated);
                            }}>{t('remove')}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex gap-2 mt-4">
                    <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setStands([...stands, { name: '', description: '', price: '' }])}>{t('add_stand')}</button>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button type="button" className="bg-orange-600 text-white px-6 py-2 rounded" onClick={(e) => handleSubmitEvent(e, true)} disabled={isSubmitting}>
                      {isSubmitting ? t('saving') : t('save_changes')}
                    </button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="status-stands">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-blue-900 text-lg mb-2">{t('stands_status')}</h3>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => fetchStandsForEvent(editingEvent?.id)}
                      disabled={standsLoading}
                    >
                      {standsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      {t('update')}
                    </Button>
                  </div>
                  {/* Painel financeiro */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-green-50 border border-green-200 rounded p-4 flex flex-col items-center">
                      <span className="text-green-700 font-bold text-lg">{stands.filter(s => s.status === 'vendido' && s.payment_status === 'pago').length}</span>
                      <span className="text-green-900 text-sm">{t('stands_sold')}</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded p-4 flex flex-col items-center">
                      <span className="text-blue-700 font-bold text-lg">CHF {stands.filter(s => s.status === 'vendido' && s.payment_status === 'pago').reduce((sum, s) => sum + (Number(s.price) || 0), 0).toFixed(2)}</span>
                      <span className="text-blue-900 text-sm">{t('value_received')}</span>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 flex flex-col items-center">
                      <span className="text-yellow-700 font-bold text-lg">CHF {stands.filter(s => s.status === 'reservado' && s.payment_status !== 'pago').reduce((sum, s) => sum + (Number(s.price) || 0), 0).toFixed(2)}</span>
                      <span className="text-yellow-900 text-sm">{t('pending_value')}</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-4 flex flex-col items-center">
                      <span className="text-gray-700 font-bold text-lg">{stands.filter(s => s.status === 'disponivel').length}</span>
                      <span className="text-gray-900 text-sm">{t('available_stands')}</span>
                    </div>
                  </div>
                  {/* Fim painel financeiro */}
                  {standsLoading ? (
                    <div className="text-center text-gray-500 py-8">{t('loading_stands_status')}</div>
                  ) : stands.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">{t('no_stands_registered')}</div>
                  ) : (
                    <>
                      <table className="min-w-full bg-white border rounded shadow text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left">{t('name')}</th>
                            <th className="px-3 py-2 text-left">{t('value_currency')}</th>
                            <th className="px-3 py-2 text-left">{t('status')}</th>
                            <th className="px-3 py-2 text-left">{t('reserved_by')}</th>
                            <th className="px-3 py-2 text-left">{t('payment')}</th>
                            <th className="px-3 py-2 text-left">{t('view_receipt')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stands.map((stand, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2">{stand.name}</td>
                              <td className="px-3 py-2">{stand.price}</td>
                              <td className="px-3 py-2">
                                <Select value={stand.status || 'disponivel'} onValueChange={value => {
                                  const updated = [...stands];
                                  updated[idx].status = value;
                                  setStands(updated);
                                }}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="disponivel">
                                      <span className="text-gray-700 font-semibold">{t('available')}</span>
                                    </SelectItem>
                                    <SelectItem value="reservado">
                                      <span className="text-blue-700 font-bold">{t('reserved')}</span>
                                    </SelectItem>
                                    <SelectItem value="vendido">
                                      <span className="text-green-700 font-bold">{t('sold')}</span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-3 py-2">
                                {['reservado', 'vendido'].includes(stand.status) && !stand.reserved_by ? (
                                  <Select value={stand.reserved_by || ''} onValueChange={value => {
                                    const updated = [...stands];
                                    updated[idx].reserved_by = value;
                                    setStands(updated);
                                  }}>
                                    <SelectTrigger className="w-40">
                                      <SelectValue placeholder={t('select_participant')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {allUsers?.map(user => (
                                        <SelectItem key={user.id} value={user.id}>{user.name || user.email}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  stand.reserved_by
                                    ? (allUsers?.find(u => u.id === stand.reserved_by)?.name ||
                                       allUsers?.find(u => u.id === stand.reserved_by)?.email ||
                                       stand.reserved_by)
                                    : <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {stand.payment_status === 'pago' && <span className="text-green-700 font-bold">{t('paid')}</span>}
                                {stand.payment_status === 'em_analise' && <span className="text-yellow-700 font-bold">{t('under_review')}</span>}
                                {(!stand.payment_status || stand.payment_status === 'pendente') && <span className="text-gray-500">{t('pending')}</span>}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {stand.payment_receipt_url ? (
                                  <Button size="icon" variant="ghost" onClick={() => window.open(stand.payment_receipt_url, '_blank')} title={t('view_receipt')}>
                                    <Eye className="h-5 w-5 text-blue-700" />
                                  </Button>
                                ) : (
                                  <Eye className="h-5 w-5 text-gray-300" title={t('no_receipt')} />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex justify-end mt-4">
                        <button
                          type="button"
                          className="bg-orange-600 text-white px-6 py-2 rounded"
                          onClick={handleSaveStandsStatus}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? t('saving') : t('save_changes')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
        </DialogContent>
        </Dialog>
    </div>
  );
};

export default OrganizerOverview;