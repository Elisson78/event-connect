import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useEvents } from '@/contexts/EventContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, CreditCard, Landmark, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

const PaymentPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { events, loadingEvents, createRegistration, isUserRegistered } = useEvents();
  const { profile, loading: profileLoading } = useProfile();

  const [event, setEvent] = useState(null);
  const [organizerMethods, setOrganizerMethods] = useState([]);
  const [platformMethods, setPlatformMethods] = useState([]);
  const [loadingPaymentOptions, setLoadingPaymentOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const currentEvent = events.find(e => e.id === eventId);
    if (currentEvent) {
      setEvent(currentEvent);
    }
  }, [eventId, events]);

  const fetchPaymentOptions = useCallback(async (organizerId) => {
    setLoadingPaymentOptions(true);
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizer_payment_methods')
        .select('*')
        .eq('organizer_id', organizerId)
        .eq('is_active', true);

      if (orgError) throw orgError;
      setOrganizerMethods(orgData);

      const { data: platData, error: platError } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('is_manual', false)
        .eq('is_enabled', true);

      if (platError) throw platError;
      setPlatformMethods(platData);
    } catch (error) {
      toast({ title: 'Erro ao carregar opções de pagamento', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingPaymentOptions(false);
    }
  }, [toast]);

  useEffect(() => {
    if (event?.organizer_id) {
      fetchPaymentOptions(event.organizer_id);
    }
  }, [event, fetchPaymentOptions]);
  
  const handleManualPayment = async () => {
    setIsSubmitting(true);
    try {
      const newRegistration = await createRegistration(event.id, profile.id, 'pending_payment');
      // Geração da taxa de serviço para o organizador
      if (newRegistration) {
        // Buscar evento
        const { data: eventData } = await supabase
          .from('events')
          .select('*')
          .eq('id', event.id)
          .single();
        
        // Calcular taxa fixa por faixa de preço
        const price = eventData.price ? parseFloat(eventData.price) : 0;
        let feeAmount = 0;
        if (price === 0) {
          feeAmount = 0;
        } else if (price > 0 && price <= 50) {
          feeAmount = 0.50;
        } else if (price > 50 && price <= 100) {
          feeAmount = 0.60;
        } else if (price > 100 && price <= 500) {
          feeAmount = 0.65;
        }
        
        // Verifica se já existe taxa na tabela organizer_taxa
        try {
          const { data: existingFee, error: existingFeeError } = await supabase
            .from('organizer_taxa')
          .select('id')
          .eq('event_id', event.id)
            .eq('organizer_id', eventData.organizer_id)
            .eq('registration_id', newRegistration.id)
          .eq('user_id', profile.id)
          .single();
          
          // Se não encontrou taxa (erro PGRST116 = no rows found) e valor > 0
          if (existingFeeError && existingFeeError.code === 'PGRST116' && feeAmount > 0) {
            const { error: feeError } = await supabase.from('organizer_taxa').insert({
            event_id: event.id,
            organizer_id: eventData.organizer_id,
              registration_id: newRegistration.id,
            user_id: profile.id,
            fee_amount: Number(feeAmount),
            status: 'pending',
            created_at: new Date().toISOString(),
              description: `Taxa gerada automaticamente para evento pago (faixa: ${price})`
            });
            if (feeError) {
              console.error('Erro ao inserir taxa:', feeError);
            } else {
              console.log('Taxa registrada com sucesso:', feeAmount);
            }
          } else if (existingFeeError && existingFeeError.code !== 'PGRST116') {
            console.error('Erro ao verificar taxa existente:', existingFeeError);
          } else if (existingFee) {
            console.log('Taxa já existente para este usuário');
          }
        } catch (error) {
          console.error('Erro geral ao processar taxa:', error);
        }
      }
      toast({
        title: "Inscrição pré-realizada!",
        description: "Agora, envie o comprovante de pagamento na área 'Meus Eventos' para confirmar sua vaga.",
      });
      navigate('/participant/dashboard/my-events');
    } catch (error) {
      toast({
        title: "Erro ao iniciar inscrição",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCardPayment = () => {
    toast({
      title: 'Pagamento com cartão em breve!',
      description: 'Esta funcionalidade está sendo finalizada e estará disponível em breve. Por favor, utilize o pagamento manual.',
      variant: 'default',
      duration: 5000,
    });
  }

  if (loadingEvents || profileLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-orange-500" /></div>;
  }
  
  if (!event) {
    return (
        <div className="min-h-screen bg-gray-50 text-center py-20">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Evento não encontrado</h1>
            <Link to="/events"><Button>Voltar aos eventos</Button></Link>
        </div>
    );
  }

  if (isUserRegistered(event.id, profile?.id)) {
     return (
        <div className="min-h-screen bg-gray-50 text-center py-20">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Você já está inscrito neste evento.</h1>
            <Link to="/participant/dashboard/my-events"><Button>Ver minhas inscrições</Button></Link>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto max-w-4xl p-4 md:p-8"
      >
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Checkout</CardTitle>
                <CardDescription>Escolha sua forma de pagamento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingPaymentOptions ? <Loader2 className="animate-spin"/> : (
                  <div className="space-y-4">
                    {platformMethods.map(method => (
                      <Button key={method.id} className="w-full h-16 text-lg justify-start p-4" onClick={handleCardPayment} disabled={isSubmitting}>
                        <CreditCard className="mr-4 h-6 w-6"/> {method.label}
                      </Button>
                    ))}
                    {organizerMethods.map(method => (
                      <div key={method.id} className="border rounded-lg p-4 space-y-3">
                          <h3 className="font-semibold flex items-center gap-2"><Landmark /> Pagamento Manual ({method.method_type})</h3>
                          <div className="text-sm bg-gray-50 p-3 rounded-md space-y-1">
                              {Object.entries(method.details).map(([key, value]) => (
                                <p key={key}><strong>{key}:</strong> {value}</p>
                              ))}
                          </div>
                          <p className="text-xs text-gray-600 flex items-start gap-2"><AlertCircle className="h-4 w-4 mt-0.5 text-orange-500 flex-shrink-0"/>Após o pagamento, clique no botão abaixo para iniciar a confirmação e garantir sua vaga. Você precisará enviar o comprovante.</p>
                          <Button className="w-full" onClick={handleManualPayment} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : null}
                            Já paguei, quero enviar o comprovante
                          </Button>
                      </div>
                    ))}
                  </div>
                )}
                {(organizerMethods.length === 0 && platformMethods.length === 0 && !loadingPaymentOptions) && (
                    <p className="text-center text-gray-500">Nenhuma opção de pagamento configurada para este evento.</p>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <img  class="h-16 w-16 rounded-md object-cover" alt="Event thumbnail" src="https://images.unsplash.com/photo-1691257790470-b5e4e80ca59f" />
                    <div>
                        <h4 className="font-semibold">{event.name}</h4>
                        <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
                <div className="border-t pt-4 flex justify-between items-center text-lg">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-orange-600">{event.price}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentPage;