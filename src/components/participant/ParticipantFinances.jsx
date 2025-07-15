import React from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useEvents } from '@/contexts/EventContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DialogClose } from '@radix-ui/react-dialog';
import { FileText, X, Loader2 } from 'lucide-react';

const ParticipantFinances = () => {
  const { profile } = useProfile();
  const { registrations, events, allUsers } = useEvents();
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const [selectedRegistration, setSelectedRegistration] = React.useState(null);
  const [file, setFile] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // NOVO: Estado para cobranças de stands
  const [pendingStandPayments, setPendingStandPayments] = React.useState([]);
  const [loadingStandPayments, setLoadingStandPayments] = React.useState(false);
  const [selectedStandPayment, setSelectedStandPayment] = React.useState(null);
  const [standPaymentFile, setStandPaymentFile] = React.useState(null);
  const [standPaymentUploading, setStandPaymentUploading] = React.useState(false);

  // NOVO: Estado para organizadores dos stands
  const [standOrganizers, setStandOrganizers] = React.useState({});

  // NOVO: Estado para métodos de pagamento do organizador do stand selecionado
  const [standPaymentMethods, setStandPaymentMethods] = React.useState([]);
  const [loadingStandPaymentMethods, setLoadingStandPaymentMethods] = React.useState(false);
  const [showStandPaymentOptions, setShowStandPaymentOptions] = React.useState(false);
  const [selectedStandEvent, setSelectedStandEvent] = React.useState(null);

  // 1. Adicionar novo estado para controlar o modal de upload de comprovante do stand
  const [showStandUploadDialog, setShowStandUploadDialog] = React.useState(false);



  if (!profile || !registrations || !Array.isArray(registrations) || !events || !Array.isArray(events)) {
    return <div className="text-center py-12 text-gray-500">Carregando informações financeiras...</div>;
  }

  // Filtrar inscrições do participante
  const myRegistrations = registrations.filter(reg => reg.user_id === profile.id);
  const paidRegs = myRegistrations.filter(reg => reg.status === 'confirmed');
  const pendingRegs = myRegistrations.filter(reg => reg.status === 'pending_approval' || reg.status === 'pending_payment');

  // Estado para pendentes (deve ser inicializado após dados carregados)
  const [pendingRegsState, setPendingRegsState] = React.useState(pendingRegs);
  React.useEffect(() => { setPendingRegsState(pendingRegs); }, [pendingRegs]);

    // NOVO: Buscar cobranças pendentes de stands
  React.useEffect(() => {
    const fetchStandPayments = async () => {
      if (!profile) return;
      
      console.log('Buscando cobranças de stands para user_id:', profile.id);
      setLoadingStandPayments(true);
      
      try {
        // Primeiro, vamos buscar stands reservados para este usuário
        console.log('Buscando stands reservados para user_id:', profile.id);
        
        const { data: reservedStands, error: standsError } = await supabase
          .from('event_stands')
          .select('*, events(name, organizer_id)')
          .eq('reserved_by', profile.id)
          .eq('status', 'reservado');
          
        console.log('Stands reservados encontrados:', reservedStands);
        console.log('Erro na busca de stands:', standsError);
        
        // Vamos também buscar TODOS os stands para debug
        const { data: allStands, error: allStandsError } = await supabase
          .from('event_stands')
          .select('*, events(name, organizer_id)')
          .eq('status', 'reservado');
          
        console.log('Todos os stands reservados:', allStands);
        console.log('Emails dos stands reservados:', allStands?.map(s => s.reserved_by));
        
        // Verificar se há pagamentos para estes stands
        const standIds = reservedStands?.map(s => s.id) || [];
        console.log('IDs dos stands reservados:', standIds);
        
        if (standIds.length > 0) {
          const { data: existingPayments, error: paymentsError } = await supabase
            .from('stand_payments')
            .select('*, event_stands(name, description, price, event_id)')
            .in('stand_id', standIds)
            .eq('status', 'pending');
            
          console.log('Pagamentos existentes para stands reservados:', existingPayments);
          
          // Se não há pagamentos, vamos criá-los
          if (!existingPayments || existingPayments.length === 0) {
            console.log('Criando pagamentos para stands reservados...');
            console.log('Stands para criar pagamentos:', reservedStands);
            
            const paymentsToCreate = reservedStands.map(stand => ({
              user_id: profile.id,
              stand_id: stand.id,
              amount: stand.price || 250.00,
              status: 'pending',
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
            }));
            
            console.log('Pagamentos a serem criados:', paymentsToCreate);
            
            const { data: createdPayments, error: createError } = await supabase
              .from('stand_payments')
              .insert(paymentsToCreate)
              .select('*, event_stands(name, description, price, event_id)');
              
            if (createError) {
              console.error('Erro ao criar pagamentos:', createError);
              console.error('Detalhes do erro:', createError);
            } else {
              console.log('Pagamentos criados com sucesso:', createdPayments);
              setPendingStandPayments(createdPayments || []);
              setLoadingStandPayments(false);
              return;
            }
          } else {
            console.log('Pagamentos existentes encontrados:', existingPayments);
            setPendingStandPayments(existingPayments || []);
            setLoadingStandPayments(false);
            return;
          }
        }
        
        // Buscar pagamentos existentes (fallback)
        console.log('Executando fallback - buscando pagamentos existentes...');
        const { data, error } = await supabase
          .from('stand_payments')
          .select('*, event_stands(name, description, price, event_id)')
          .eq('user_id', profile.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
          
        console.log('Pagamentos do usuário atual:', data);
        console.log('Profile ID:', profile.id);
        console.log('Profile completo:', profile);
        
        // Se não encontrou pagamentos, vamos buscar todos os pagamentos pendentes para debug
        if (!data || data.length === 0) {
          console.log('Nenhum pagamento encontrado para o usuário. Buscando todos os pagamentos pendentes...');
          const { data: allPending, error: allPendingError } = await supabase
            .from('stand_payments')
            .select('*, event_stands(name, description, price, event_id)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
          
          console.log('Todos os pagamentos pendentes:', allPending);
          console.log('User IDs dos pagamentos pendentes:', allPending?.map(p => p.user_id));
          
          // Verificar se há pagamentos com user_id diferente
          if (allPending && allPending.length > 0) {
            console.log('Pagamentos encontrados, mas com user_id diferente. Verificando...');
            allPending.forEach(payment => {
              console.log(`Pagamento ${payment.id}: user_id=${payment.user_id}, status=${payment.status}, amount=${payment.amount}`);
            });
          }
        }
        
        if (error) {
          console.error('Erro ao buscar cobranças de stands:', error);
          setPendingStandPayments([]);
        } else {
          console.log('Dados finais para renderização:', data);
          // Verificar se os event_stands estão sendo carregados corretamente
          data?.forEach(payment => {
            console.log(`Pagamento ${payment.id}:`, {
              user_id: payment.user_id,
              stand_id: payment.stand_id,
              event_stands: payment.event_stands,
              amount: payment.amount,
              status: payment.status
            });
          });
          setPendingStandPayments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Erro geral ao buscar cobranças de stands:', err);
        setPendingStandPayments([]);
      } finally {
        setLoadingStandPayments(false);
      }
    };
    fetchStandPayments();
  }, [profile]);

  // NOVO: Buscar eventos e organizadores dos stands
  React.useEffect(() => {
    const fetchOrganizers = async () => {
      console.log('fetchOrganizers chamado com pendingStandPayments:', pendingStandPayments);
      if (!pendingStandPayments.length) return;
      
      try {
        // Buscar eventos dos stands
        const eventIds = pendingStandPayments.map(p => p.event_stands?.event_id).filter(Boolean);
        console.log('Event IDs encontrados:', eventIds);
        if (eventIds.length === 0) return;
        
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, organizer_id, name')
          .in('id', eventIds);
          
        console.log('Eventos encontrados:', eventsData);
        
        if (eventsError) {
          console.error('Erro ao buscar eventos:', eventsError);
          return;
        }
        
        const organizerIds = eventsData?.map(e => e.organizer_id).filter(Boolean) || [];
        console.log('Organizer IDs encontrados:', organizerIds);
        if (organizerIds.length === 0) return;
        
        const { data: organizersData, error: organizersError } = await supabase
          .from('users')
          .select('id, name, company_name, logo_url, profile_image_url')
          .in('id', organizerIds);
          
        console.log('Organizadores encontrados:', organizersData);
        
        if (organizersError) {
          console.error('Erro ao buscar organizadores:', organizersError);
          return;
        }
        
        // Montar mapa de organizadores
        const orgMap = {};
        eventsData?.forEach(ev => {
          const org = organizersData?.find(o => o.id === ev.organizer_id);
          if (org) {
            orgMap[ev.id] = { ...org, event_name: ev.name };
          }
        });
        
        console.log('Mapa de organizadores montado:', orgMap);
        setStandOrganizers(orgMap);
      } catch (error) {
        console.error('Erro geral ao buscar organizadores:', error);
      }
    };
    fetchOrganizers();
  }, [pendingStandPayments]);

  // Função utilitária para pegar o valor do evento/inscrição
  const getValor = (reg, event) => {
    if (typeof reg.price === 'number') return reg.price;
    if (typeof event.price === 'number') return event.price;
    if (!isNaN(Number(reg.price))) return Number(reg.price);
    if (!isNaN(Number(event.price))) return Number(event.price);
    return null;
  };

  const totalPaid = paidRegs.reduce((sum, reg) => {
    const event = events.find(e => e.id === reg.event_id) || {};
    const valor = getValor(reg, event);
    return sum + (valor || 0);
  }, 0);

  const lastPaid = paidRegs.length > 0 ? paidRegs.reduce((latest, reg) => {
    const event = events.find(e => e.id === reg.event_id) || {};
    const eventDate = event.start_date ? new Date(event.start_date) : null;
    const valor = getValor(reg, event);
    if (!latest || (eventDate && eventDate > latest.date)) {
      return { name: event.name, date: eventDate, value: valor };
    }
    return latest;
  }, null) : null;



  // Função para reenviar comprovante
  const handleOpenUploadDialog = (registration) => {
    setSelectedRegistration(registration);
    setFile(null);
    setIsUploadDialogOpen(true);
  };
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({ title: 'Arquivo muito grande', description: 'O arquivo não pode exceder 5MB.', variant: 'destructive' });
        return;
      }
      setFile(selectedFile);
    }
  };
  const handleUploadSubmit = async () => {
    if (!file || !selectedRegistration) return;
    setIsSubmitting(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${selectedRegistration.id}-${Date.now()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('user_files').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('user_files').getPublicUrl(filePath);
      // Atualiza no banco
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ payment_proof_url: urlData.publicUrl, status: 'pending_approval' })
        .eq('id', selectedRegistration.id);
      if (updateError) throw updateError;
      toast({ title: 'Comprovante reenviado', description: 'Seu comprovante foi enviado para análise.', variant: 'success' });
      setIsUploadDialogOpen(false);
    } catch (err) {
      toast({ title: 'Erro ao enviar comprovante', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para cancelar inscrição
  const handleCancelRegistration = async (registration) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta inscrição?')) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: 'cancelled' })
        .eq('id', registration.id);
      if (error) throw error;
      setPendingRegsState(prev => prev.filter(r => r.id !== registration.id));
      toast({ title: 'Inscrição cancelada', description: 'Você pode se inscrever novamente neste evento.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Erro ao cancelar inscrição', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // NOVO: Função para upload de comprovante de pagamento do stand
  const handleStandPaymentUpload = async () => {
    console.log('handleStandPaymentUpload iniciado');
    console.log('standPaymentFile:', standPaymentFile);
    console.log('selectedStandPayment:', selectedStandPayment);
    
    if (!standPaymentFile || !selectedStandPayment) {
      console.log('Arquivo ou pagamento não encontrado');
      toast({ 
        title: 'Erro', 
        description: 'Por favor, selecione um arquivo e um pagamento válido.', 
        variant: 'destructive' 
      });
      return;
    }
    
    // Verificar tamanho do arquivo
    if (standPaymentFile.size > 5 * 1024 * 1024) {
      toast({ 
        title: 'Arquivo muito grande', 
        description: 'O arquivo não pode exceder 5MB.', 
        variant: 'destructive' 
      });
      return;
    }
    
    setStandPaymentUploading(true);
    console.log('Iniciando upload...');
    
    try {
      // Testar se o bucket está acessível
      console.log('Testando acesso ao bucket...');
      const { data: bucketTest, error: bucketError } = await supabase.storage
        .from('user_files')
        .list('stand_payments', { limit: 1 });
        
      if (bucketError) {
        console.error('Erro ao acessar bucket:', bucketError);
        throw new Error(`Erro de acesso ao storage: ${bucketError.message}`);
      }
      
      console.log('Bucket acessível, fazendo upload...');
      
      const ext = standPaymentFile.name.split('.').pop();
      const fileName = `stand_payment_${selectedStandPayment.id}_${Date.now()}.${ext}`;
      const filePath = `stand_payments/${fileName}`;
      
      console.log('Fazendo upload para:', filePath);
      
      const { error: uploadError } = await supabase.storage
        .from('user_files')
        .upload(filePath, standPaymentFile);
        
      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }
      
      console.log('Upload concluído, obtendo URL pública...');
      
      const { data: urlData } = supabase.storage
        .from('user_files')
        .getPublicUrl(filePath);
        
      console.log('URL pública obtida:', urlData.publicUrl);
      
      // Atualiza no banco
      console.log('Atualizando status no banco...');
      
      const { error: updateError } = await supabase
        .from('stand_payments')
        .update({ 
          payment_receipt_url: urlData.publicUrl, 
          status: 'em_analise'
        })
        .eq('id', selectedStandPayment.id);
        
      if (updateError) {
        console.error('Erro ao atualizar banco:', updateError);
        throw updateError;
      }
      
      console.log('Pagamento atualizado com sucesso');
      
      toast({ 
        title: 'Comprovante enviado', 
        description: 'Seu comprovante foi enviado para análise. Você será notificado quando for aprovado.', 
        variant: 'default' 
      });
      
      // Limpar estados
      setSelectedStandPayment(null);
      setStandPaymentFile(null);
      setShowStandPaymentOptions(false);
      
      // Atualiza lista de cobranças
      setPendingStandPayments(prev => prev.filter(p => p.id !== selectedStandPayment.id));
      
    } catch (err) {
      console.error('Erro geral no upload:', err);
      toast({ 
        title: 'Erro ao enviar comprovante', 
        description: err.message || 'Ocorreu um erro inesperado. Tente novamente.', 
        variant: 'destructive' 
      });
    } finally {
      setStandPaymentUploading(false);
    }
  };

  // NOVO: Buscar métodos de pagamento do organizador ao clicar em Pagar
  const handlePayStand = async (payment) => {
    setSelectedStandPayment(payment);
    setShowStandPaymentOptions(true);
    setLoadingStandPaymentMethods(true);
    setStandPaymentMethods([]);
    
    try {
      // Buscar evento do stand
      const eventId = payment.event_stands?.event_id;
      setSelectedStandEvent(eventId);
      
      if (!eventId) {
        setLoadingStandPaymentMethods(false);
        return;
      }
      
      // Buscar evento para pegar organizer_id
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, organizer_id, name')
        .eq('id', eventId)
        .single();
        
      if (eventError) {
        console.error('Erro ao buscar evento:', eventError);
        setLoadingStandPaymentMethods(false);
        return;
      }
      
      if (!eventData?.organizer_id) {
        setLoadingStandPaymentMethods(false);
        return;
      }
      
      // Buscar métodos de pagamento do organizador
      const { data: methodsData, error: methodsError } = await supabase
        .from('organizer_payment_methods')
        .select('*')
        .eq('organizer_id', eventData.organizer_id)
        .eq('is_active', true);
        
      if (methodsError) {
        console.error('Erro ao buscar métodos de pagamento:', methodsError);
        setLoadingStandPaymentMethods(false);
        return;
      }
      
      setStandPaymentMethods(methodsData || []);
    } catch (error) {
      console.error('Erro geral em handlePayStand:', error);
    } finally {
      setLoadingStandPaymentMethods(false);
    }
  };

  // Função para pegar organizador do evento
  const getOrganizer = (event) => {
    if (!event || !event.organizer_id) return null;
    return allUsers?.find(u => u.id === event.organizer_id) || null;
  };
  const getOrganizerLogo = (org) => org?.logo_url || org?.profile_image_url || '';
  const getOrganizerName = (org) => org?.company_name || org?.name || 'Organizador';
  const getInitials = (name) => {
    if (!name) return 'O';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  // Adicionar função utilitária para checar se o campo não está vazio ou 'EMPTY'
  const notEmpty = v => v && v !== 'EMPTY' && v !== '';



  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">Resumo Financeiro</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">R$ {totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Eventos Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidRegs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRegs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Último Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {lastPaid ? (
              <div>
                <div className="font-semibold">{lastPaid.name}</div>
                <div className="text-sm text-gray-600">{lastPaid.date ? lastPaid.date.toLocaleDateString('pt-BR') : '-'}</div>
                <div className="text-green-700 font-bold">R$ {lastPaid.value?.toFixed(2)}</div>
              </div>
            ) : (
              <div className="text-gray-400">—</div>
            )}
          </CardContent>
        </Card>
      </div>
      <h3 className="text-xl font-bold mb-4 mt-8">Pagamentos Pendentes</h3>
      {pendingRegs.length === 0 ? (
        <div className="text-gray-500 text-center py-8">Nenhum pagamento pendente no momento.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Organizador</th>
                <th className="px-4 py-2 text-left">Evento</th>
                <th className="px-4 py-2 text-left">Valor</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pendingRegs.map(reg => {
                const event = events.find(e => e.id === reg.event_id) || {};
                const valor = getValor(reg, event);
                const organizer = getOrganizer(event);
                return (
                  <tr key={reg.id} className="border-b align-middle">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getOrganizerLogo(organizer)} alt={getOrganizerName(organizer)} />
                          <AvatarFallback className="text-base">{getInitials(getOrganizerName(organizer))}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-gray-800">{getOrganizerName(organizer)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-700">{event.name || '-'}</td>
                    <td className="px-4 py-2 font-semibold text-green-700">R$ {valor !== null ? valor.toFixed(2) : '-'}</td>
                    <td className="px-4 py-2 text-gray-600">{event.start_date ? new Date(event.start_date).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="px-4 py-2 capitalize text-sm text-yellow-700">{reg.status.replace('_', ' ')}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenUploadDialog(reg)} disabled={isSubmitting}>Reenviar Comprovante</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleCancelRegistration(reg)} disabled={isSubmitting}>Cancelar</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* NOVO: Cobranças pendentes de stands */}
      <h3 className="text-xl font-bold mb-4 mt-8">Pagamentos Pendentes de Stands Reservados</h3>
      
      <Card className="mb-8">
        <CardContent>
          {console.log('Renderizando seção de stands - loadingStandPayments:', loadingStandPayments, 'pendingStandPayments:', pendingStandPayments)}
          {loadingStandPayments ? (
            <div className="text-center py-8 text-gray-500">Carregando cobranças...</div>
          ) : pendingStandPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma cobrança pendente de stand.
              <br />
              <small className="text-xs text-gray-400">
                Debug: Profile ID: {profile?.id} | Email: {profile?.email} | Total de pagamentos: {pendingStandPayments.length}
              </small>
            </div>
          ) : (
            <ul className="space-y-4">
              {pendingStandPayments.map(payment => {
                const eventId = payment.event_stands?.event_id;
                const organizer = standOrganizers[eventId];
                
                return (
                  <li key={payment.id} className="border rounded-lg p-4 bg-yellow-50 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-4 mb-2 md:mb-0">
                      {organizer?.profile_image_url ? (
                        <img src={organizer.profile_image_url} alt={organizer.name} className="h-12 w-12 rounded-full object-cover border" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-white">
                          {getInitials(organizer?.name || organizer?.company_name || 'O')}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-blue-800 text-lg">
                          {organizer?.event_name || 'Evento não encontrado'}
                        </div>
                        <div className="text-sm text-gray-700">
                          {organizer?.company_name || organizer?.name || 'Organizador'}
                        </div>
                        <div className="text-xs text-gray-500">Stand: {payment.event_stands?.name || 'Stand'}</div>
                        <div className="text-xs text-gray-500">Valor: CHF {payment.amount}</div>
                        <div className="text-xs text-gray-500">Prazo: {payment.expires_at ? new Date(payment.expires_at).toLocaleString('pt-BR') : '-'}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[180px]">
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          handlePayStand(payment);
                        }}
                      >
                        Pagar
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
      {/* Modal de upload de comprovante */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reenviar Comprovante</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input type="file" onChange={handleFileChange} accept="image/png, image/jpeg, application/pdf" />
            {file && <div className="text-sm text-gray-600">Arquivo selecionado: {file.name}</div>}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsUploadDialogOpen(false)} variant="outline">Cancelar</Button>
            <Button onClick={handleUploadSubmit} disabled={!file || isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Substituir o modal de métodos de pagamento e o modal de upload de comprovante por um único modal: */}
      <Dialog open={showStandPaymentOptions} onOpenChange={open => { 
        setShowStandPaymentOptions(open); 
        if (!open) { 
          setSelectedStandPayment(null); 
          setStandPaymentMethods([]); 
          setStandPaymentFile(null); 
        } 
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pagamento do Stand</DialogTitle>
            <DialogDescription>
              Stand: <span className="font-semibold">{selectedStandPayment?.event_stands?.name}</span><br />
              Valor: <span className="font-semibold text-green-700">CHF {selectedStandPayment?.amount}</span>
            </DialogDescription>
          </DialogHeader>
          {loadingStandPaymentMethods ? (
            <div className="text-center py-8 text-gray-500">Carregando opções...</div>
          ) : standPaymentMethods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma opção de pagamento configurada para este organizador.
              <br />
              <small className="text-xs text-gray-400">
                Organizador ID: {selectedStandEvent ? 'Carregando...' : 'N/A'}
              </small>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 text-sm">
                <b>Como pagar:</b> Escolha uma das opções abaixo, realize o pagamento e envie o comprovante para análise.<br />
                <span className="text-xs text-gray-600">A liberação do stand depende da confirmação do pagamento.</span>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-4 text-center">Métodos de Pagamento Disponíveis</h4>
                
                <div className="space-y-3">
                  {standPaymentMethods.filter(method => method.is_active).map((method, index) => (
                    <div key={method.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                      {/* Cabeçalho do método */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-800 text-lg">
                              {method.name || method.method_type}
                            </h5>
                            <p className="text-xs text-gray-500">Método de pagamento</p>
                          </div>
                        </div>
                        
                        {method.link && (
                          <a href={method.link} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                              Pagar Online
                            </Button>
                          </a>
                        )}
                      </div>
                      
                      {/* Detalhes do método */}
                      <div className="bg-gray-50 rounded-md p-3 mb-3">
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          {method.method_type === 'twint' && method.twint && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">TWINT:</span>
                              <span className="font-mono bg-white px-2 py-1 rounded border text-xs">{method.twint}</span>
                            </div>
                          )}
                          {method.method_type === 'mbway' && method.mbway && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">MB WAY:</span>
                              <span className="font-mono bg-white px-2 py-1 rounded border text-xs">{method.mbway}</span>
                            </div>
                          )}
                          {method.method_type === 'pix' && method.pix && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">Pix:</span>
                              <span className="font-mono bg-white px-2 py-1 rounded border text-xs">{method.pix}</span>
                            </div>
                          )}
                          {method.account_holder && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">Titular:</span>
                              <span className="font-mono bg-white px-2 py-1 rounded border text-xs">{method.account_holder}</span>
                            </div>
                          )}
                          {method.method_type === 'conta' && method.bank_name && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">Banco:</span>
                              <span className="font-mono bg-white px-2 py-1 rounded border text-xs">{method.bank_name}</span>
                            </div>
                          )}
                          {method.method_type === 'conta' && method.iban && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">IBAN:</span>
                              <span className="font-mono bg-white px-2 py-1 rounded border text-xs">{method.iban}</span>
                            </div>
                          )}
                          {method.method_type === 'conta' && method.account_number && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">Conta:</span>
                              <span className="font-mono bg-white px-2 py-1 rounded border text-xs">{method.account_number}</span>
                            </div>
                          )}
                          {method.method_type === 'conta' && method.bic_swift && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">BIC/SWIFT:</span>
                              <span className="font-mono bg-white px-2 py-1 rounded border text-xs">{method.bic_swift}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Instruções */}
                      {method.instructions && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mb-2">
                          <p className="text-xs text-yellow-800">
                            <strong>Instruções:</strong> {method.instructions}
                          </p>
                        </div>
                      )}
                      
                      {/* Aviso */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500">
                          Após realizar o pagamento, envie o comprovante abaixo
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-semibold mb-1">Comprovante de pagamento <span className="text-xs text-gray-500">(JPG, PNG ou PDF)</span></label>
                <Input 
                  id="stand-payment-upload" 
                  type="file" 
                  onChange={e => {
                    const file = e.target.files?.[0];
                    console.log('Arquivo selecionado:', file);
                    setStandPaymentFile(file || null);
                  }} 
                  accept="image/png, image/jpeg, application/pdf" 
                />
                {standPaymentFile && (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50 text-sm mt-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-800 truncate font-medium">{standPaymentFile.name}</span>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">{(standPaymentFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setStandPaymentFile(null)} className="h-8 w-8 flex-shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                  <Button 
                    onClick={() => {
                      console.log('Botão Confirmar clicado');
                      console.log('standPaymentFile:', standPaymentFile);
                      console.log('selectedStandPayment:', selectedStandPayment);
                      handleStandPaymentUpload();
                    }} 
                    disabled={!standPaymentFile || standPaymentUploading} 
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  >
                    {standPaymentUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar Pagamento e Enviar Comprovante
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Remover o modal separado de upload de comprovante de stand. */}
    </div>
  );
};

export default ParticipantFinances; 