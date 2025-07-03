import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/contexts/ProfileContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

const ParticipantPrizes = () => {
  const { profile } = useProfile();
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrizes() {
      if (!profile) return;
      setLoading(true);
      // Busca por e-mail do participante
      const { data, error } = await supabase
        .from('raffle_winners')
        .select(`id, participant_name, participant_email, registration_code, created_at, raffles(prize, created_at, events(name))`)
        .or(`participant_email.eq.${profile.email},participant_name.eq.${profile.name}`);
      if (!error && data) {
        setPrizes(data);
      }
      setLoading(false);
    }
    fetchPrizes();
  }, [profile]);

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Carregando seus prêmios...</div>;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Meus Prêmios
        </CardTitle>
        <CardDescription>Veja aqui todos os sorteios que você ganhou!</CardDescription>
      </CardHeader>
      <CardContent>
        {prizes.length === 0 ? (
          <div className="text-gray-500">Você ainda não foi sorteado em nenhum evento.</div>
        ) : (
          <ul className="space-y-4">
            {prizes.map(prize => (
              <li key={prize.id} className="border rounded-lg p-4 bg-yellow-50 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1">
                  <div className="font-bold text-lg text-yellow-800">{prize.raffles?.events?.name || 'Evento'}</div>
                  <div className="text-sm text-gray-700">Prêmio: <span className="font-semibold">{prize.raffles?.prize || '-'}</span></div>
                  <div className="text-xs text-gray-500">Data do sorteio: {prize.raffles?.created_at ? new Date(prize.raffles.created_at).toLocaleDateString('pt-BR') : '-'}</div>
                  <div className="text-xs text-gray-500">Código: {prize.registration_code}</div>
                  <div className="text-xs text-gray-500">E-mail: {prize.participant_email}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ParticipantPrizes; 