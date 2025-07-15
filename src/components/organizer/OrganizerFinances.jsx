import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, CheckCircle, AlertTriangle, CreditCard, Receipt, TrendingUp, Pocket, Ticket, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const FinanceSummaryCard = ({ title, value, icon, color }) => (
  <Card className="shadow-lg border-l-4" style={{ borderLeftColor: color }}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const OrganizerFinances = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [ticketSales, setTicketSales] = useState([]); // vendas de ingressos
  const [summary, setSummary] = useState({ totalFees: 0, paidFees: 0, pendingFees: 0, totalRevenue: 0 });
  const [revenueStands, setRevenueStands] = useState(0); // Receita de stands
  const [standsSales, setStandsSales] = useState([]); // Detalhe das vendas de stands
  const [pendingStandPayments, setPendingStandPayments] = useState([]); // Pagamentos pendentes de stands
  const [standsSummary, setStandsSummary] = useState({
    total_stands_sold: 0,
    total_revenue: 0,
    pending_stands: 0,
    pending_amount: 0,
    available_stands: 0
  }); // Resumo de stands
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(value || 0);
  };
  
  const parseCurrency = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || !value) return 0;
    const cleaned = String(value).replace(/[R$\s]/g, '');
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');
    let numberString;
    if (hasComma && (!hasDot || cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.'))) {
      numberString = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      numberString = cleaned.replace(/,/g, '');
    }
    const number = parseFloat(numberString);
    return isNaN(number) ? 0 : number;
  };

  const fetchFinances = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Buscar taxas de serviço (extrato)
      const { data: feesData, error: feesError } = await supabase
        .rpc('get_organizer_service_fees', { p_organizer_id: user.id });
      if (feesError) throw feesError;
      const currentFees = feesData || [];
      setFees(currentFees);
      // Buscar vendas de ingressos (ticket sales)
      const { data: ticketSalesData, error: ticketSalesError } = await supabase
        .rpc('get_organizer_ticket_sales', { organizer_uuid: user.id });
      if (ticketSalesError) throw ticketSalesError;
      setTicketSales(ticketSalesData || []);
      // Calcular receita total de vendas de ingressos
      const totalRevenue = (ticketSalesData || []).reduce((acc, venda) => acc + parseFloat(venda.price || 0), 0);
      const totalFees = currentFees.reduce((acc, fee) => acc + parseFloat(fee.fee_amount), 0);
      // Soma apenas das taxas pendentes
      const pendingFees = currentFees.filter(f => f.status === 'pending').reduce((acc, fee) => acc + parseFloat(fee.fee_amount), 0);
      const paidFees = currentFees.filter(f => f.status === 'paid').reduce((acc, fee) => acc + parseFloat(fee.fee_amount), 0);
      setSummary({ totalFees, paidFees, pendingFees, totalRevenue });
      // Buscar eventos do organizador
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', user.id);
      if (eventsError) throw eventsError;
      const eventIds = (eventsData || []).map(e => e.id);
      console.log('Eventos do organizador encontrados:', eventIds);
      
      // Buscar stands vendidos usando RPC
      let standsData = [];
      let standsRevenue = 0;
      
      try {
        // Buscar dados de stands vendidos via RPC
        const { data: standsSalesData, error: standsSalesError } = await supabase
          .rpc('get_organizer_stand_sales', { p_organizer_id: user.id });
          
        if (standsSalesError) {
          console.error('Erro ao buscar vendas de stands:', standsSalesError);
        } else {
          standsData = standsSalesData || [];
          standsRevenue = standsData.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
          console.log('Stands vendidos encontrados:', standsData);
          console.log('Receita total de stands:', standsRevenue);
        }
        
        // Buscar resumo de stands via RPC
        const { data: standsSummaryData, error: standsSummaryError } = await supabase
          .rpc('get_organizer_stands_summary', { p_organizer_id: user.id });
          
        if (standsSummaryError) {
          console.error('Erro ao buscar resumo de stands:', standsSummaryError);
        } else {
          console.log('Resumo de stands:', standsSummaryData);
          if (standsSummaryData && standsSummaryData.length > 0) {
            setStandsSummary(standsSummaryData[0]);
          }
        }
      } catch (err) {
        console.error('Erro geral ao buscar dados de stands:', err);
      }
      
      setRevenueStands(standsRevenue);
      setStandsSales(standsData);
      
      // Debug: Verificar se há stands pagos no geral
      try {
        const { data: allPaidStands, error: allPaidError } = await supabase
          .from('stand_payments')
          .select(`
            id,
            amount,
            status,
            event_stands!inner(name, event_id),
            events!inner(name, organizer_id)
          `)
          .eq('status', 'pago')
          .limit(5);
          
        if (allPaidError) {
          console.error('Erro ao buscar todos os stands pagos:', allPaidError);
        } else {
          console.log('Todos os stands pagos (primeiros 5):', allPaidStands);
        }
      } catch (err) {
        console.error('Erro ao buscar todos os stands pagos:', err);
      }
      
      // Buscar pagamentos pendentes de stands dos eventos do organizador
      let pendingPayments = [];
      
      if (eventIds.length > 0) {
        try {
          const { data: paymentsData, error: paymentsError } = await supabase
            .from('stand_payments')
            .select(`
              *,
              event_stands!inner(name, price, event_id),
              events!inner(name),
              users(name, email)
            `)
            .in('status', ['pending', 'em_analise'])
            .in('event_stands.event_id', eventIds);
            
          if (paymentsError) {
            console.error('Erro ao buscar pagamentos pendentes:', paymentsError);
          } else {
            pendingPayments = paymentsData || [];
            console.log('Pagamentos pendentes encontrados:', pendingPayments);
          }
        } catch (err) {
          console.error('Erro geral ao buscar pagamentos pendentes:', err);
        }
      }
      setPendingStandPayments(pendingPayments);
    } catch (error) {
      toast({ title: 'Erro ao carregar finanças', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchFinances();
  }, [fetchFinances]);

  const handlePayNow = () => {
    navigate('/organizer/dashboard/manual-payment', { state: { pendingAmount: summary.pendingFees } });
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      // Primeiro, buscar o stand_id do pagamento
      const { data: paymentData, error: fetchError } = await supabase
        .from('stand_payments')
        .select('stand_id')
        .eq('id', paymentId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Atualizar o status do pagamento para 'pago'
      const { error: paymentError } = await supabase
        .from('stand_payments')
        .update({ status: 'pago' })
        .eq('id', paymentId);
        
      if (paymentError) throw paymentError;
      
      // Atualizar o status do stand para 'vendido'
      const { error: standError } = await supabase
        .from('event_stands')
        .update({ 
          status: 'vendido',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentData.stand_id);
        
      if (standError) throw standError;
      
      toast({ 
        title: 'Pagamento aprovado', 
        description: 'O pagamento foi aprovado e o stand foi marcado como vendido.', 
        variant: 'success' 
      });
      
      // Recarregar dados
      fetchFinances();
    } catch (error) {
      toast({ 
        title: 'Erro ao aprovar pagamento', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const handleRejectPayment = async (paymentId) => {
    try {
      // Primeiro, buscar o stand_id do pagamento
      const { data: paymentData, error: fetchError } = await supabase
        .from('stand_payments')
        .select('stand_id')
        .eq('id', paymentId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Atualizar o status do pagamento para 'rejeitado'
      const { error: paymentError } = await supabase
        .from('stand_payments')
        .update({ status: 'rejeitado' })
        .eq('id', paymentId);
        
      if (paymentError) throw paymentError;
      
      // Atualizar o status do stand para 'disponivel' (liberar o stand)
      const { error: standError } = await supabase
        .from('event_stands')
        .update({ 
          status: 'disponivel',
          user_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentData.stand_id);
        
      if (standError) throw standError;
      
      toast({ 
        title: 'Pagamento rejeitado', 
        description: 'O pagamento foi rejeitado e o stand foi liberado.', 
        variant: 'default' 
      });
      
      // Recarregar dados
      fetchFinances();
    } catch (error) {
      toast({ 
        title: 'Erro ao rejeitar pagamento', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning'; // badge amarelo/laranja
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-16 w-16 animate-spin text-orange-500" />
      </div>
    );
  }

  // Receita bruta: vendas de ingressos + stands pagos
  const totalGrossRevenue = summary.totalRevenue + revenueStands;
  // Lucro líquido: receita bruta - taxas
  const netProfit = totalGrossRevenue - summary.totalFees;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="space-y-6">
        {/* Primeira linha - Métricas principais */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FinanceSummaryCard title="Receita Bruta" value={formatCurrency(totalGrossRevenue)} icon={<TrendingUp className="h-5 w-5 text-blue-500" />} color="#3b82f6" />
          <FinanceSummaryCard title="Taxas da Plataforma" value={formatCurrency(summary.totalFees)} icon={<Receipt className="h-5 w-5 text-gray-500" />} color="#6b7280" />
          <FinanceSummaryCard title="Lucro Líquido" value={formatCurrency(netProfit)} icon={<Pocket className="h-5 w-5 text-green-500" />} color="#22c55e" />
        </div>
        
        {/* Segunda linha - Métricas de stands e pendências */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FinanceSummaryCard title="Saldo a Pagar" value={formatCurrency(summary.pendingFees)} icon={<AlertTriangle className="h-5 w-5 text-red-500" />} color="#ef4444" />
          <FinanceSummaryCard title="Receita com Stands" value={formatCurrency(revenueStands)} icon={<DollarSign className="h-5 w-5 text-orange-500" />} color="#f59e42" />
          <FinanceSummaryCard title="Stands Vendidos" value={`${standsSummary.total_stands_sold}`} icon={<CheckCircle className="h-5 w-5 text-green-500" />} color="#22c55e" />
        </div>
      </div>

      {summary.pendingFees > 0 && (
          <Card className="bg-yellow-50 border-yellow-400 shadow-md">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-lg text-yellow-800">Pagamento Pendente</h3>
                    <p className="text-yellow-700">Você tem um saldo de {formatCurrency(summary.pendingFees)} a pagar em taxas de serviço.</p>
                </div>
                <Button onClick={handlePayNow} className="bg-yellow-500 hover:bg-yellow-600 text-white shrink-0">
                    <CreditCard className="mr-2 h-4 w-4" /> Pagar Agora
                </Button>
            </CardContent>
          </Card>
      )}

      {/* Tabela de vendas de ingressos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Ticket className="h-6 w-6" />
            <div>
              <CardTitle>Vendas de Ingressos</CardTitle>
              <CardDescription>Detalhes de todas as vendas de ingressos para seus eventos.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">Nenhuma venda de ingresso registrada.</TableCell>
                </TableRow>
              ) : (
                ticketSales.map(venda => (
                  <TableRow key={venda.registration_id}>
                    <TableCell>{venda.event_name}</TableCell>
                    <TableCell>{venda.user_name} ({venda.user_email})</TableCell>
                    <TableCell>{formatCurrency(venda.price)}</TableCell>
                    <TableCell>{new Date(venda.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Extrato de Taxas de Serviço */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Receipt className="h-6 w-6" />
            <div>
              <CardTitle>Extrato de Taxas de Serviço</CardTitle>
              <CardDescription>Veja o detalhamento de todas as taxas cobradas.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead>Valor da Taxa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">Nenhuma taxa registrada.</TableCell>
                </TableRow>
              ) : (
                fees.map(fee => (
                  <TableRow key={fee.created_at + fee.event_name + fee.participant_email}>
                    <TableCell>{fee.event_name}</TableCell>
                    <TableCell>{fee.participant_name} ({fee.participant_email})</TableCell>
                    <TableCell>{formatCurrency(fee.fee_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(fee.status)}>{fee.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(fee.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tabela de vendas de stands */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6" />
            <div>
              <CardTitle>Vendas de Stands</CardTitle>
              <CardDescription>Detalhes de todas as vendas de stands para seus eventos.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Stand</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead className="text-right">Valor Pago</TableHead>
                <TableHead>Data do Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standsSales.length > 0 ? (
                standsSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.event_name || '-'}</TableCell>
                    <TableCell>{sale.stand_name || '-'}</TableCell>
                    <TableCell>{sale.user_name || sale.user_email || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(sale.amount)}</TableCell>
                    <TableCell>{sale.created_at ? new Date(sale.created_at).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhuma venda de stand registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagamentos Pendentes de Stands */}
      {pendingStandPayments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <div>
                <CardTitle>Pagamentos Pendentes de Stands</CardTitle>
                <CardDescription>Stands com pagamentos aguardando confirmação ou análise.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Stand</TableHead>
                  <TableHead>Participante</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingStandPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.events?.name || '-'}
                    </TableCell>
                    <TableCell>{payment.event_stands?.name || '-'}</TableCell>
                    <TableCell>
                      {payment.users?.name || payment.users?.email || '-'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'em_analise' ? 'default' : 'secondary'}>
                        {payment.status === 'em_analise' ? 'Em Análise' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {payment.payment_receipt_url && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(payment.payment_receipt_url, '_blank')}
                          >
                            Ver Comprovante
                          </Button>
                        )}
                        {payment.status === 'em_analise' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprovePayment(payment.id)}
                            >
                              Aprovar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRejectPayment(payment.id)}
                            >
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default OrganizerFinances;