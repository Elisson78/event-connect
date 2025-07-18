import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Hourglass, AlertTriangle, CheckCircle, XCircle, Upload } from 'lucide-react';
import { useEvents } from '@/contexts/EventContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';

const RegistrationCard = ({ registration, onCancel, onUploadProof }) => {
  const { t } = useTranslation();
  
  const statusConfig = {
    pending_payment: { text: t('participant.status.pending') || 'Pendente', color: 'warning', icon: AlertTriangle },
    pending_approval: { text: t('participant.status.pending') || 'Pendente', color: 'secondary', icon: Hourglass },
    confirmed: { text: t('participant.status.paid') || 'Pago', color: 'success', icon: CheckCircle },
    rejected: { text: t('participant.status.rejected') || 'Rejeitado', color: 'destructive', icon: XCircle },
    cancelled: { text: t('participant.status.cancelled') || 'Cancelado', color: 'outline', icon: XCircle },
  };
  
  const { event } = registration;
  const status = statusConfig[registration.status] || { text: registration.status, color: 'outline', icon: AlertTriangle };
  const StatusIcon = status.icon;
  const canCancel = ['pending_payment', 'pending_approval'].includes(registration.status);
  const canUploadProof = registration.status === 'pending_payment';

  return (
    <Card className="mb-4">
      <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 py-4">
        <div className="flex items-center gap-3">
          <Calendar className="text-muted-foreground" />
          <div>
            <div className="font-semibold text-lg">{event?.name}</div>
            <div className="text-xs text-muted-foreground">{event?.start_date} {event?.start_time && `às ${event.start_time}`}</div>
            <div className="text-xs text-muted-foreground">{t('participant.amount') || 'Valor'}: {formatPrice(event?.price)}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={status.color} className="flex items-center gap-1">
            <StatusIcon size={16} /> {status.text}
          </Badge>
          {canUploadProof && (
            <Button variant="outline" size="sm" onClick={() => onUploadProof(registration)}>
              <Upload className="h-4 w-4 mr-1" /> {t('participant.uploadDocument') || 'Enviar Documento'}
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" size="sm" onClick={() => onCancel(registration.id)}>
              {t('participant.cancelRegistration') || 'Cancelar Inscrição'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ParticipantOverview = () => {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { events, getUserRegistrations, loadingRegistrations, loadingEvents } = useEvents();
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState(null);

  console.log('ParticipantOverview - Component rendered');
  console.log('ParticipantOverview - Profile:', profile);
  console.log('ParticipantOverview - Events:', events);
  console.log('ParticipantOverview - Loading states:', { loadingRegistrations, loadingEvents });

  // Atualizar inscrições quando profile ou events mudarem
  useEffect(() => {
    try {
      console.log('ParticipantOverview useEffect triggered');
      console.log('ParticipantOverview - Profile:', profile);
      console.log('ParticipantOverview - Events:', events);
      
      if (!profile?.id) {
        console.log('ParticipantOverview - No profile ID, skipping registration fetch');
        setRegistrations([]);
        return;
      }
      
      const userRegistrations = getUserRegistrations(profile.id);
      console.log('ParticipantOverview - User Registrations:', userRegistrations);
      
      const updatedRegistrations = userRegistrations.map(reg => ({
        ...reg,
        event: events.find(e => e.id === reg.event_id)
      })).filter(reg => reg.event);
      
      console.log('ParticipantOverview - Updated Registrations:', updatedRegistrations);
      setRegistrations(updatedRegistrations);
      setError(null);
    } catch (err) {
      console.error('ParticipantOverview - Error in useEffect:', err);
      setError(err.message);
      setRegistrations([]);
    }
  }, [profile, events, getUserRegistrations]);

  // Upload modal state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [file, setFile] = useState(null);

  // Função para cancelar inscrição (apenas frontend)
  const handleCancel = (id) => {
    setRegistrations(prev => prev.filter(r => r.id !== id));
    toast({
      title: t('participant.registrationCancelled') || 'Inscrição Cancelada',
      description: t('participant.registrationCancelledSuccess') || 'Sua inscrição foi cancelada com sucesso.',
      variant: 'success',
    });
  };

  // Função para abrir modal de upload
  const handleUploadProof = (registration) => {
    setSelectedRegistration(registration);
    setUploadDialogOpen(true);
    setFile(null);
  };

  // Função para upload do comprovante
  const handleUpload = async () => {
    if (!file || !selectedRegistration) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `proofs/${selectedRegistration.id}_${Date.now()}.${ext}`;
      const { data, error: uploadError } = await supabase.storage.from('user_files').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { publicURL } = supabase.storage.from('user_files').getPublicUrl(filePath).data;
      // Atualiza no banco
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ payment_proof_url: publicURL, status: 'pending_approval' })
        .eq('id', selectedRegistration.id);
      if (updateError) throw updateError;
      // Atualiza localmente
      setRegistrations(prev => prev.map(r => r.id === selectedRegistration.id ? { ...r, payment_proof_url: publicURL, status: 'pending_approval' } : r));
      toast({ title: t('participant.proofSent') || 'Comprovante Enviado', description: t('participant.proofSentSuccess') || 'Seu comprovante foi enviado para análise.', variant: 'success' });
      setUploadDialogOpen(false);
    } catch (err) {
      toast({ title: t('participant.errorSendingProof') || 'Erro ao Enviar Comprovante', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  // Separação das inscrições por status e data
  const now = new Date();
  const isPast = (event) => {
    if (!event?.end_date && !event?.start_date) return false;
    const end = event?.end_date || event?.start_date;
    return new Date(end) < now;
  };
  const isUpcoming = (event) => {
    if (!event?.start_date) return false;
    return new Date(event.start_date) >= now;
  };

  console.log('ParticipantOverview render - Registrations:', registrations);
  const pendingApproval = registrations.filter(r => r.status === 'pending_approval');
  const pendingPayment = registrations.filter(r => r.status === 'pending_payment');
  const confirmedUpcoming = registrations.filter(r => r.status === 'confirmed' && isUpcoming(r.event));
  const pastEvents = registrations.filter(r => r.status === 'confirmed' && isPast(r.event));

  // Mostrar loading enquanto os dados estão carregando
  if (loadingRegistrations || loadingEvents) {
    console.log('ParticipantOverview - Showing loading state');
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('participant.myRegistrations')}</CardTitle>
            <CardDescription>{t('participant.myRegistrationsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">{t('participant.loadingPrizes') || 'Carregando...'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar erro se houver
  if (error) {
    console.log('ParticipantOverview - Showing error state:', error);
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
            <CardDescription>Ocorreu um erro ao carregar os dados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-red-600 py-8">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('participant.myRegistrations') || 'Minhas Inscrições'}</CardTitle>
          <CardDescription>{t('participant.myRegistrationsDesc') || 'Acompanhe o status de todas as suas inscrições em eventos.'}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Seção: Aguardando Liberação */}
          {pendingApproval.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-blue-700">{t('participant.pendingApproval') || 'Aguardando Liberação'}</h3>
              {pendingApproval.map(reg => <RegistrationCard key={reg.id} registration={reg} onCancel={handleCancel} />)}
            </div>
          )}
          {/* Seção: Pagamentos Pendentes */}
          {pendingPayment.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-yellow-700">{t('participant.pendingPayments') || 'Pagamentos Pendentes'}</h3>
              {pendingPayment.map(reg => <RegistrationCard key={reg.id} registration={reg} onCancel={handleCancel} onUploadProof={handleUploadProof} />)}
            </div>
          )}
          {/* Seção: Próximos Eventos */}
          {confirmedUpcoming.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-green-700">{t('participant.upcomingEvents') || 'Próximos Eventos'}</h3>
              {confirmedUpcoming.map(reg => <RegistrationCard key={reg.id} registration={reg} />)}
            </div>
          )}
          {/* Seção: Eventos Passados */}
          {pastEvents.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-gray-700">{t('participant.pastEvents') || 'Eventos Passados'}</h3>
              {pastEvents.map(reg => <RegistrationCard key={reg.id} registration={reg} />)}
            </div>
          )}
          {/* Caso não haja inscrições */}
          {registrations.length === 0 && (
            <div className="text-center text-muted-foreground py-8">{t('participant.noEventsFoundDesc') || 'Você ainda não se inscreveu em nenhum evento.'}</div>
          )}
        </CardContent>
      </Card>
      {/* Modal de upload de comprovante */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('participant.uploadPaymentProof') || 'Enviar Comprovante de Pagamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files[0])} />
            {file && <div className="text-sm text-gray-600">{t('participant.fileSelected') || 'Arquivo selecionado'}: {file.name}</div>}
          </div>
          <DialogFooter>
            <Button onClick={() => setUploadDialogOpen(false)} variant="outline">{t('cancel') || 'Cancelar'}</Button>
            <Button onClick={handleUpload} disabled={!file || uploading} className="btn-primary text-white">
              {uploading ? (t('participant.sending') || 'Enviando...') : (t('participant.send') || 'Enviar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParticipantOverview;