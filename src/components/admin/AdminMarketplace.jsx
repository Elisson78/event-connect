import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, ShoppingBag, DollarSign, CheckCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminMarketplace = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    platform: '',
    is_featured_plan: false,
    is_active: true
  });

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('ad_plans').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      toast({ title: 'Erro ao buscar planos', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSwitchChange = (id, checked) => {
    setFormData((prev) => ({ ...prev, [id]: checked }));
  };
  
  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({...prev, [id]: value }));
  };

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        platform: plan.platform,
        is_featured_plan: plan.is_featured_plan,
        is_active: plan.is_active,
      });
    } else {
      setEditingPlan(null);
      setFormData({ name: '', description: '', price: '', platform: '', is_featured_plan: false, is_active: true });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
        ...formData,
        price: parseFloat(formData.price)
    };
    try {
      if (editingPlan) {
        const { error } = await supabase.from('ad_plans').update(payload).eq('id', editingPlan.id);
        if (error) throw error;
        toast({ title: 'Plano atualizado!', description: `O plano "${formData.name}" foi atualizado.` });
      } else {
        const { error } = await supabase.from('ad_plans').insert([payload]);
        if (error) throw error;
        toast({ title: 'Plano criado!', description: `O plano "${formData.name}" foi criado com sucesso.` });
      }
      fetchPlans();
      handleCloseDialog();
    } catch (error) {
      toast({ title: 'Erro ao salvar plano', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeletePlan = async (planId, planName) => {
    try {
      const { error } = await supabase.from('ad_plans').delete().eq('id', planId);
      if (error) throw error;
      toast({ title: 'Plano removido!', description: `O plano "${planName}" foi removido.` });
      fetchPlans();
    } catch (error) {
      toast({ title: 'Erro ao remover plano', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Mercado de Publicidade</CardTitle>
          <CardDescription>Crie e gerencie os planos de publicidade para os organizadores.</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Criar Plano
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <ShoppingBag className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="font-bold text-lg">{plan.name} <span className="text-sm font-normal text-gray-500">({plan.platform})</span></p>
                  <p className="text-sm text-gray-600">{plan.description || 'Sem descrição.'}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-green-600 font-semibold flex items-center"><DollarSign className="h-4 w-4 mr-1"/>{plan.price.toFixed(2)}</span>
                    {plan.is_featured_plan && <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">Destaque do Site</span>}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${plan.is_active ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                      {plan.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={() => handleOpenDialog(plan)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação removerá permanentemente o plano <strong className="mx-1">{plan.name}</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeletePlan(plan.id, plan.name)} className="bg-red-600 hover:bg-red-700">
                        Sim, remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={plan.is_active}
                  onCheckedChange={async (checked) => {
                    const { error } = await supabase.from('ad_plans').update({ is_active: checked }).eq('id', plan.id);
                    if (error) {
                      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
                    } else {
                      setPlans((prev) => prev.map(p => p.id === plan.id ? { ...p, is_active: checked } : p));
                    }
                  }}
                  className="mr-2"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle>
            <DialogDescription>{editingPlan ? 'Editando os detalhes do plano.' : 'Preencha os detalhes para o novo plano.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nome do Plano</Label>
              <Input id="name" value={formData.name} onChange={handleInputChange} required />
            </div>
             <div>
              <Label htmlFor="platform">Plataforma</Label>
              <Select value={formData.platform} onValueChange={(value) => handleSelectChange('platform', value)}>
                <SelectTrigger><SelectValue placeholder="Selecione a plataforma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Site">Site</SelectItem>
                  <SelectItem value="Google">Google</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">Preço (CHF)</Label>
              <Input id="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} required placeholder="Ex: 300.00" />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder="Descreva os benefícios deste plano." />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_featured_plan" checked={formData.is_featured_plan} onCheckedChange={(checked) => handleSwitchChange('is_featured_plan', checked)} />
              <Label htmlFor="is_featured_plan">É o plano de destaque do site?</Label>
            </div>
             <div className="flex items-center space-x-2">
              <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => handleSwitchChange('is_active', checked)} />
              <Label htmlFor="is_active">Plano ativo?</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminMarketplace;