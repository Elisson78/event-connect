import React from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useEvents } from '@/contexts/EventContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const ParticipantFinances = () => {
  const { profile } = useProfile();
  const { registrations, events, allUsers } = useEvents();
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const [selectedRegistration, setSelectedRegistration] = React.useState(null);
  const [file, setFile] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  // LOGS para depuração
  console.log("profile", profile);
  console.log("registrations", registrations);
  console.log("events", events);
  console.log("myRegistrations", myRegistrations);
  console.log("pendingRegs", pendingRegs);

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
    </div>
  );
};

export default ParticipantFinances; 