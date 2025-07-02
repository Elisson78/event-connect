import React, { useState, useMemo } from 'react';
import { useEvents } from '@/contexts/EventContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Eye, Upload, Loader2, FileText, X, AlertTriangle, CheckCircle, Hourglass, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';

const ParticipantMyEvents = () => {
  const { profile } = useProfile();
  const { events, getUserRegistrations, uploadPaymentProof, loadingEvents, loadingRegistrations } = useEvents();
  const { toast } = useToast();

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Filtra inscrições aguardando liberação
  const pendingApprovalRegistrations = myRegistrations.filter(reg => reg.status === 'pending_approval');
  // Filtra próximos eventos (excluindo os aguardando liberação)
  const upcomingRegistrationsFiltered = upcomingRegistrations.filter(reg => reg.status !== 'pending_approval');

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
            <h3 className="text-lg font-semibold text-gray-800 mb-2 pr-2 flex-1">{event.name}</h3>
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
          {/* Seção aguardando liberação */}
          {pendingApprovalRegistrations.length > 0 && (
            <>
              <h3 className="text-xl font-semibold text-yellow-700 mb-4 flex items-center gap-2"><Hourglass className="h-5 w-5 text-yellow-500" />Aguardando Liberação</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {pendingApprovalRegistrations.map(reg => <RegistrationCardItem key={reg.id} registration={reg} />)}
              </div>
            </>
          )}

          <h3 className="text-xl font-semibold text-gray-800 mb-4">Próximos Eventos</h3>
          {upcomingRegistrationsFiltered.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-gray-500 mb-4">Você não tem inscrições para eventos futuros.</p>
              <Link to="/events"><Button>Explorar Eventos</Button></Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {upcomingRegistrationsFiltered.map(reg => <RegistrationCardItem key={reg.id} registration={reg} />)}
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
    </div>
  );
};

export default ParticipantMyEvents;