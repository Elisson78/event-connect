import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

const AdminRoleManagement = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', display_name: '', description: '' });

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('roles').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      toast({ title: 'Erro ao buscar funções', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    if (id === 'name') {
      setFormData((prev) => ({ ...prev, [id]: value.toLowerCase().replace(/[^a-z0-9_]/g, '') }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleOpenDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name, display_name: role.display_name, description: role.description || '' });
    } else {
      setEditingRole(null);
      setFormData({ name: '', display_name: '', description: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
    setFormData({ name: '', display_name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        // Edit
        const { error } = await supabase
          .from('roles')
          .update({ display_name: formData.display_name, description: formData.description })
          .eq('name', editingRole.name);
        if (error) throw error;
        toast({ title: 'Função atualizada!', description: `A função "${formData.display_name}" foi atualizada.` });
      } else {
        // Create
        const { error } = await supabase.from('roles').insert([formData]);
        if (error) throw error;
        toast({ title: 'Função criada!', description: `A função "${formData.display_name}" foi criada com sucesso.` });
      }
      fetchRoles();
      handleCloseDialog();
    } catch (error) {
      toast({ title: 'Erro ao salvar função', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteRole = async (roleName, displayName) => {
    try {
      const { data: usersWithRole, error: fetchError } = await supabase.from('users').select('id').eq('role', roleName).limit(1);
      if (fetchError) throw fetchError;

      if (usersWithRole.length > 0) {
        toast({ title: 'Ação não permitida', description: `Não é possível remover a função "${displayName}" pois existem usuários associados a ela.`, variant: 'destructive' });
        return;
      }

      const { error } = await supabase.from('roles').delete().eq('name', roleName);
      if (error) throw error;
      toast({ title: 'Função removida!', description: `A função "${displayName}" foi removida.` });
      fetchRoles();
    } catch (error) {
      toast({ title: 'Erro ao remover função', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Funções</CardTitle>
          <CardDescription>Crie, edite e remova funções de usuário da plataforma.</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Criar Função
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.name} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <Users className="h-6 w-6 text-gray-500" />
                <div>
                  <p className="font-bold text-lg">{role.display_name}</p>
                  <p className="text-sm text-gray-600">{role.description || 'Sem descrição.'}</p>
                  <p className="text-xs text-gray-400 mt-1">ID: {role.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={() => handleOpenDialog(role)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {role.is_deletable ? (
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
                          Esta ação não pode ser desfeita. Isso removerá permanentemente a função
                          <strong className="mx-1">{role.display_name}</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteRole(role.name, role.display_name)} className="bg-red-600 hover:bg-red-700">
                          Sim, remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button variant="destructive" size="icon" disabled title="Esta função não pode ser removida.">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Editar Função' : 'Criar Nova Função'}</DialogTitle>
            <DialogDescription>{editingRole ? `Editando os detalhes da função "${editingRole.display_name}".` : 'Preencha os detalhes para a nova função.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="display_name">Nome de Exibição</Label>
              <Input id="display_name" value={formData.display_name} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="name">ID da Função (chave única)</Label>
              <Input id="name" value={formData.name} onChange={handleInputChange} required disabled={!!editingRole} placeholder="ex: 'moderador' (apenas letras minúsculas, sem espaços)" />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder="Descreva o que esta função faz." />
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

export default AdminRoleManagement;