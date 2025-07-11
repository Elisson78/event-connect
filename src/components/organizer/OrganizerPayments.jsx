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

const OrganizerPayments = () => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingIdx, setEditingIdx] = useState(null);

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
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Métodos de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-end">
          <Button onClick={() => handleOpen()}>Adicionar Método</Button>
        </div>
        {loading ? (
          <div className="text-gray-500 text-center py-8">Carregando métodos...</div>
        ) : methods.length === 0 ? (
          <div className="text-gray-500 text-center py-8">Nenhum método cadastrado ainda.</div>
        ) : (
          <ul className="space-y-4">
            {methods.map((m, idx) => (
              <li key={idx} className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-gray-50">
                <div>
                  <div className="font-bold text-lg text-blue-800">{m.name || m.manualSubtype?.toUpperCase() || m.type} <span className="text-xs text-gray-500 ml-2">[{m.type === 'manual' ? (m.manualSubtype ? m.manualSubtype.charAt(0).toUpperCase() + m.manualSubtype.slice(1) : 'Manual') : 'Online'}]</span></div>
                  {m.account_holder && <div className="text-xs text-gray-700"><strong>Recebedor:</strong> {m.account_holder}</div>}
                  {m.instructions && <div className="text-sm text-gray-700">{m.instructions}</div>}
                  {m.twint && <div className="text-xs text-gray-500">Twint: {m.twint}</div>}
                  {m.iban && <div className="text-xs text-gray-500">IBAN: {m.iban}</div>}
                  {m.bankName && <div className="text-xs text-gray-500">Banco: {m.bankName}</div>}
                  {m.accountNumber && <div className="text-xs text-gray-500">Conta: {m.accountNumber}</div>}
                  {m.link && <div className="text-xs text-blue-600">Link: <a href={m.link} target="_blank" rel="noopener noreferrer" className="underline">{m.link}</a></div>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleOpen(idx)}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleRemove(idx)}>Remover</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
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