import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Gift, 
  Plus, 
  Users, 
  Search, 
  Filter, 
  Copy, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Shuffle,
  Trophy,
  Calendar,
  Eye,
  Trash2,
  Pencil,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Confetti from 'react-confetti';

// Componente para exibir detalhes do participante
const ParticipantDetailsModal = ({ participant, eventName, isOpen, onClose }) => {
  if (!participant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Participante</DialogTitle>
          <DialogDescription>Informações completas do inscrito</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="flex items-center text-gray-700">
            <Gift className="h-5 w-5 mr-3 text-yellow-600" />
            <span>Código da Sorte: <span className="font-bold">{participant.participant_code || 'N/A'}</span></span>
          </div>
          <div className="flex items-center text-gray-700">
            <Users className="h-5 w-5 mr-3 text-orange-500" />
            <span>{participant.name}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Calendar className="h-5 w-5 mr-3 text-orange-500" />
            <span>Evento: {eventName}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Componente para exibir resultados do sorteio
const RaffleResults = ({ winners, eventName, onClose, onNewRaffle }) => {
  const { toast } = useToast();

  const copyResults = () => {
    const resultsText = `🎉 SORTEIO REALIZADO! 🎉\n\nEvento: ${eventName}\nGanhadores:\n${winners.map((winner, index) => `${index + 1}. ${winner.participant.name} (${winner.participant.participant_code || 'N/A'})`).join('\n')}\n\nParabéns aos ganhadores! 🏆`;
    
    navigator.clipboard.writeText(resultsText).then(() => {
      toast({ title: "Resultados copiados!", description: "Os resultados foram copiados para a área de transferência.", variant: "success" });
    });
  };

  const exportResults = () => {
    const csvContent = [
      ['Nome', 'Código da Sorte', 'Evento'],
      ...winners.map(winner => [winner.participant.name, winner.participant.participant_code || 'N/A', eventName])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sorteio-${eventName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: "Resultados exportados!", description: "Os resultados foram baixados em CSV.", variant: "success" });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            🎉 Sorteio Realizado! 🎉
          </DialogTitle>
          <DialogDescription>
            Confira os ganhadores do sorteio para o evento: <strong>{eventName}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Ganhadores ({winners.length})
            </h3>
            <div className="space-y-3">
              {winners.map((winner, index) => (
                <motion.div
                  key={winner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-200 shadow-sm"
                >
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    #{index + 1}
                  </Badge>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={winner.participant.avatar_url || winner.participant.profile_image_url} />
                    <AvatarFallback>{winner.participant.name?.substring(0, 1) || 'P'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold">{winner.participant.name}</div>
                    <div className="text-sm text-gray-600">
                      Código: {winner.participant.participant_code || 'N/A'}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => window.open(`mailto:${winner.participant.email}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={copyResults} variant="outline" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copiar Resultados
            </Button>
            <Button onClick={exportResults} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onNewRaffle} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Novo Sorteio
          </Button>
          <Button onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PAGE_SIZE = 20;
const OrganizerGiveaways = () => {
  const { user } = useAuth();
  const { events, loadingEvents } = useEvents();
  const { toast } = useToast();

  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [selectedEventObj, setSelectedEventObj] = useState(null);
  const [winnersCount, setWinnersCount] = useState(1);
  const [isRaffleDialogOpen, setIsRaffleDialogOpen] = useState(false);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
  const [raffleResults, setRaffleResults] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [selectedEventName, setSelectedEventName] = useState('');
  const [previousRaffles, setPreviousRaffles] = useState([]);
  const [loadingRaffle, setLoadingRaffle] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rafflePrize, setRafflePrize] = useState('');
  const [pendingRaffles, setPendingRaffles] = useState([]);
  const [activeTab, setActiveTab] = useState('winners');
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [eventRaffles, setEventRaffles] = useState([]);
  const [isEditRaffleOpen, setIsEditRaffleOpen] = useState(false);
  const [editPrize, setEditPrize] = useState('');
  const [editWinnersCount, setEditWinnersCount] = useState(1);
  const [isRaffleModalOpen, setIsRaffleModalOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnWinners, setDrawnWinners] = useState([]);

  const organizerEvents = events.filter(event => event.organizer_id === user?.id);

  const paginatedRegistrations = registrations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.ceil(registrations.length / PAGE_SIZE);

  // Buscar inscrições do evento selecionado
  const fetchEventRegistrations = useCallback(async (eventId) => {
    if (!eventId) {
      setRegistrations([]);
      setLoadingRegistrations(false);
      setFetchError(null);
      return;
    }
    setLoadingRegistrations(true);
    setFetchError(null);
    try {
      const { data: regs, error: regsError } = await supabase
        .from('registrations')
        .select(`
          id,
          registration_code,
          participant_name,
          participant_email
        `)
        .eq('event_id', eventId)
        .eq('status', 'confirmed');
      if (regsError) throw regsError;
      setRegistrations(regs);
    } catch (error) {
      setFetchError(error.message || 'Erro desconhecido');
      setRegistrations([]);
      toast({ title: 'Erro ao carregar inscrições', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingRegistrations(false);
    }
  }, [toast]);

  // Buscar sorteios anteriores (histórico)
  const fetchPreviousRaffles = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('raffles')
        .select('*, events(name), raffle_winners(*)')
        .eq('organizer_id', user.id)
        .eq('status', 'completed') // Só sorteios realizados
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPreviousRaffles(data || []);
    } catch (error) {
      console.error("Error fetching previous raffles:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchPreviousRaffles();
  }, [fetchPreviousRaffles]);

  useEffect(() => {
    if (selectedEventObj) {
      setCurrentPage(1);
      fetchEventRegistrations(selectedEventObj.id);
      setSelectedEventName(selectedEventObj.name);
    }
  }, [selectedEventObj, fetchEventRegistrations]);

  // Buscar sorteios do evento selecionado
  useEffect(() => {
    async function fetchRafflesForEvent() {
      if (!selectedEventObj) return setEventRaffles([]);
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('event_id', selectedEventObj.id)
        .eq('status', 'completed') // Só sorteios realizados
        .order('created_at', { ascending: false });
      setEventRaffles(error ? [] : (data || []));
    }
    fetchRafflesForEvent();
  }, [selectedEventObj, pendingRaffles]);

  // Função para gerar código único de inscrição
  const generateRegistrationCode = (eventType, eventDate, registrationNumber) => {
    const dateStr = eventDate.replace(/-/g, '');
    const numberStr = registrationNumber.toString().padStart(3, '0');
    return `EVT-${eventType}-${dateStr}-${numberStr}`;
  };

  const handleViewParticipant = (participant, eventName) => {
    setSelectedParticipant(participant);
    setSelectedEventName(eventName);
    setIsParticipantModalOpen(true);
  };

  const handleNewRaffle = () => {
    setIsResultsDialogOpen(false);
    setRaffleResults(null);
    setIsRaffleDialogOpen(true);
  };

  const createRaffle = async () => {
    if (!selectedEventObj || winnersCount <= 0 || winnersCount > registrations.length || !rafflePrize.trim()) {
      toast({
        title: "Erro ao criar sorteio",
        description: `Preencha todos os campos obrigatórios. Máximo: ${registrations.length} participantes.`,
        variant: "destructive"
      });
      return;
    }
    setLoadingRaffle(true);
    try {
      const { data: raffleData, error: raffleError } = await supabase
        .from('raffles')
        .insert([{
          event_id: selectedEventObj.id,
          organizer_id: user.id,
          winners_count: winnersCount,
          total_participants: registrations.length,
          status: 'pending',
          prize: rafflePrize
        }])
        .select()
        .single();
      if (raffleError) throw raffleError;
      setPendingRaffles(prev => [...prev, raffleData]);
      setIsRaffleDialogOpen(false);
      toast({ title: 'Sorteio criado!', description: 'Agora clique em Realizar Sorteio para sortear os ganhadores.', variant: 'success' });
    } catch (error) {
      toast({ title: 'Erro ao criar sorteio', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingRaffle(false);
    }
  };

  // Função para editar sorteio pendente
  const handleEditRaffle = async () => {
    if (!selectedRaffle) return;
    try {
      await supabase
        .from('raffles')
        .update({ prize: editPrize, winners_count: editWinnersCount })
        .eq('id', selectedRaffle.id);
      setPendingRaffles(prev =>
        prev.map(raffle =>
          raffle.id === selectedRaffle.id
            ? { ...raffle, prize: editPrize, winners_count: editWinnersCount }
            : raffle
        )
      );
      setIsEditRaffleOpen(false);
      toast({ title: 'Sorteio atualizado!', description: 'Os dados do sorteio foram atualizados.', variant: 'success' });
    } catch (error) {
      toast({ title: 'Erro ao editar sorteio', description: error.message, variant: 'destructive' });
    }
  };

  // Função para excluir sorteio pendente
  const handleDeleteRaffle = async () => {
    if (!selectedRaffle) return;
    try {
      await supabase
        .from('raffles')
        .delete()
        .eq('id', selectedRaffle.id);
      setPendingRaffles(prev => prev.filter(r => r.id !== selectedRaffle.id));
      fetchPreviousRaffles();
      toast({ title: 'Sorteio excluído!', description: 'O sorteio pendente foi removido.', variant: 'success' });
    } catch (error) {
      toast({ title: 'Erro ao excluir sorteio', description: error.message, variant: 'destructive' });
    }
  };

  // Função para excluir ganhador
  const handleDeleteWinner = async (winnerId, raffleId) => {
    if (!window.confirm('Tem certeza que deseja excluir este ganhador?')) return;
    const { error } = await supabase
      .from('raffle_winners')
      .delete()
      .eq('id', winnerId);
    if (!error) {
      setPreviousRaffles(prev =>
        prev
          .map(raffle =>
            raffle.id === raffleId
              ? { ...raffle, raffle_winners: raffle.raffle_winners.filter(w => w.id !== winnerId) }
              : raffle
          )
          .filter(raffle => raffle.raffle_winners.length > 0)
      );
      toast({ title: 'Ganhador excluído!', description: 'O ganhador foi removido com sucesso.', variant: 'success' });
    } else {
      toast({ title: 'Erro ao excluir ganhador', description: error.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    async function fetchPendingRaffles() {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('organizer_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setPendingRaffles(data);
      }
    }
    fetchPendingRaffles();
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Card principal */}
      <Card className="shadow-xl rounded-lg mb-8">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">Sistema de Sorteios</CardTitle>
          <CardDescription>Realize sorteios justos e aleatórios entre os inscritos dos seus eventos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizerEvents.map(event => (
              <div key={event.id} className={`border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow ${selectedEventObj?.id === event.id ? 'border-blue-500 ring-2 ring-blue-200' : ''}`}
                onClick={() => setSelectedEventObj(event)}>
                <div className="font-semibold text-lg mb-1">{event.name}</div>
                <div className="text-sm text-gray-600 mb-1">Data: {new Date(event.start_date).toLocaleDateString('pt-BR')}</div>
                <div className="text-xs text-gray-500 mb-2">ID: {event.id}</div>
                <div className="text-sm font-bold text-orange-600">
                  {loadingRegistrations && selectedEventObj?.id === event.id ? (
                    <span className="animate-spin inline-block h-4 w-4 border-b-2 border-orange-500"></span>
                  ) : (
                    selectedEventObj?.id === event.id ? `${registrations.length} inscritos elegíveis` : ''
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Painel de sorteio do evento selecionado */}
      {selectedEventObj && (
        <Card className="shadow-xl rounded-lg">
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">Sorteios para: {selectedEventObj.name}</CardTitle>
                <CardDescription>Participantes elegíveis: {registrations.length}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="winners">Ganhadores do Sorteio Atual</TabsTrigger>
                <TabsTrigger value="create">Criar Novo Sorteio</TabsTrigger>
              </TabsList>
              {/* Aba 1: Ganhadores do Sorteio Atual */}
              <TabsContent value="winners">
                {eventRaffles.length > 0 ? (
                  <div className="space-y-4">
                    <div className="font-semibold text-lg mb-2">Prêmio: {eventRaffles[0].prize || '—'}</div>
                    <div className="text-sm text-gray-600 mb-2">Data: {new Date(eventRaffles[0].created_at).toLocaleString('pt-BR')}</div>
                    <div className="font-semibold mb-2">Ganhadores:</div>
                    <RaffleWinnersList raffleId={eventRaffles[0].id} />
                  </div>
                ) : (
                  <div className="text-gray-500">Nenhum sorteio realizado para este evento ainda.</div>
                )}
              </TabsContent>
              {/* Aba 3: Criar Novo Sorteio */}
              <TabsContent value="create">
                <Button onClick={() => setIsRaffleDialogOpen(true)} disabled={registrations.length === 0}>
                  <Shuffle className="h-4 w-4 mr-2" /> Criar Novo Sorteio
                </Button>
              </TabsContent>
            </Tabs>
            {/* Lista de inscritos com paginação, loading e erro como antes */}
            <div className="space-y-4 relative">
              {loadingRegistrations && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-lg">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                </div>
              )}
              {fetchError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 z-20 rounded-lg p-6">
                  <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                  <div className="font-semibold text-red-700 mb-1">Erro ao carregar inscrições</div>
                  <div className="text-sm text-red-600 mb-2">{fetchError}</div>
                  <Button variant="destructive" size="sm" onClick={() => fetchEventRegistrations(selectedEventObj.id)}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Tentar novamente
                  </Button>
                </div>
              )}
              {registrations.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum inscrito encontrado para este evento.</p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {paginatedRegistrations.map((reg) => (
                      <motion.div
                        key={reg.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={reg.avatar_url || reg.profile_image_url} />
                            <AvatarFallback>{reg.participant_name?.substring(0, 1) || reg.participant_email?.substring(0, 1) || 'P'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">
                              {reg.participant_name || reg.participant_email || reg.id}
                            </div>
                            {reg.participant_email && (
                              <div className="text-xs text-gray-500">
                                E-mail: {reg.participant_email}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Código: {reg.registration_code || 'N/A'}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleViewParticipant(reg, selectedEventObj.name)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                        Anterior
                      </Button>
                      <span className="text-sm">Página {currentPage} de {totalPages}</span>
                      <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                        Próxima
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sorteios anteriores */}
      {previousRaffles.length > 0 && (
        <Card className="shadow-xl rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">Sorteios Anteriores</CardTitle>
            <CardDescription>Histórico de sorteios realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previousRaffles.map((raffle) => (
                <div key={raffle.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{raffle.events?.name}</h4>
                      <p className="text-sm text-gray-600">
                        {raffle.winners_count} ganhador(es) de {raffle.total_participants} participantes
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(raffle.created_at).toLocaleDateString('pt-BR')} às {new Date(raffle.created_at).toLocaleTimeString('pt-BR')}
                      </p>
                      <div className="text-sm text-blue-700">Prêmio: {raffle.prize || '—'}</div>
                      {/* Exibir ganhadores diretamente no card */}
                      {raffle.raffle_winners && raffle.raffle_winners.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {raffle.raffle_winners.map((winner, idx) => (
                            <div key={winner.id} className="flex items-center justify-between flex-wrap gap-2 bg-gray-50 rounded px-2 py-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                                <span className="font-bold whitespace-nowrap">#{idx + 1}</span>
                                <span className="truncate max-w-xs">{winner.participant_name || '-'}</span>
                                {winner.participant_email && (
                                  <span className="text-gray-500 truncate max-w-xs">({winner.participant_email})</span>
                                )}
                                <span className="text-gray-500 truncate max-w-xs">Código: {winner.registration_code}</span>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteWinner(winner.id, raffle.id)}
                                className="text-red-600 hover:bg-red-100 ml-auto"
                                aria-label="Excluir ganhador"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Concluído
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de sorteio */}
      <Dialog open={isRaffleDialogOpen} onOpenChange={setIsRaffleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shuffle className="h-5 w-5" />
              Criar Sorteio
            </DialogTitle>
            <DialogDescription>
              Configure os parâmetros do sorteio para o evento: <strong>{selectedEventName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="raffle-prize">Prêmio do Sorteio</Label>
              <Input
                id="raffle-prize"
                type="text"
                placeholder="Ex: 1 ingresso VIP, Bolo, Kit de brindes..."
                value={rafflePrize}
                onChange={e => setRafflePrize(e.target.value)}
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Descreva o prêmio que será sorteado.</p>
            </div>
            <div>
              <Label htmlFor="winners-count">Número de Ganhadores</Label>
              <Input
                id="winners-count"
                type="number"
                min="1"
                max={registrations.length}
                value={winnersCount}
                onChange={(e) => setWinnersCount(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo: {registrations.length} participantes disponíveis
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Resumo do Sorteio</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Evento: {selectedEventName}</p>
                <p>• Prêmio: {rafflePrize || '—'}</p>
                <p>• Participantes elegíveis: {registrations.length}</p>
                <p>• Ganhadores a sortear: {winnersCount}</p>
                <p>• Método: Seleção aleatória justa</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRaffleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={createRaffle}
              disabled={loadingRaffle || winnersCount <= 0 || winnersCount > registrations.length || !rafflePrize.trim()}
              className="flex items-center gap-2"
            >
              {loadingRaffle ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Criando...
                </>
              ) : (
                <>Criar Sorteio</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renderizar todos os sorteios pendentes */}
      {pendingRaffles.map(pendingRaffle => (
        <Card key={pendingRaffle.id} className="shadow-xl rounded-lg mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Sorteio Pendente</CardTitle>
            <CardDescription>Prêmio: {pendingRaffle.prize} | Ganhadores: {pendingRaffle.winners_count}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={async () => {
                  setIsRaffleModalOpen(true);
                  setIsDrawing(true);
                  setTimeout(async () => {
                    setLoadingRaffle(true);
                    try {
                      const shuffled = [...registrations].sort(() => 0.5 - Math.random());
                      const winners = shuffled.slice(0, pendingRaffle.winners_count);
                      await supabase
                        .from('raffles')
                        .update({ status: 'completed' })
                        .eq('id', pendingRaffle.id);
                      const winnersData = winners.map(winner => ({
                        raffle_id: pendingRaffle.id,
                        registration_id: winner.id,
                        participant_name: winner.participant_name,
                        participant_email: winner.participant_email,
                        registration_code: winner.registration_code
                      }));
                      const { error } = await supabase.from('raffle_winners').insert(winnersData);
                      if (error) {
                        toast({ title: 'Erro ao salvar ganhadores', description: error.message, variant: 'destructive' });
                      }
                      setDrawnWinners(winnersData);
                      setPendingRaffles(prev => prev.filter(r => r.id !== pendingRaffle.id));
                      fetchPreviousRaffles();
                      toast({ title: 'Sorteio realizado!', description: 'Ganhadores definidos com sucesso.', variant: 'success' });
                    } catch (error) {
                      toast({ title: 'Erro ao realizar sorteio', description: error.message, variant: 'destructive' });
                    } finally {
                      setIsDrawing(false);
                      setLoadingRaffle(false);
                    }
                  }, 5000);
                }}
                disabled={loadingRaffle}
                className="btn-primary text-white"
              >
                {loadingRaffle ? 'Sorteando...' : 'Realizar Sorteio'}
              </Button>
              <Button variant="outline" onClick={() => {
                setEditPrize(pendingRaffle.prize || '');
                setEditWinnersCount(pendingRaffle.winners_count || 1);
                setIsEditRaffleOpen(true);
              }}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
              <Button variant="destructive" onClick={async () => {
                await supabase
                  .from('raffles')
                  .delete()
                  .eq('id', pendingRaffle.id);
                setPendingRaffles(prev => prev.filter(r => r.id !== pendingRaffle.id));
                fetchPreviousRaffles();
                toast({ title: 'Sorteio excluído!', description: 'O sorteio pendente foi removido.', variant: 'success' });
              }}>
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
              <div className="text-sm text-gray-600">Prêmio: {pendingRaffle.prize}</div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Modal de resultados */}
      {raffleResults && (
        <RaffleResults
          winners={raffleResults.winners}
          eventName={raffleResults.eventName}
          onClose={() => setIsResultsDialogOpen(false)}
          onNewRaffle={handleNewRaffle}
        />
      )}

      {/* Modal de detalhes do participante */}
      <ParticipantDetailsModal
        participant={selectedParticipant}
        eventName={selectedEventName}
        isOpen={isParticipantModalOpen}
        onClose={() => setIsParticipantModalOpen(false)}
      />

      {/* Modal de edição do sorteio pendente */}
      <Dialog open={isEditRaffleOpen} onOpenChange={setIsEditRaffleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Sorteio Pendente</DialogTitle>
            <DialogDescription>Altere o prêmio e o número de ganhadores antes de realizar o sorteio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-raffle-prize">Prêmio do Sorteio</Label>
              <Input
                id="edit-raffle-prize"
                type="text"
                placeholder="Ex: 1 ingresso VIP, Bolo, Kit de brindes..."
                value={editPrize}
                onChange={e => setEditPrize(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-winners-count">Número de Ganhadores</Label>
              <Input
                id="edit-winners-count"
                type="number"
                min="1"
                max={registrations.length}
                value={editWinnersCount}
                onChange={e => setEditWinnersCount(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRaffleOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditRaffle}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal animado de sorteio */}
      <Dialog open={isRaffleModalOpen} onOpenChange={setIsRaffleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            {isDrawing ? (
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
                Sorteio em andamento
              </DialogTitle>
            ) : (
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <Sparkles className="h-5 w-5 text-yellow-500 animate-bounce" />
                {drawnWinners.length === 1
                  ? <>Parabéns, <span className="font-bold">{drawnWinners[0].participant_name}</span>!</>
                  : <>Parabéns aos ganhadores!</>
                }
              </DialogTitle>
            )}
          </DialogHeader>
          {isDrawing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <p className="text-lg font-semibold text-blue-700 mb-2">Sorteando...</p>
              <p className="text-gray-500">Aguarde, estamos escolhendo o(s) ganhador(es)!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 relative">
              {/* Confetes ao mostrar o resultado */}
              <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={300} />
              <Sparkles className="h-12 w-12 text-yellow-500 animate-bounce mb-4" />
              <p className="text-lg font-semibold text-green-700 mb-2">Ganhador(es) Sorteado(s)!</p>
              {drawnWinners.map((winner, idx) => (
                <div key={idx} className="text-center mb-2">
                  <span className="font-bold">#{idx + 1}</span> - {winner.participant_name}
                  {winner.participant_email && (
                    <span className="ml-2 text-gray-500">({winner.participant_email})</span>
                  )}
                  <span className="ml-2 text-gray-500">Código: {winner.registration_code}</span>
                </div>
              ))}
              <Button className="mt-4" onClick={() => setIsRaffleModalOpen(false)}>
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Novo componente para listar ganhadores de um sorteio
function RaffleWinnersList({ raffleId }) {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchWinners() {
      setLoading(true);
      const { data, error } = await supabase
        .from('raffle_winners')
        .select('id, participant_name, participant_email, registration_code')
        .eq('raffle_id', raffleId);
      if (!error && data) {
        setWinners(data);
      }
      setLoading(false);
    }
    fetchWinners();
  }, [raffleId]);
  if (loading) return <div>Carregando ganhadores...</div>;
  if (winners.length === 0) return <div>Nenhum ganhador registrado.</div>;
  return (
    <ul className="space-y-2">
      {winners.map((winner, idx) => (
        <li key={winner.id} className="border rounded p-2 flex items-center gap-2">
          <span className="font-bold">#{idx + 1}</span>
          <span>{winner.participant_name || winner.participant_email || winner.id}</span>
          {winner.participant_email && (
            <span className="text-xs text-gray-500 ml-2">E-mail: {winner.participant_email}</span>
          )}
          <span className="text-xs text-gray-500 ml-2">Código: {winner.registration_code || 'N/A'}</span>
        </li>
      ))}
    </ul>
  );
}

export default OrganizerGiveaways;