import React, { useState, useMemo, useEffect } from 'react';
import { useEvents } from '@/contexts/EventContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Eye, Upload, Loader2, FileText, X, AlertTriangle, CheckCircle, Hourglass, XCircle, DoorOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';

const ParticipantMyEvents = () => {
  const { profile } = useProfile();
  const { events, getUserRegistrations, uploadPaymentProof, loadingEvents, loadingRegistrations, getEventStands, allUsers } = useEvents();
  const { toast } = useToast();

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [standsModalOpen, setStandsModalOpen] = useState(false);
  const [standsLoading, setStandsLoading] = useState(false);
  const [stands, setStands] = useState([]);
  const [standsEventName, setStandsEventName] = useState('');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingStand, setPayingStand] = useState(null);
  const [payFile, setPayFile] = useState(null);
  const [payLoading, setPayLoading] = useState(false);

  // NOVO: Estado para cobranças de stands
  const [pendingStandPayments, setPendingStandPayments] = useState([]);
  const [loadingStandPayments, setLoadingStandPayments] = useState(false);
  const [selectedStandPayment, setSelectedStandPayment] = useState(null);
  const [standPaymentFile, setStandPaymentFile] = useState(null);
  const [standPaymentUploading, setStandPaymentUploading] = useState(false);

  const userRegistrations = useMemo(() => {
    if (!profile) return [];
    return getUserRegistrations(profile.id);
  }, [profile, getUserRegistrations]);

  const eventsById = useMemo(() => {
    return events.reduce((acc, event) => {
      acc[event.id] = event;
      return acc;
    }, {});
  }, [events]);

  const myRegistrations = useMemo(() => {
    return userRegistrations
      .map(reg => ({
        ...reg,
        event: eventsById[reg.event_id]
      }))
      .filter(reg => reg.event);
  }, [userRegistrations, eventsById]);

  const upcomingRegistrations = myRegistrations
    .filter(reg => new Date(reg.event.date) >= new Date())
    .sort((a, b) => new Date(a.event.date) - new Date(b.event.date));

  const pastRegistrations = myRegistrations
    .filter(reg => new Date(reg.event.date) < new Date())
    .sort((a, b) => new Date(b.event.date) - new Date(a.event.date));

  // Filtra apenas inscrições confirmadas (pagas/liberadas)
  const confirmedRegistrations = myRegistrations.filter(reg => reg.status === 'confirmed');

  // NOVO: Buscar cobranças pendentes de stands
  useEffect(() => {
    const fetchStandPayments = async () => {
      if (!profile) return;
      setLoadingStandPayments(true);
      const { data, error } = await supabase
        .from('stand_payments')
        .select('*, event_stands(name, description, price)')
        .eq('user_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        setPendingStandPayments(data);
      } else {
        setPendingStandPayments([]);
      }
      setLoadingStandPayments(false);
    };
    fetchStandPayments();
  }, [profile]);

  const handleOpenUploadDialog = (registration) => {
    setSelectedRegistration(registration);
    setFile(null);
    setIsUploadDialogOpen(true);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
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
      await uploadPaymentProof(selectedRegistration.id, file);
      toast({ title: "Sucesso!", description: "Comprovante enviado para análise." });
      setIsUploadDialogOpen(false);
    } catch (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para abrir modal de stands
  const handleOpenStands = async (event) => {
    setStandsModalOpen(true);
    setStandsLoading(true);
    setStands([]);
    setStandsEventName(event.name);
    try {
      const data = await getEventStands(event.id);
      setStands(data);
    } catch (e) {
      toast({ title: 'Erro ao buscar stands', description: e.message, variant: 'destructive' });
    } finally {
      setStandsLoading(false);
    }
  };

  // Função para reservar stand
  const handleReserveStand = async (stand) => {
    if (!profile) {
      toast({ title: 'Faça login para reservar', variant: 'destructive' });
      return;
    }
    try {
      // Busca o stand atualizado do banco para garantir que ainda está disponível
      const { data: fresh, error: fetchError } = await supabase
        .from('event_stands')
        .select('status, reserved_by')
        .eq('id', stand.id)
        .single();
      if (fetchError) throw fetchError;
      if (!fresh || fresh.status !== 'disponivel') {
        toast({ title: 'Stand indisponível', description: 'Este stand já foi reservado por outro participante.', variant: 'destructive' });
        // Atualiza a lista para refletir o status real
        if (stand.event_id) {
          setStandsLoading(true);
          const data = await getEventStands(stand.event_id);
          setStands(data);
          setStandsLoading(false);
        }
        return;
      }
      // Atualiza o status do stand para 'reservado' e associa ao usuário
      const { error } = await supabase
        .from('event_stands')
        .update({ status: 'reservado', reserved_by: profile.id })
        .eq('id', stand.id)
        .eq('status', 'disponivel'); // Garante update só se ainda está disponível
      if (error) throw error;
      // === NOVO: Criar cobrança na tabela stand_payments ===
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h depois
      const { error: paymentError } = await supabase
        .from('stand_payments')
        .insert({
          stand_id: stand.id,
          user_id: profile.id,
          amount: stand.price,
          status: 'pending',
          expires_at: expiresAt
        });
      if (paymentError) {
        toast({ title: 'Reserva feita, mas houve erro ao criar cobrança!', description: paymentError.message, variant: 'destructive' });
      }
      // === FIM NOVO ===
      toast({ title: 'Reserva realizada!', description: `Você reservou o ${stand.name}.`, variant: 'success' });
      // Atualiza a lista de stands no modal
      if (stand.event_id) {
        setStandsLoading(true);
        const data = await getEventStands(stand.event_id);
        setStands(data);
        setStandsLoading(false);
      }
    } catch (e) {
      toast({ title: 'Erro ao reservar stand', description: e.message, variant: 'destructive' });
    }
  };

  // Função para cancelar reserva do stand
  const handleCancelReservation = async (stand) => {
    try {
      const { error } = await supabase
        .from('event_stands')
        .update({ status: 'disponivel', reserved_by: null })
        .eq('id', stand.id);
      if (error) throw error;
      toast({ title: 'Reserva cancelada!', description: `Você cancelou a reserva do ${stand.name}.`, variant: 'success' });
      if (stand.event_id) {
        setStandsLoading(true);
        const data = await getEventStands(stand.event_id);
        setStands(data);
        setStandsLoading(false);
      }
    } catch (e) {
      toast({ title: 'Erro ao cancelar reserva', description: e.message, variant: 'destructive' });
    }
  };

  // Função para abrir modal de pagamento
  const handleOpenPayModal = (stand) => {
    setPayingStand(stand);
    setPayFile(null);
    setPayModalOpen(true);
  };

  // Função para upload do comprovante
  const handlePaySubmit = async () => {
    if (!payFile || !payingStand) return;
    setPayLoading(true);
    try {
      const ext = payFile.name.split('.').pop();
      const filePath = `stand_payments/${payingStand.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('user_files').upload(filePath, payFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('user_files').getPublicUrl(filePath);
      // Atualiza no banco
      const { error: updateError } = await supabase
        .from('event_stands')
        .update({ payment_receipt_url: urlData.publicUrl, payment_status: 'em_analise', payment_date: new Date().toISOString() })
        .eq('id', payingStand.id);
      if (updateError) throw updateError;
      toast({ title: 'Comprovante enviado', description: 'Seu comprovante foi enviado para análise.', variant: 'success' });
      setPayModalOpen(false);
      // Atualiza lista de stands
      if (payingStand.event_id) {
        setStandsLoading(true);
        const data = await getEventStands(payingStand.event_id);
        setStands(data);
        setStandsLoading(false);
      }
    } catch (err) {
      toast({ title: 'Erro ao enviar comprovante', description: err.message, variant: 'destructive' });
    } finally {
      setPayLoading(false);
    }
  };

  // NOVO: Função para upload de comprovante de pagamento do stand
  const handleStandPaymentUpload = async () => {
    if (!standPaymentFile || !selectedStandPayment) return;
    setStandPaymentUploading(true);
    try {
      const ext = standPaymentFile.name.split('.').pop();
      const filePath = `stand_payments/${selectedStandPayment.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('user_files').upload(filePath, standPaymentFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('user_files').getPublicUrl(filePath);
      // Atualiza no banco
      const { error: updateError } = await supabase
        .from('stand_payments')
        .update({ payment_receipt_url: urlData.publicUrl, status: 'em_analise' })
        .eq('id', selectedStandPayment.id);
      if (updateError) throw updateError;
      toast({ title: 'Comprovante enviado', description: 'Seu comprovante foi enviado para análise.', variant: 'success' });
      setSelectedStandPayment(null);
      setStandPaymentFile(null);
      // Atualiza lista de cobranças
      setPendingStandPayments(prev => prev.filter(p => p.id !== selectedStandPayment.id));
    } catch (err) {
      toast({ title: 'Erro ao enviar comprovante', description: err.message, variant: 'destructive' });
    } finally {
      setStandPaymentUploading(false);
    }
  };

  if (loadingEvents || loadingRegistrations) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-16 w-16 animate-spin text-orange-500" />
      </div>
    );
  }

  const statusConfig = {
    pending_payment: { text: 'Aguardando pagamento', color: 'yellow', icon: AlertTriangle },
    pending_approval: { text: 'Aguardando liberação', color: 'blue', icon: Hourglass },
    confirmed: { text: 'Pago', color: 'green', icon: CheckCircle },
    rejected: { text: 'Inscrição Rejeitada', color: 'red', icon: XCircle },
    cancelled: { text: 'Cancelada', color: 'gray', icon: XCircle },
  };

  const RegistrationCardItem = ({ registration, isPastEvent = false, onRemove }) => {
    const { event } = registration;
    const status = statusConfig[registration.status] || { text: registration.status, color: 'gray', icon: AlertTriangle };
    const StatusIcon = status.icon;

    // Debug: ver o que vem do backend
    console.log('registration:', registration);

    // Botões de ação por status
    const renderActions = () => {
      switch (registration.status) {
        case 'pending_payment':
          return <Button variant="outline" size="sm">Pagar agora</Button>;
        case 'pending_approval':
          return <Button variant="secondary" size="sm">Ver detalhes</Button>;
        case 'confirmed':
          return <Button variant="success" size="sm">Baixar comprovante</Button>;
        case 'rejected':
          return <Button variant="destructive" size="sm">Ver motivo</Button>;
        case 'cancelled':
          return <Button variant="outline" size="sm" onClick={() => onRemove(registration.id)}>Remover</Button>;
        default:
          return null;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col"
      >
        <div className="p-6 flex-grow">
          <div className="flex justify-between items-start mb-3">
            <div className="pr-2 flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">{event.name}</h3>
              <div className="text-xs text-blue-700 font-mono mb-1 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Código de Inscrição: <span className="font-bold">{registration.registration_code || 'N/A'}</span>
              </div>
            </div>
            <Badge variant={status.color} className="flex-shrink-0">
              <StatusIcon className="h-3 w-3 mr-1.5" />
              {status.text}
            </Badge>
          </div>
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-500" /><span>{new Date(event.date).toLocaleDateString('pt-BR')} às {event.time}</span></div>
            <div className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-blue-500" /><span className="truncate">{event.location}</span></div>
            <div className="flex items-center"><FileText className="h-4 w-4 mr-2 text-green-600" /><span><b>Valor:</b> {formatPrice(event.price)}</span></div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 flex flex-col sm:flex-row gap-2">
          <Link to={`/event/${event.id}`} className="flex-1">
            <Button variant="outline" className="w-full"><Eye className="h-4 w-4 mr-2" /> Ver Detalhes</Button>
          </Link>
          <Button variant="outline" className="flex-1" onClick={() => handleOpenStands(event)}><DoorOpen className="h-4 w-4 mr-2" /> Stands</Button>
          {registration.status === 'pending_payment' && !isPastEvent && (
            <Button onClick={() => handleOpenUploadDialog(registration)} className="flex-1 btn-orange text-white"><Upload className="h-4 w-4 mr-2" /> Enviar Comprovante</Button>
          )}
          {isPastEvent && registration.status === 'confirmed' && (
            <Button variant="outline" className="w-full text-green-600 border-green-600 hover:bg-green-50" onClick={() => toast({title: "Em breve!", description:"Certificados estarão disponíveis em breve."})}>
              <CheckCircle className="h-4 w-4 mr-2" /> Ver Certificado
            </Button>
          )}
          {renderActions()}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Minhas Inscrições</CardTitle>
          <CardDescription>Acompanhe o status de todas as suas inscrições em eventos.</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Eventos Pagos/Liberados</h3>
          {confirmedRegistrations.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-gray-500 mb-4">Você não tem inscrições pagas/liberadas.</p>
              <Link to="/events"><Button>Explorar Eventos</Button></Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {confirmedRegistrations.map(reg => <RegistrationCardItem key={reg.id} registration={reg} />)}
            </div>
          )}

          <h3 className="text-xl font-semibold text-gray-800 mt-10 mb-4">Eventos Passados</h3>
          {pastRegistrations.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-gray-500">Nenhum evento concluído ainda.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {pastRegistrations.map(reg => <RegistrationCardItem key={reg.id} registration={reg} isPastEvent={true} />)}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Comprovante de Pagamento</DialogTitle>
            <DialogDescription>
              Anexe o comprovante para o evento: <span className="font-semibold">{selectedRegistration?.event?.name}</span>.
              Sua vaga será confirmada após a aprovação.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Label htmlFor="receipt-upload">Arquivo do Comprovante</Label>
            <Input id="receipt-upload" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, application/pdf" />
            {file && (
              <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50 text-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-800 truncate">{file.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="h-8 w-8 flex-shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUploadSubmit} disabled={!file || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar para Análise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Stands */}
      <Dialog open={standsModalOpen} onOpenChange={setStandsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stands do Evento: <span className="font-semibold">{standsEventName}</span></DialogTitle>
          </DialogHeader>
          {standsLoading ? (
            <div className="py-8 text-center text-gray-500">Carregando stands...</div>
          ) : stands.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Nenhum stand cadastrado para este evento.</div>
          ) : (
            <ul className="space-y-4 max-h-96 overflow-y-auto">
              {stands.map(stand => (
                <li key={stand.id} className="border rounded-lg p-4 bg-gray-50 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-blue-800 text-lg">{stand.name}</div>
                      <div className="text-sm text-gray-700">{stand.description}</div>
                      <div className="text-xs text-gray-500">Valor: CHF {stand.price}</div>
                      <div className="text-xs text-gray-500">Status: {stand.status}</div>
                      {stand.reserved_by && (
                        <div className="text-xs text-gray-500">
                          Reservado por: {allUsers.find(u => u.id === stand.reserved_by)?.name || stand.reserved_by}
                        </div>
                      )}
                      {stand.status === 'reservado' && stand.reserved_by === profile?.id && (
                        <div className="mt-1">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${stand.payment_status === 'pago' ? 'bg-green-100 text-green-800' : stand.payment_status === 'em_analise' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-700'}`}>{stand.payment_status === 'pago' ? 'Pago' : stand.payment_status === 'em_analise' ? 'Em análise' : 'Pendente'}</span>
                        </div>
                      )}
                    </div>
                    {stand.status === 'disponivel' && (
                      <Button
                        className="ml-4"
                        size="sm"
                        onClick={() => handleReserveStand(stand)}
                      >
                        Reservar
                      </Button>
                    )}
                    {stand.status === 'reservado' && stand.reserved_by === profile?.id && stand.payment_status !== 'pago' && (
                      <Button
                        className="ml-4"
                        size="sm"
                        variant="success"
                        onClick={() => handleOpenPayModal(stand)}
                        disabled={stand.payment_status === 'em_analise'}
                      >
                        Pagar
                      </Button>
                    )}
                    {stand.status === 'reservado' && stand.reserved_by === profile?.id && (
                      <Button
                        className="ml-4"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancelReservation(stand)}
                        disabled={stand.payment_status === 'em_analise' || stand.payment_status === 'pago'}
                      >
                        Cancelar Reserva
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de pagamento do stand */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar comprovante de pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="file" accept="image/*,application/pdf" onChange={e => setPayFile(e.target.files[0])} />
            {payFile && <div className="text-sm text-gray-600">Arquivo selecionado: {payFile.name}</div>}
          </div>
          <DialogFooter>
            <Button onClick={() => setPayModalOpen(false)} variant="outline">Cancelar</Button>
            <Button onClick={handlePaySubmit} disabled={!payFile || payLoading} className="btn-primary text-white">
              {payLoading ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NOVO: Cobranças pendentes de stands */}
      <Card>
        <CardHeader>
          <CardTitle>Stands Reservados - Pagamento Pendente</CardTitle>
          <CardDescription>Veja abaixo os stands reservados que aguardam pagamento.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStandPayments ? (
            <div className="text-center py-8 text-gray-500">Carregando cobranças...</div>
          ) : pendingStandPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma cobrança pendente de stand.</div>
          ) : (
            <ul className="space-y-4">
              {pendingStandPayments.map(payment => (
                <li key={payment.id} className="border rounded-lg p-4 bg-yellow-50 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-bold text-blue-800 text-lg">{payment.event_stands?.name || 'Stand'}</div>
                    <div className="text-sm text-gray-700">{payment.event_stands?.description}</div>
                    <div className="text-xs text-gray-500">Valor: CHF {payment.amount}</div>
                    <div className="text-xs text-gray-500">Prazo para pagamento: {payment.expires_at ? new Date(payment.expires_at).toLocaleString('pt-BR') : '-'}</div>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    <Button size="sm" variant="success" onClick={() => setSelectedStandPayment(payment)}>Enviar Comprovante</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {/* Modal de upload de comprovante de pagamento do stand */}
      <Dialog open={!!selectedStandPayment} onOpenChange={open => { if (!open) { setSelectedStandPayment(null); setStandPaymentFile(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Comprovante de Pagamento do Stand</DialogTitle>
            <DialogDescription>
              Stand: <span className="font-semibold">{selectedStandPayment?.event_stands?.name}</span><br />
              Valor: CHF {selectedStandPayment?.amount}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Label htmlFor="stand-payment-upload">Arquivo do Comprovante</Label>
            <Input id="stand-payment-upload" type="file" onChange={e => setStandPaymentFile(e.target.files?.[0] || null)} accept="image/png, image/jpeg, application/pdf" />
            {standPaymentFile && (
              <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50 text-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-800 truncate">{standPaymentFile.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setStandPaymentFile(null)} className="h-8 w-8 flex-shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleStandPaymentUpload} disabled={!standPaymentFile || standPaymentUploading}>
              {standPaymentUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar para Análise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParticipantMyEvents;