import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, CheckCircle, AlertTriangle, CreditCard, Receipt, TrendingUp, Pocket, Ticket } from 'lucide-react';
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
      // Buscar stands vendidos/pagos desses eventos
      let standsData = [];
      if (eventIds.length > 0) {
        const { data, error } = await supabase
          .from('event_stands')
          .select('id, price, status, payment_status, name, event_id, reserved_by, payment_date, events(name), users(name, email)')
          .in('event_id', eventIds)
          .eq('status', 'vendido')
          .eq('payment_status', 'pago');
        if (error) throw error;
        standsData = data || [];
      }
      const standsRevenue = standsData.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
      setRevenueStands(standsRevenue);
      setStandsSales(standsData);
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <FinanceSummaryCard title="Receita Bruta" value={formatCurrency(totalGrossRevenue)} icon={<TrendingUp className="h-5 w-5 text-blue-500" />} color="#3b82f6" />
        <FinanceSummaryCard title="Taxas da Plataforma" value={formatCurrency(summary.totalFees)} icon={<Receipt className="h-5 w-5 text-gray-500" />} color="#6b7280" />
        <FinanceSummaryCard title="Lucro Líquido" value={formatCurrency(netProfit)} icon={<Pocket className="h-5 w-5 text-green-500" />} color="#22c55e" />
        <FinanceSummaryCard title="Saldo a Pagar" value={formatCurrency(summary.pendingFees)} icon={<AlertTriangle className="h-5 w-5 text-red-500" />} color="#ef4444" />
        <FinanceSummaryCard title="Receita com Stands" value={formatCurrency(revenueStands)} icon={<DollarSign className="h-5 w-5 text-orange-500" />} color="#f59e42" />
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
                <TableHead>Data da Venda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standsSales.length > 0 ? (
                standsSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.events?.name || '-'}</TableCell>
                    <TableCell>{sale.name || '-'}</TableCell>
                    <TableCell>{sale.users?.name || sale.users?.email || sale.reserved_by || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(sale.price)}</TableCell>
                    <TableCell>{sale.payment_date ? new Date(sale.payment_date).toLocaleDateString('pt-BR') : '-'}</TableCell>
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
    </motion.div>
  );
};

export default OrganizerFinances;