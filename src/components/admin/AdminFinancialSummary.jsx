import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, TrendingUp, Receipt, AlertTriangle } from 'lucide-react';

const SummaryCard = ({ title, value, icon, color }) => (
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

const AdminFinancialSummary = () => {
  const { toast } = useToast();
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    pendingFees: 0,
    paidFees: 0,
  });
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

  const fetchFinancials = useCallback(async () => {
    setLoading(true);
    try {
      const { data: fees, error: feesError } = await supabase
        .from('platform_fees')
        .select(`
          fee_amount,
          status,
          event:event_id ( price )
        `);

      if (feesError) throw feesError;

      const totalProfit = fees.reduce((sum, fee) => sum + parseFloat(fee.fee_amount || 0), 0);
      const paidFees = fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + parseFloat(fee.fee_amount || 0), 0);
      const pendingFees = totalProfit - paidFees;
      
      const totalRevenue = fees.reduce((sum, fee) => {
        const price = fee.event?.price ? parseCurrency(fee.event.price) : 0;
        return sum + price;
      }, 0);

      setSummary({ totalRevenue, totalProfit, pendingFees, paidFees });

    } catch (error) {
      toast({ title: "Erro ao carregar dados financeiros", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-24">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <SummaryCard title="Volume de Inscrições" value={formatCurrency(summary.totalRevenue)} icon={<TrendingUp className="h-5 w-5 text-blue-500" />} color="#3b82f6" />
      <SummaryCard title="Lucro da Plataforma" value={formatCurrency(summary.totalProfit)} icon={<DollarSign className="h-5 w-5 text-green-500" />} color="#22c55e" />
      <SummaryCard title="Taxas Recebidas" value={formatCurrency(summary.paidFees)} icon={<Receipt className="h-5 w-5 text-purple-500" />} color="#8b5cf6" />
      <SummaryCard title="Taxas Pendentes" value={formatCurrency(summary.pendingFees)} icon={<AlertTriangle className="h-5 w-5 text-red-500" />} color="#ef4444" />
    </div>
  );
};

export default AdminFinancialSummary;