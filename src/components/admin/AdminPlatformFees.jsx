import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminFinancialSummary from './AdminFinancialSummary';
import { Button } from '@/components/ui/button';

const AdminPlatformFees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [generatingFeeId, setGeneratingFeeId] = useState(null);
  const { toast } = useToast();

  // Buscar taxas existentes
  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_fees')
        .select(`
          id,
          fee_amount,
          status,
          created_at,
          organizer:organizer_id (name),
          event:event_id (name),
          plan:plan_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFees(data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar taxas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Buscar todos os eventos
  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, organizer_id, organizer:organizer_id (name)');
      if (error) throw error;
      setEvents(data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar eventos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setEventsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFees();
    fetchEvents();
  }, [fetchFees, fetchEvents]);

  // Eventos sem taxa de serviço
  const eventsWithFee = new Set(fees.map(fee => fee.event?.id));
  const eventsWithoutFee = events.filter(ev => !eventsWithFee.has(ev.id));

  // Gerar taxa manualmente para todas inscrições confirmadas do evento
  const handleGenerateFee = async (event) => {
    setGeneratingFeeId(event.id);
    try {
      // Buscar inscrições confirmadas
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', event.id)
        .eq('status', 'confirmed');
      if (regError) throw regError;
      if (!registrations || registrations.length === 0) {
        toast({ title: 'Nenhuma inscrição confirmada', description: 'Não há inscrições confirmadas para este evento.', variant: 'default' });
        setGeneratingFeeId(null);
        return;
      }
      // Buscar plano do evento
      let plan = null;
      if (event.ad_plan_id) {
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('*')
          .eq('id', event.ad_plan_id)
          .single();
        if (planError) throw planError;
        plan = planData;
      }
      const feePercent = plan?.fee_percent ? parseFloat(plan.fee_percent) : 0;
      const feeFixed = plan?.fee_fixed ? parseFloat(plan.fee_fixed) : 0;
      const price = event.price ? parseFloat(event.price) : 0;
      const feeAmount = price * (feePercent / 100) + feeFixed;
      if (feeAmount <= 0) {
        toast({ title: 'Taxa não gerada', description: 'O valor da taxa para este evento é zero.', variant: 'default' });
        setGeneratingFeeId(null);
        return;
      }
      // Gerar taxa para cada inscrição confirmada
      const inserts = registrations.map(reg => ({
        event_id: event.id,
        organizer_id: event.organizer_id,
        user_id: reg.user_id,
        plan_id: plan?.id || null,
        fee_amount: Number(feeAmount),
        status: 'pending',
        created_at: new Date().toISOString(),
      }));
      const { error: feeError } = await supabase
        .from('platform_fees')
        .insert(inserts);
      if (feeError) throw feeError;
      toast({ title: 'Taxa(s) gerada(s)', description: 'Taxa de serviço gerada para todas as inscrições confirmadas.', variant: 'success' });
      fetchFees();
    } catch (error) {
      toast({ title: 'Erro ao gerar taxa', description: error.message, variant: 'destructive' });
    } finally {
      setGeneratingFeeId(null);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-16 w-16 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <AdminFinancialSummary />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
             <Receipt className="h-6 w-6" />
            <div>
                <CardTitle>Histórico de Taxas da Plataforma</CardTitle>
                <CardDescription>
                Visualize todas as taxas de serviço geradas por inscrições em eventos.
                </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organizador</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.length > 0 ? (
                fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.organizer?.name || 'N/A'}</TableCell>
                    <TableCell>{fee.event?.name || 'N/A'}</TableCell>
                    <TableCell>{fee.plan?.name || 'Gratuito'}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(fee.fee_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(fee.status)}>{fee.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(fee.created_at)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Nenhuma taxa encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Eventos sem taxa de serviço</CardTitle>
          <CardDescription>Estes eventos ainda não possuem taxa de serviço gerada. Clique para gerar manualmente.</CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : eventsWithoutFee.length === 0 ? (
            <div className="text-center text-gray-500 py-8">Todos os eventos já possuem taxa de serviço gerada.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Organizador</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsWithoutFee.map(event => (
                  <TableRow key={event.id}>
                    <TableCell>{event.name}</TableCell>
                    <TableCell>{event.organizer?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Button onClick={() => handleGenerateFee(event)} disabled={generatingFeeId === event.id}>
                        {generatingFeeId === event.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Gerar taxa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminPlatformFees;