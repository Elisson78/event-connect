import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const CreateAdminDialog = ({ onAdminCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const { toast } = useToast();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { name: formData.name, role: 'admin' } }
      });
      if (signUpError) throw signUpError;
      toast({ title: "Administrador criado!", description: `${formData.name} foi adicionado. Verifique o email para confirmação.` });
      setIsOpen(false);
      setFormData({ name: '', email: '', password: '' });
      if(onAdminCreated) onAdminCreated();
    } catch (error) {
      console.error("Error creating admin:", error);
      toast({ title: "Erro ao criar administrador", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="btn-primary text-white">
          <Plus className="h-5 w-5 mr-2" />
          Criar Admin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Administrador</DialogTitle>
          <DialogDescription>Adicione um novo administrador à plataforma</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-name">Nome Completo</Label>
            <Input id="admin-name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input id="admin-email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Senha</Label>
            <Input id="admin-password" type="password" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" className="btn-primary text-white">Criar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


const AdminDashboardHeader = ({ pageTitle, currentUser, showCreateAdmin, onAdminCreated }) => (
  <div className="flex justify-between items-center mb-8">
    <div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 capitalize">
        {pageTitle} <span className="text-gradient">Administrativo</span>
      </h1>
      <p className="hidden sm:block text-lg md:text-xl text-gray-600 mt-2">
        Bem-vindo, {currentUser?.name || currentUser?.email}!
      </p>
    </div>
    {showCreateAdmin && <CreateAdminDialog onAdminCreated={onAdminCreated} />}
  </div>
);

export default AdminDashboardHeader;