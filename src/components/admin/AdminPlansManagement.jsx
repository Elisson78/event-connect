import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2, PercentCircle, DollarSign } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const PlanForm = ({ plan, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    fee_percent: plan?.fee_percent || '',
    fee_fixed: plan?.fee_fixed || '',
    charged_to: plan?.charged_to || 'buyer',
    alternate_fee_percent: plan?.alternate_fee_percent || '',
    alternate_fee_fixed: plan?.alternate_fee_fixed || '',
    is_active: plan?.is_active ?? true,
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Plano</Label>
        <Input id="name" value={formData.name} onChange={handleInputChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={formData.description} onChange={handleInputChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fee_percent">Taxa Percentual (%)</Label>
          <Input id="fee_percent" type="number" step="0.01" value={formData.fee_percent} onChange={handleInputChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee_fixed">Taxa Fixa (CHF)</Label>
          <Input id="fee_fixed" type="number" step="0.01" value={formData.fee_fixed} onChange={handleInputChange} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="charged_to">Repassar Custo Para</Label>
        <Select value={formData.charged_to} onValueChange={(value) => setFormData(prev => ({ ...prev, charged_to: value }))}>
          <SelectTrigger id="charged_to"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="buyer">Comprador</SelectItem>
            <SelectItem value="organizer">Organizador</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">Selecione quem arcará com a taxa padrão.</p>
      </div>
      <div className="p-4 border rounded-md bg-gray-50">
        <h4 className="font-medium mb-2">Taxa Alternativa</h4>
        <p className="text-xs text-gray-500 mb-2">
          Esta taxa será aplicada se o organizador decidir absorver o custo, quando o padrão é repassar ao comprador (e vice-versa).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="alternate_fee_percent">Taxa Percentual Alternativa (%)</Label>
            <Input id="alternate_fee_percent" type="number" step="0.01" value={formData.alternate_fee_percent} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alternate_fee_fixed">Taxa Fixa Alternativa (CHF)</Label>
            <Input id="alternate_fee_fixed" type="number" step="0.01" value={formData.alternate_fee_fixed} onChange={handleInputChange} />
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} />
        <Label htmlFor="is_active">Plano Ativo</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Plano'}</Button>
      </DialogFooter>
    </form>
  );
};

const AdminPlansManagement = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('plans').select('*').order('created_at');
      if (error) throw error;
      setPlans(data);
    } catch (error) {
      toast({ title: "Erro ao carregar planos", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleFormSubmit = async (formData) => {
    const payload = {
      ...formData,
      fee_percent: parseFloat(formData.fee_percent) || 0,
      fee_fixed: parseFloat(formData.fee_fixed) || 0,
      alternate_fee_percent: formData.alternate_fee_percent ? parseFloat(formData.alternate_fee_percent) : null,
      alternate_fee_fixed: formData.alternate_fee_fixed ? parseFloat(formData.alternate_fee_fixed) : null,
    };

    try {
      if (currentPlan) {
        const { error } = await supabase.from('plans').update(payload).eq('id', currentPlan.id);
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Plano atualizado." });
      } else {
        const { error } = await supabase.from('plans').insert(payload);
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Plano criado." });
      }
      fetchPlans();
      setIsDialogOpen(false);
      setCurrentPlan(null);
    } catch (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (planId) => {
    try {
      const { error } = await supabase.from('plans').delete().eq('id', planId);
      if (error) throw error;
      toast({ title: "Sucesso!", description: "Plano removido." });
      fetchPlans();
    } catch (error) {
      toast({ title: "Erro ao remover", description: "Verifique se o plano não está em uso por algum organizador. " + error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-orange-500" /></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Planos e Comissões</CardTitle>
          <CardDescription>Gerencie os modelos de cobrança para os organizadores de eventos.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setCurrentPlan(null)}>
              <Plus className="h-4 w-4 mr-2" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentPlan ? 'Editar' : 'Criar'} Plano</DialogTitle>
            </DialogHeader>
            <PlanForm plan={currentPlan} onSubmit={handleFormSubmit} onCancel={() => setIsDialogOpen(false)} loading={loading} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {plans.map(plan => (
            <div key={plan.id} className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50">
              <div>
                <p className="font-bold text-lg flex items-center">
                  {plan.name}
                  <span className={`ml-3 text-xs font-bold px-2 py-0.5 rounded-full ${plan.is_active ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-800">
                  <span className="flex items-center"><PercentCircle className="h-4 w-4 mr-1 text-blue-500" /> {plan.fee_percent}%</span>
                  <span className="flex items-center"><DollarSign className="h-4 w-4 mr-1 text-green-500" /> {plan.fee_fixed}</span>
                  <span>Repassado para: <span className="font-semibold capitalize">{plan.charged_to}</span></span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={() => { setCurrentPlan(plan); setIsDialogOpen(true); }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover o plano "{plan.name}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(plan.id)} className="bg-destructive hover:bg-destructive/90">
                        Sim, remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPlansManagement;