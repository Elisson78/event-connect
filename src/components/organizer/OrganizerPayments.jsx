import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/lib/customSupabaseClient';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/components/ui/use-toast';

const initialForm = { type: 'manual', manualSubtype: '', name: '', instructions: '', pixKey: '', link: '', twint: '', iban: '', bankName: '', accountNumber: '', accountHolder: '' };

// Lista de métodos prontos
const PAYMENT_METHODS = [
  { key: 'twint', label: 'TWINT', placeholder: 'Número Twint', field: 'twint' },
  { key: 'mbway', label: 'MB WAY', placeholder: 'Número MB WAY', field: 'mbway' },
  { key: 'pix', label: 'Pix', placeholder: 'Chave Pix', field: 'pix' },
  { key: 'conta', label: 'Transferência Bancária', field: 'conta', fields: [
    { key: 'account_holder', label: 'Titular da Conta', placeholder: 'Nome do titular' },
    { key: 'bank_name', label: 'Nome do Banco', placeholder: 'Nome do banco' },
    { key: 'iban', label: 'IBAN', placeholder: 'IBAN' },
    { key: 'account_number', label: 'Número da Conta', placeholder: 'Número da conta' },
    { key: 'bic_swift', label: 'BIC/SWIFT', placeholder: 'Código BIC/SWIFT' },
  ] },
];

const OrganizerPayments = () => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingIdx, setEditingIdx] = useState(null);
  // Novo: Estado para métodos prontos
  const [readyMethods, setReadyMethods] = useState({});

  const handleOpen = (idx = null) => {
    if (idx !== null) {
      setForm(methods[idx]);
      setEditingIdx(idx);
    } else {
      setForm(initialForm);
      setEditingIdx(null);
    }
    setModalOpen(true);
  };

  // Buscar métodos do banco ao carregar
  useEffect(() => {
    const fetchMethods = async () => {
      if (!profile?.id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('organizer_payment_methods')
        .select('*')
        .eq('organizer_id', profile.id)
        .order('created_at', { ascending: true });
      if (error) {
        toast({ title: 'Erro ao buscar métodos', description: error.message, variant: 'destructive' });
        setMethods([]);
      } else {
        setMethods(data || []);
      }
      setLoading(false);
    };
    fetchMethods();
  }, [profile, toast]);

  // Função para buscar métodos prontos do banco (para ser usada após salvar)
  const fetchReadyMethods = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('organizer_payment_methods')
      .select('*')
      .eq('organizer_id', profile.id);
    if (error) {
      toast({ title: 'Erro ao buscar métodos', description: error.message, variant: 'destructive' });
      setReadyMethods({});
    } else {
      // Montar objeto por key
      const obj = {};
      PAYMENT_METHODS.forEach(m => {
        if (m.key === 'conta') {
          obj[m.key] = data?.find(d => d.method_type === m.key) || {
            organizer_id: profile.id,
            method_type: m.key,
            is_active: false,
            account_holder: '',
            bank_name: '',
            iban: '',
            account_number: '',
            bic_swift: '',
          };
        } else {
          obj[m.key] = data?.find(d => d.method_type === m.key) || {
            organizer_id: profile.id,
            method_type: m.key,
            is_active: false,
            account_holder: '',
            [m.field]: '',
          };
        }
      });
      setReadyMethods(obj);
    }
    setLoading(false);
  };

  // Buscar métodos prontos do banco ao carregar
  useEffect(() => {
    fetchReadyMethods();
  }, [profile, toast]);

  // Salvar método no banco
  const handleSave = async () => {
    if (!profile?.id) return;
    if (!form.accountHolder || form.accountHolder.trim() === '') {
      toast({ title: 'Nome do Recebedor obrigatório', description: 'Preencha o nome da pessoa ou empresa que vai receber o pagamento.', variant: 'destructive' });
      return;
    }
    if (editingIdx !== null) {
      // Update (não implementado ainda)
      toast({ title: 'Edição ainda não implementada', variant: 'destructive' });
      setModalOpen(false);
      return;
    }
    // Insert
    const payload = {
      organizer_id: profile.id,
      method_type: form.manualSubtype || form.type, // Garante que method_type sempre será preenchido
      manual_subtype: form.manualSubtype, // mantém para compatibilidade futura
      name: form.name,
      instructions: form.instructions,
      twint: form.twint,
      iban: form.iban,
      bank_name: form.bankName,
      account_number: form.accountNumber,
      account_holder: form.accountHolder,
      link: form.link,
      details: {}, // Garante que nunca será nulo
      created_at: new Date().toISOString(),
      is_active: true,
    };
    const { data, error } = await supabase
      .from('organizer_payment_methods')
      .insert([payload])
      .select();
    if (error) {
      toast({ title: 'Erro ao adicionar método', description: error.message, variant: 'destructive' });
    } else {
      setMethods(prev => [...prev, ...(data || [])]);
      toast({ title: 'Método adicionado com sucesso', variant: 'success' });
    }
    setModalOpen(false);
  };

  // Salvar/atualizar método pronto
  const handleSaveReady = async (key) => {
    const method = readyMethods[key];
    if (key === 'conta') {
      if (!method.account_holder || !method.bank_name || !method.iban || !method.account_number) {
        toast({ title: 'Preencha todos os campos obrigatórios', description: 'Titular, banco, IBAN e número da conta são obrigatórios.', variant: 'destructive' });
        return;
      }
    } else {
      if (!method.account_holder || !method[key]) {
        toast({ title: 'Preencha todos os campos', description: 'Nome do recebedor e dado principal são obrigatórios.', variant: 'destructive' });
        return;
      }
    }
    setLoading(true);
    if (method.id) {
      // Update
      const updatePayload = { is_active: method.is_active };
      if (key === 'conta') {
        updatePayload.account_holder = method.account_holder;
        updatePayload.bank_name = method.bank_name;
        updatePayload.iban = method.iban;
        updatePayload.account_number = method.account_number;
        updatePayload.bic_swift = method.bic_swift;
      } else {
        updatePayload.account_holder = method.account_holder;
        updatePayload[key] = method[key];
      }
      const { error } = await supabase
        .from('organizer_payment_methods')
        .update(updatePayload)
        .eq('id', method.id);
      if (error) {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Método atualizado', variant: 'success' });
      }
    } else {
      // Insert
      const insertPayload = {
        organizer_id: profile.id,
        method_type: key,
        is_active: method.is_active,
      };
      if (key === 'conta') {
        insertPayload.account_holder = method.account_holder;
        insertPayload.bank_name = method.bank_name;
        insertPayload.iban = method.iban;
        insertPayload.account_number = method.account_number;
        insertPayload.bic_swift = method.bic_swift;
      } else {
        insertPayload.account_holder = method.account_holder;
        insertPayload[key] = method[key];
      }
      const { error } = await supabase
        .from('organizer_payment_methods')
        .insert(insertPayload);
      if (error) {
        toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Método salvo', variant: 'success' });
      }
    }
    setLoading(false);
    // Recarregar métodos após salvar
    await fetchReadyMethods();
  };

  // Remover método do banco
  const handleRemove = async (idx) => {
    const method = methods[idx];
    if (!method?.id) return;
    if (window.confirm('Tem certeza que deseja remover este método de pagamento?')) {
      const { error } = await supabase
        .from('organizer_payment_methods')
        .delete()
        .eq('id', method.id);
      if (error) {
        toast({ title: 'Erro ao remover método', description: error.message, variant: 'destructive' });
      } else {
        setMethods(methods.filter((_, i) => i !== idx));
        toast({ title: 'Método removido com sucesso', variant: 'success' });
      }
    }
  };

  return (
    <Card className="w-full mt-8 shadow-none border-none bg-white">
      <CardHeader>
        <CardTitle>Métodos de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full px-6 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full mx-auto">
            {PAYMENT_METHODS.map(m => (
              <div key={m.key} className="border rounded-lg bg-gray-50 flex flex-col justify-between min-h-[340px] max-w-xs w-full mx-auto p-5 shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{m.label}</span>
                    <label className="flex items-center gap-2 text-xs">
                      Ativo
                      <input type="checkbox" checked={!!readyMethods[m.key]?.is_active} onChange={e => setReadyMethods(rm => ({ ...rm, [m.key]: { ...rm[m.key], is_active: e.target.checked } }))} />
                    </label>
                  </div>
                  {m.key === 'conta' ? (
                    <>
                      {m.fields.map(f => (
                        <React.Fragment key={f.key}>
                          <Label>{f.label}</Label>
                          <Input value={readyMethods[m.key]?.[f.key] || ''} onChange={e => setReadyMethods(rm => ({ ...rm, [m.key]: { ...rm[m.key], [f.key]: e.target.value } }))} placeholder={f.placeholder} />
                        </React.Fragment>
                      ))}
                    </>
                  ) : (
                    <>
                      <Label>Nome do Recebedor</Label>
                      <Input value={readyMethods[m.key]?.account_holder || ''} onChange={e => setReadyMethods(rm => ({ ...rm, [m.key]: { ...rm[m.key], account_holder: e.target.value } }))} placeholder="Nome da pessoa que vai receber" />
                      <Label>{m.label}</Label>
                      <Input value={readyMethods[m.key]?.[m.key] || ''} onChange={e => setReadyMethods(rm => ({ ...rm, [m.key]: { ...rm[m.key], [m.key]: e.target.value } }))} placeholder={m.placeholder} />
                    </>
                  )}
                </div>
                <Button className="mt-4 w-full" onClick={() => handleSaveReady(m.key)} disabled={loading}>Salvar Configurações</Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIdx !== null ? 'Editar Método' : 'Adicionar Método'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Tipo</Label>
            <select className="border rounded px-2 py-1 w-full" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, manualSubtype: '' }))}>
              <option value="manual">Manual (comprovante)</option>
              <option value="online">Online (link/gateway)</option>
            </select>
            {form.type === 'manual' && (
              <>
                <Label>Método Manual</Label>
                <select className="border rounded px-2 py-1 w-full" value={form.manualSubtype} onChange={e => setForm(f => ({ ...f, manualSubtype: e.target.value }))}>
                  <option value="">Selecione...</option>
                  <option value="twint">Twint</option>
                  <option value="conta">Conta Bancária</option>
                  <option value="iban">IBAN</option>
                </select>
              </>
            )}
            <Label>Nome do Recebedor</Label>
            <Input value={form.accountHolder} onChange={e => setForm(f => ({ ...f, accountHolder: e.target.value }))} placeholder="Nome da pessoa ou empresa que vai receber" />
            <Label>Instruções</Label>
            <Input value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Ex: Envie o comprovante após o pagamento." />
            {/* Campos dinâmicos conforme subtipo manual */}
            {form.type === 'manual' && form.manualSubtype === 'twint' && (
              <>
                <Label>Twint</Label>
                <Input value={form.twint} onChange={e => setForm(f => ({ ...f, twint: e.target.value }))} placeholder="Número ou instrução Twint" />
              </>
            )}
            {form.type === 'manual' && form.manualSubtype === 'conta' && (
              <>
                <Label>Banco</Label>
                <Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="Nome do banco" />
                <Label>Conta</Label>
                <Input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="Número da conta" />
              </>
            )}
            {form.type === 'manual' && form.manualSubtype === 'iban' && (
              <>
                <Label>IBAN</Label>
                <Input value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} placeholder="IBAN" />
              </>
            )}
            {form.type === 'online' && (
              <>
                <Label>Link de Pagamento</Label>
                <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingIdx !== null ? 'Salvar' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OrganizerPayments; 