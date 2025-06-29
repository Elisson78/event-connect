import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminFinancialSummary from './AdminFinancialSummary';

const AdminPlatformFees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

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
    </motion.div>
  );
};

export default AdminPlatformFees;