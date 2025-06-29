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
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({ totalFees: 0, paidFees: 0, pendingFees: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
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
      const { data: feesData, error: feesError } = await supabase
        .rpc('get_organizer_fees', { organizer_uuid: user.id });

      if (feesError) throw feesError;

      const currentFees = feesData || [];
      setFees(currentFees);

      const reconstructedSales = currentFees.map(fee => ({
        id: fee.id,
        event: fee.event,
        user: fee.user,
        ticket_price: fee.event?.price ? parseCurrency(fee.event.price) : 0,
        created_at: fee.created_at
      }));
      setSales(reconstructedSales);

      const totalRevenue = reconstructedSales.reduce((acc, sale) => acc + sale.ticket_price, 0);
      const totalFees = currentFees.reduce((acc, fee) => acc + parseFloat(fee.fee_amount), 0);
      const paidFees = currentFees.filter(f => f.status === 'paid').reduce((acc, fee) => acc + parseFloat(fee.fee_amount), 0);
      const pendingFees = totalFees - paidFees;
      
      setSummary({ totalFees, paidFees, pendingFees, totalRevenue });

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
      case 'pending': return 'warning';
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

  const netProfit = summary.totalRevenue - summary.totalFees;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <FinanceSummaryCard title="Receita Bruta" value={formatCurrency(summary.totalRevenue)} icon={<TrendingUp className="h-5 w-5 text-blue-500" />} color="#3b82f6" />
        <FinanceSummaryCard title="Taxas da Plataforma" value={formatCurrency(summary.totalFees)} icon={<Receipt className="h-5 w-5 text-gray-500" />} color="#6b7280" />
        <FinanceSummaryCard title="Lucro Líquido" value={formatCurrency(netProfit)} icon={<Pocket className="h-5 w-5 text-green-500" />} color="#22c55e" />
        <FinanceSummaryCard title="Saldo a Pagar" value={formatCurrency(summary.pendingFees)} icon={<AlertTriangle className="h-5 w-5 text-red-500" />} color="#ef4444" />
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
                <TableHead className="text-right">Valor Pago</TableHead>
                <TableHead>Data da Venda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.event?.name || 'Evento não encontrado'}</TableCell>
                    <TableCell>{sale.user?.name || 'Participante não encontrado'}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(sale.ticket_price)}</TableCell>
                    <TableCell>{new Date(sale.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    Nenhuma venda de ingresso registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                <TableHead className="text-right">Valor da Taxa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.length > 0 ? (
                fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.event?.name || 'Evento não encontrado'}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(fee.fee_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(fee.status)}>{fee.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(fee.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    Nenhuma taxa gerada ainda.
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