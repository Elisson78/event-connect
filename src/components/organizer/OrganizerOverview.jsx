import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Zap } from 'lucide-react';
import OrganizerEventForm from '@/components/organizer/OrganizerEventForm';
import OrganizerEventList from '@/components/organizer/OrganizerEventList';
import OrganizerStatsCards from '@/components/organizer/OrganizerStatsCards';
import { useEvents } from '@/contexts/EventContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/components/ui/use-toast';

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
  const { profile: user } = useProfile();
  const { events, createEvent, updateEvent, deleteEvent, getEventRegistrations, loadingEvents, refetchEvents } = useEvents();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      refetchEvents();
    }
  }, [user, refetchEvents]);

  const organizerEvents = events.filter(event => event.organizer_id === user?.id);
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
      toast({ title: "Erro", description: "Usuário organizador não identificado corretamente.", variant: "destructive" });
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
      toast({ title: "Erro", description: "Usuário organizador não identificado.", variant: "destructive" });
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
            title: "Campos Obrigatórios",
            description: "Por favor, preencha todos os campos obrigatórios (Nome, Data/Hora de Início, Local, Máx. Participantes).",
            variant: "destructive",
        });
        return;
    }

    if (formData.end_date && formData.start_date > formData.end_date) {
        toast({
            title: "Data Inválida",
            description: "A data de término não pode ser anterior à data de início.",
            variant: "destructive",
        });
        return;
    }

    if (formData.start_date === formData.end_date && formData.end_time && formData.start_time > formData.end_time) {
        toast({
            title: "Horário Inválido",
            description: "O horário de término não pode ser anterior ao horário de início no mesmo dia.",
            variant: "destructive",
        });
        return;
    }
    // --- Fim da Validação ---

    setIsSubmitting(true);
    try {
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

      const eventPayload = {
        ...formData,
        organizer_id: user.id,
        max_participants: parseInt(formData.max_participants),
        current_participants: isEditing && editingEvent ? editingEvent.current_participants : 0,
        ad_plan_id: formData.ad_plan_id || null,
        start_date: formatDate(formData.start_date), // Formata a data de início
        end_date: formatDate(formData.end_date), // Formata a data de término
        end_time: formData.end_time && formData.end_time.trim() !== '' ? formData.end_time : null, // Garante que horas vazias se tornem null
        price: priceValue, // Usa o valor do preço limpo
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
        toast({ title: "Evento atualizado!", description: `O evento "${formData.name}" foi atualizado.` });
        setIsEditDialogOpen(false);
      } else {
        const newEvent = await createEvent(eventPayload);
        toast({ title: "Evento criado!", description: `O evento "${newEvent.name}" foi criado.` });
        setIsCreateDialogOpen(false);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving event:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast({ title: "Erro ao salvar evento", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId, eventName) => {
    try {
      await deleteEvent(eventId);
      toast({ title: "Evento excluído", description: `O evento "${eventName}" foi excluído.` });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({ title: "Erro ao excluir evento", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (event) => {
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
      // Converte o preço para string para o formulário, tratando corretamente o valor 0.
      price: event.price != null ? String(event.price) : '',
      status: event.status,
      current_participants: event.current_participants,
      card_image_url: event.card_image_url || '',
      banner_image_url: event.banner_image_url || '',
      ad_plan_id: event.ad_plan_id || '',
    });
    setIsEditDialogOpen(true);
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
              <Button 
                onClick={createTestEvents} 
                variant="outline" 
                className="shadow-md hover:shadow-yellow-400/40 transition-all duration-300"
                disabled={isSubmitting}
              >
                <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                {isSubmitting ? "Criando Testes..." : "Criar Eventos Teste"}
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => { setIsCreateDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="btn-primary text-white shadow-md hover:shadow-blue-500/40 transition-all duration-300">
                    <Plus className="h-5 w-5 mr-2" />Criar Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-8 rounded-xl shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-800">Criar Novo Evento</DialogTitle>
                    <DialogDescription className="text-gray-600">Preencha as informações detalhadas do seu novo evento.</DialogDescription>
                  </DialogHeader>
                  <OrganizerEventForm 
                    formData={formData} 
                    onInputChange={handleInputChange} 
                    onSubmit={(e) => handleSubmitEvent(e, false)} 
                    onCancel={() => { setIsCreateDialogOpen(false); resetForm();}} 
                    submitButtonText={isSubmitting ? "Criando..." : "Criar Evento"}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        <OrganizerStatsCards eventsCount={organizerEvents.length} participantsCount={totalParticipants} activeEventsCount={organizerEvents.filter(e => e.status === 'available').length} />

        <Card className="shadow-xl border-0 rounded-xl overflow-hidden">
        <CardHeader className="bg-white p-6 border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-800">Meus Eventos Criados</CardTitle>
            <CardDescription className="text-gray-500">Acompanhe e gerencie todos os seus eventos.</CardDescription>
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
            <DialogTitle className="text-2xl font-bold text-gray-800">Editar Evento</DialogTitle>
            <DialogDescription className="text-gray-600">Atualize as informações do seu evento.</DialogDescription>
            </DialogHeader>
            <OrganizerEventForm 
            formData={formData} 
            onInputChange={handleInputChange} 
            onSubmit={(e) => handleSubmitEvent(e, true)} 
            onCancel={() => { setIsEditDialogOpen(false); resetForm();}} 
            submitButtonText={isSubmitting ? "Salvando..." : "Salvar Alterações"}
            />
        </DialogContent>
        </Dialog>
    </div>
  );
};

export default OrganizerOverview;