import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge, Award } from 'lucide-react';
import { generateCertificatePdf, generateBadgePdf } from '@/lib/pdfGenerator';

const CertificateGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    const fetchOrgEvents = async () => {
      if (!user) return;
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from('events')
        .select('id, name, date')
        .eq('organizer_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching organizer events', error);
        toast({ title: "Erro", description: "Não foi possível carregar seus eventos." });
      } else {
        setOrganizerEvents(data);
      }
      setLoadingEvents(false);
    };
    fetchOrgEvents();
  }, [user, toast]);

  const handleEventSelect = async (eventId) => {
    if (!eventId) {
      setSelectedEvent(null);
      setParticipants([]);
      return;
    }
    setLoadingParticipants(true);
    const eventDetails = organizerEvents.find(e => e.id === eventId);
    setSelectedEvent(eventDetails);

    const { data: registrationData, error: registrationError } = await supabase
      .from('registrations')
      .select('user_id')
      .eq('event_id', eventId);

    if (registrationError) {
      console.error('Error fetching registrations', registrationError);
      toast({ title: "Erro", description: "Não foi possível carregar os inscritos." });
      setLoadingParticipants(false);
      return;
    }

    const userIds = registrationData.map(r => r.user_id);
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) {
        toast({ title: "Erro", description: "Não foi possível carregar os dados dos inscritos." });
      } else {
        setParticipants(usersData);
      }
    } else {
      setParticipants([]);
    }
    setLoadingParticipants(false);
  };

  const currentEventWithDetails = selectedEvent ? {
    ...selectedEvent,
    organizer: user,
  } : null;

  return (
    <Card className="shadow-lg rounded-xl mt-4">
      <CardHeader>
        <CardTitle>Gerador de Certificados e Crachás</CardTitle>
        <CardDescription>Selecione um evento para ver os participantes e gerar seus materiais.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="event-select">Selecione o Evento</Label>
          <Select onValueChange={handleEventSelect} disabled={loadingEvents}>
            <SelectTrigger id="event-select" className="w-full md:w-1/2">
              <SelectValue placeholder={loadingEvents ? "Carregando eventos..." : "Escolha um evento"} />
            </SelectTrigger>
            <SelectContent>
              {organizerEvents.map(event => (
                <SelectItem key={event.id} value={event.id}>{event.name} - {new Date(event.date).toLocaleDateString('pt-BR')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEvent && (
          <div>
            <h3 className="font-semibold text-lg mb-4">Inscritos em "{selectedEvent.name}"</h3>
            {loadingParticipants ? (
              <p>Carregando inscritos...</p>
            ) : participants.length > 0 ? (
              <ul className="space-y-3">
                {participants.map(participant => (
                  <li key={participant.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-md border">
                    <div>
                      <p className="font-semibold">{participant.name}</p>
                      <p className="text-sm text-gray-500">{participant.email}</p>
                    </div>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <Button size="sm" variant="outline" onClick={() => generateCertificatePdf(participant, currentEventWithDetails)}><Award className="h-4 w-4 mr-2" />Certificado</Button>
                      <Button size="sm" variant="outline" onClick={() => generateBadgePdf(participant, currentEventWithDetails)}><Badge className="h-4 w-4 mr-2" />Crachá</Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Nenhum inscrito encontrado para este evento.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificateGenerator;