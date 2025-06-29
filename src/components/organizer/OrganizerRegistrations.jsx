import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Eye, Mail, Phone, MapPin, CalendarDays, Ticket, Search, Filter, Download, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const ParticipantDetailsModal = ({ participant, eventName, isOpen, onClose }) => {
  if (!participant) return null;

  const getInitials = (name) => {
    if (!name) return 'P';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="p-6 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-slate-500">
              <AvatarImage src={participant.avatar_url || participant.profile_image_url} alt={participant.name} />
              <AvatarFallback className="text-2xl bg-slate-600">{getInitials(participant.name)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl font-bold">{participant.name}</DialogTitle>
              <DialogDescription className="text-slate-300">Inscrito em: {eventName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="flex items-center text-gray-700">
            <Ticket className="h-5 w-5 mr-3 text-yellow-600" />
            <span>Código da Sorte: <span className="font-bold">{participant.participant_code || 'N/A'}</span></span>
          </div>
          <div className="flex items-center text-gray-700">
            <Mail className="h-5 w-5 mr-3 text-orange-500" />
            <span>{participant.email}</span>
          </div>
          {participant.phone && (
            <div className="flex items-center text-gray-700">
              <Phone className="h-5 w-5 mr-3 text-orange-500" />
              <span>{participant.phone}</span>
            </div>
          )}
          {participant.address && (
            <div className="flex items-center text-gray-700">
              <MapPin className="h-5 w-5 mr-3 text-orange-500" />
              <span>{participant.address}</span>
            </div>
          )}
          <div className="flex items-center text-gray-700">
            <CalendarDays className="h-5 w-5 mr-3 text-orange-500" />
            <span>Membro desde: {new Date(participant.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const OrganizerRegistrations = () => {
  const { user } = useAuth();
  const { events, loadingEvents, refetchEvents } = useEvents();
  const [registrationsWithDetails, setRegistrationsWithDetails] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedEventName, setSelectedEventName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEventId, setFilterEventId] = useState('');
  const { toast } = useToast();

  const fetchOrganizerRegistrations = useCallback(async () => {
    if (!user?.id || !events.length) {
      setLoadingRegistrations(false);
      setRegistrationsWithDetails([]);
      return;
    }
    setLoadingRegistrations(true);
    setNetworkError(false);
    try {
      const organizerEventIds = events.filter(e => e.organizer_id === user.id).map(e => e.id);
      if (organizerEventIds.length === 0) {
        setRegistrationsWithDetails([]);
        setLoadingRegistrations(false);
        return;
      }

      const { data: regs, error: regsError } = await supabase
        .from('registrations')
        .select('*, users(*), events(name)')
        .in('event_id', organizerEventIds);

      if (regsError) throw regsError;
      
      const detailedRegs = regs.map(reg => ({
        ...reg,
        participant: reg.users,
        event: reg.events,
      })).filter(reg => reg.participant && reg.event); 

      setRegistrationsWithDetails(detailedRegs);
    } catch (error) {
      console.error("Error fetching organizer registrations:", error);
      if (error.message?.includes('Failed to fetch')) {
        setNetworkError(true);
        toast({ title: "Erro de Conexão", description: "Não foi possível buscar as inscrições. Verifique sua conexão e tente novamente.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao buscar inscrições", description: error.message, variant: "destructive" });
      }
      setRegistrationsWithDetails([]);
    } finally {
      setLoadingRegistrations(false);
    }
  }, [user, events, toast]);

  useEffect(() => {
    if (user) {
      refetchEvents(); 
    }
  }, [user, refetchEvents]);

  useEffect(() => {
    if (!loadingEvents) { 
      fetchOrganizerRegistrations();
    }
  }, [loadingEvents, fetchOrganizerRegistrations]);

  const handleViewDetails = (participant, eventName) => {
    setSelectedParticipant(participant);
    setSelectedEventName(eventName);
    setIsModalOpen(true);
  };

  const handleExportData = () => {
     toast({
      title: "🚧 Funcionalidade em Breve!",
      description: "A exportação de dados será implementada em breve. Obrigado pela sua paciência!",
    });
  };

  const filteredRegistrations = registrationsWithDetails.filter(reg => {
    const participantName = reg.participant?.name?.toLowerCase() || '';
    const eventName = reg.event?.name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = participantName.includes(search) || eventName.includes(search);
    const matchesEventFilter = filterEventId ? reg.event_id === filterEventId : true;
    
    return matchesSearch && matchesEventFilter;
  });

  const organizerEventsList = events.filter(event => event.organizer_id === user?.id);

  if (loadingEvents || loadingRegistrations) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (networkError) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">Falha na Conexão</h3>
          <p className="text-gray-600 my-2">Não foi possível carregar os dados das inscrições.</p>
          <p className="text-gray-500 text-sm mb-6">Por favor, verifique sua conexão com a internet.</p>
          <Button onClick={fetchOrganizerRegistrations} variant="destructive">
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="shadow-xl rounded-lg">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">Inscritos nos Seus Eventos</CardTitle>
              <CardDescription>Visualize e gerencie os participantes dos seus eventos.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={handleExportData} className="text-green-600 border-green-600 hover:bg-green-50">
                    <Download className="h-4 w-4 mr-2" /> Exportar
                </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Buscar por nome ou evento..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="relative min-w-[200px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                    value={filterEventId}
                    onChange={(e) => setFilterEventId(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <option value="">Todos os Eventos</option>
                    {organizerEventsList.map(event => (
                        <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-20 w-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Nenhum inscrito encontrado.</p>
              <p className="text-gray-500 text-sm">
                {searchTerm || filterEventId ? "Tente ajustar seus filtros ou termos de busca." : "Quando participantes se inscreverem, eles aparecerão aqui."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participante</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Inscrição</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredRegistrations.map((reg) => (
                      <motion.tr 
                        key={reg.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={reg.participant?.avatar_url || reg.participant?.profile_image_url} alt={reg.participant?.name} />
                              <AvatarFallback>{reg.participant?.name?.substring(0,1) || 'P'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{reg.participant?.name}</div>
                              <div className="text-xs text-gray-500">{reg.participant?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{reg.event?.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-700">{reg.participant?.participant_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{new Date(reg.registered_at).toLocaleDateString('pt-BR')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(reg.participant, reg.event?.name)} className="text-blue-600 hover:text-blue-800">
                            <Eye className="h-5 w-5 mr-1" /> Visualizar
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <ParticipantDetailsModal 
        participant={selectedParticipant} 
        eventName={selectedEventName}
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </motion.div>
  );
};

export default OrganizerRegistrations;