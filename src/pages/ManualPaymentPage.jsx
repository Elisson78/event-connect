import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Send, Landmark, ArrowLeft, X, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const ManualPaymentPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { pendingAmount } = location.state || { pendingAmount: 0 };

  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState(null);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const fetchManualGateways = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('is_manual', true)
        .eq('is_enabled', true);
      if (error) throw error;
      setGateways(data);
    } catch (error) {
      toast({ title: 'Erro ao carregar métodos de pagamento', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchManualGateways();
  }, [fetchManualGateways]);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: 'Arquivo muito grande', description: 'O comprovante não pode exceder 5MB.', variant: 'destructive' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmitProof = async () => {
    if (!selectedFile) {
      toast({ title: 'Nenhum arquivo selecionado', description: 'Por favor, anexe o comprovante de pagamento.', variant: 'destructive' });
      return;
    }
    if (!selectedGateway) {
      toast({ title: 'Nenhum método selecionado', description: 'Por favor, selecione o método de pagamento utilizado.', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Erro de autenticação', description: 'Usuário não encontrado.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('organizerassets')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('organizerassets').getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('manual_payment_proofs')
        .insert({
          organizer_id: user.id,
          amount: pendingAmount,
          receipt_url: urlData.publicUrl,
          gateway_name: selectedGateway.label,
        });

      if (insertError) throw insertError;

      toast({ title: 'Comprovante Enviado!', description: 'Seu comprovante foi enviado para análise. A confirmação pode levar até 2 dias úteis.' });
      navigate('/organizer/dashboard/finances');
    } catch (error) {
      toast({ title: 'Erro ao enviar comprovante', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
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
      className="container mx-auto p-4 md:p-8"
    >
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Pagamento de Taxas de Serviço</CardTitle>
          <CardDescription>Valor total a pagar: <span className="font-bold text-lg text-red-600">{formatCurrency(pendingAmount)}</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-4">1. Escolha um método de pagamento e realize a transferência</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {gateways.map(gateway => (
                <Card 
                  key={gateway.id} 
                  className={`cursor-pointer transition-all ${selectedGateway?.id === gateway.id ? 'border-orange-500 ring-2 ring-orange-500' : 'border-gray-200'}`}
                  onClick={() => setSelectedGateway(gateway)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Landmark /> {gateway.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    {Object.entries(gateway.settings).map(([key, value]) => value && (
                      <div key={key}>
                        <p className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</p>
                        <p className="text-gray-600 break-all">{value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
             {gateways.length === 0 && <p className="text-center text-gray-500">Nenhum método de pagamento manual está ativo no momento. Entre em contato com o suporte.</p>}
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">2. Envie o comprovante de pagamento</h3>
            <div className="space-y-2">
              <Label htmlFor="receipt-upload">Anexar Comprovante</Label>
              {selectedFile ? (
                <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50 text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-800 truncate" title={selectedFile.name}>{selectedFile.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8 flex-shrink-0">
                    <span className="sr-only">Remover arquivo</span>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <label htmlFor="receipt-upload" className="relative flex items-center cursor-pointer">
                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <Upload className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Escolher arquivo...</span>
                    </div>
                    <Input id="receipt-upload" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, application/pdf" className="sr-only" />
                  </label>
                </div>
              )}
              <p className="text-xs text-gray-500">Formatos aceitos: PNG, JPG, PDF. Tamanho máximo: 5MB.</p>
            </div>
          </div>

          <Button onClick={handleSubmitProof} disabled={submitting || !selectedFile || !selectedGateway || pendingAmount <= 0} className="w-full">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {submitting ? 'Enviando...' : 'Enviar Comprovante para Análise'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ManualPaymentPage;