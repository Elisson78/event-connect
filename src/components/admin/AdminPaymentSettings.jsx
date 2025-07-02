import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Save, Eye, EyeOff, CreditCard, Send, Landmark } from 'lucide-react';

const manualGatewayFieldsConfig = {
  iban: [
    { key: 'iban', label: 'IBAN', placeholder: 'PT50 XXXX XXXX XXXX XXXX XXXX X' },
    { key: 'account_holder', label: 'Titular da Conta', placeholder: 'Nome da sua empresa ou plataforma' },
    { key: 'bank_name', label: 'Nome do Banco', placeholder: 'Ex: Banco XPTO' },
  ],
  pix: [
    { key: 'pix_key', label: 'Pix', placeholder: 'Insira sua chave Pix' },
  ],
  twint: [
    { key: 'phone_number', label: 'Twint', placeholder: 'Número de telefone associado ao Twint' },
  ],
  mbway: [
    { key: 'phone_number', label: 'MB Way', placeholder: 'Número de telefone associado ao MB WAY' },
  ],
  transferencia_bancaria: [
    { key: 'account_holder', label: 'Titular da Conta', placeholder: 'Nome completo do titular' },
    { key: 'bank_name', label: 'Nome do Banco', placeholder: 'Ex: Banco do Brasil' },
    { key: 'iban', label: 'IBAN', placeholder: 'BRXX XXXX XXXX XXXX XXXX XXXX X' },
    { key: 'account_number', label: 'Número da Conta', placeholder: 'Insira o número da conta' },
    { key: 'bic_swift', label: 'BIC/SWIFT', placeholder: 'Insira o código BIC/SWIFT' },
  ],
};

const GatewayCard = ({ gateway, onSave }) => {
  const [localGateway, setLocalGateway] = useState({ settings: {}, ...gateway });
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    setLocalGateway({ ...gateway, settings: gateway.settings || {} });
  }, [gateway]);

  const handleFieldChange = (field, value) => {
    setLocalGateway(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingsChange = (key, value) => {
    setLocalGateway(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToSave = { ...localGateway.settings };
      Object.keys(settingsToSave).forEach(key => {
        if (settingsToSave[key] === '' || settingsToSave[key] === null) {
          delete settingsToSave[key];
        }
      });
      const gatewayToSave = { ...localGateway, settings: settingsToSave };
      await onSave(gatewayToSave);
      toast({ title: 'Salvo!', description: `Configurações para ${localGateway.label} salvas.` });
    } catch (error) {
      toast({ title: 'Erro', description: `Falha ao salvar ${localGateway.label}.`, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSecretVisibility = (key) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fieldsToRender = manualGatewayFieldsConfig[localGateway.name] || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
           <div className="flex items-center gap-3">
             {localGateway.is_manual ? <Landmark className="h-6 w-6 text-gray-500"/> : <CreditCard className="h-6 w-6 text-gray-500" />}
            <div>
              <CardTitle>{localGateway.label}</CardTitle>
              <CardDescription>{localGateway.is_manual ? 'Preencha os dados para receber pagamentos.' : 'Gateway de pagamento online'}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor={`enable-${localGateway.name}`}>{localGateway.is_enabled ? 'Ativo' : 'Inativo'}</Label>
            <Switch
              id={`enable-${localGateway.name}`}
              checked={localGateway.is_enabled}
              onCheckedChange={(checked) => handleFieldChange('is_enabled', checked)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!localGateway.is_manual && localGateway.settings && Object.keys(localGateway.settings).map(key => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`${localGateway.name}-${key}`}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            <div className="relative">
              <Input
                id={`${localGateway.name}-${key}`}
                type={showSecrets[key] ? 'text' : 'password'}
                value={localGateway.settings[key] || ''}
                onChange={(e) => handleSettingsChange(key, e.target.value)}
                placeholder={`Insira sua ${key.replace(/_/g, ' ')}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => toggleSecretVisibility(key)}
              >
                {showSecrets[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ))}
        {localGateway.is_manual && (
          <div className="space-y-4">
            {fieldsToRender.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`${localGateway.name}-${field.key}`}>{field.label}</Label>
                <Input
                  id={`${localGateway.name}-${field.key}`}
                  value={localGateway.settings[field.key] || ''}
                  onChange={(e) => handleSettingsChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
            {fieldsToRender.length === 0 && localGateway.is_manual && (
              <p className="text-sm text-gray-500">Nenhum campo de configuração para este método manual.</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardFooter>
    </Card>
  );
};

const AdminPaymentSettings = () => {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGateways = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('payment_gateways').select('*').order('is_manual');
      if (error) throw error;
      setGateways(data);
    } catch (error) {
      toast({ title: 'Erro ao carregar gateways', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  const handleSaveGateway = async (gatewayToSave) => {
    const { id, ...updateData } = gatewayToSave;
    const { error } = await supabase.from('payment_gateways').update(updateData).eq('id', id);
    if (error) {
      throw error;
    }
    await fetchGateways();
  };

  const automaticGateways = gateways.filter(g => !g.is_manual);
  const manualGateways = gateways.filter(g => g.is_manual);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Tabs defaultValue="automatic">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="automatic">
            <CreditCard className="mr-2 h-4 w-4" /> Gateways Automáticos
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Send className="mr-2 h-4 w-4" /> Métodos Manuais
          </TabsTrigger>
        </TabsList>
        <TabsContent value="automatic" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
             {automaticGateways.length > 0 ? automaticGateways.map(gateway => (
              <GatewayCard key={gateway.id} gateway={gateway} onSave={handleSaveGateway} />
            )) : <p>Nenhum gateway automático encontrado.</p>}
          </div>
        </TabsContent>
        <TabsContent value="manual" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {manualGateways.length > 0 ? manualGateways.map(gateway => (
              <GatewayCard key={gateway.id} gateway={gateway} onSave={handleSaveGateway} />
            )) : <p>Nenhum método manual encontrado.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AdminPaymentSettings;