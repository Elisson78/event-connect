import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Eye, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminManualPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const fetchProofs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('manual_payment_proofs')
        .select(`
          *,
          organizer:organizer_id (
            id,
            name,
            email
          )
        `)
        .eq('status', 'pending_confirmation')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProofs(data);
    } catch (error) {
      toast({ title: 'Erro ao buscar comprovantes', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  const handleApproval = async (proofId, approve) => {
    if (!user) return;
    setProcessingId(proofId);
    try {
      if (approve) {
        const { error } = await supabase.rpc('approve_manual_payment', {
          proof_id: proofId,
          admin_id: user.id
        });
        if (error) throw error;
        toast({ title: 'Pagamento Aprovado!', description: 'As taxas do organizador foram atualizadas.' });
      } else {
        const { error } = await supabase
          .from('manual_payment_proofs')
          .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
          .eq('id', proofId);
        if (error) throw error;
        toast({ title: 'Pagamento Rejeitado', description: 'O comprovante foi marcado como rejeitado.', variant: 'destructive' });
      }
      fetchProofs();
    } catch (error) {
      toast({ title: 'Erro ao processar pagamento', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-orange-500" /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Confirmação de Pagamentos Manuais</CardTitle>
              <CardDescription>Aprove ou rejeite os comprovantes de pagamento enviados pelos organizadores.</CardDescription>
            </div>
            <Button onClick={fetchProofs} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organizador</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Data Envio</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proofs.length > 0 ? (
                proofs.map((proof) => (
                  <TableRow key={proof.id}>
                    <TableCell>
                      <div className="font-medium">{proof.organizer?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{proof.organizer?.email || 'N/A'}</div>
                    </TableCell>
                    <TableCell>{formatCurrency(proof.amount)}</TableCell>
                    <TableCell>{proof.gateway_name}</TableCell>
                    <TableCell>{new Date(proof.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <a href={proof.receipt_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="mr-2 h-4 w-4" /> Ver
                        </a>
                      </Button>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleApproval(proof.id, false)}
                        disabled={processingId === proof.id}
                      >
                        <span className="sr-only">Rejeitar</span>
                        {processingId === proof.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="icon"
                        onClick={() => handleApproval(proof.id, true)}
                        disabled={processingId === proof.id}
                      >
                        <span className="sr-only">Aprovar</span>
                        {processingId === proof.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Nenhum comprovante pendente de confirmação.
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

export default AdminManualPayments;