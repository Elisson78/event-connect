import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Badge, Users2, AlertTriangle } from 'lucide-react';
import { generateCollaboratorBadgePdf } from '@/lib/pdfGenerator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const CollaboratorForm = ({ collaborator, roles, onSubmit, onCancel, loading }) => {
  const [name, setName] = useState(collaborator?.name || '');
  const [role, setRole] = useState(collaborator?.role || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !role) return;
    onSubmit({ name, role });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="collaborator-name">Nome Completo</Label>
        <Input id="collaborator-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="collaborator-role">Função</Label>
        <Select onValueChange={setRole} value={role} required>
          <SelectTrigger id="collaborator-role">
            <SelectValue placeholder="Selecione uma função" />
          </SelectTrigger>
          <SelectContent>
            {roles.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
      </DialogFooter>
    </form>
  );
};

const OrganizerCollaborators = () => {
  const { user } = useAuth();
  const { events, loadingEvents } = useEvents();
  const { toast } = useToast();

  const [collaborators, setCollaborators] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCollaborator, setCurrentCollaborator] = useState(null);

  const organizerEvents = events.filter(event => event.organizer_id === user?.id);

  const fetchCollaborators = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: collabData, error: collabError } = await supabase
        .from('collaborators')
        .select('*')
        .eq('organizer_id', user.id)
        .order('name', { ascending: true });
      if (collabError) throw collabError;
      setCollaborators(collabData);

      const { data: rolesData, error: rolesError } = await supabase.from('collaborator_roles').select('*').order('name');
      if (rolesError) throw rolesError;
      setRoles(rolesData);

    } catch (error) {
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const handleFormSubmit = async (formData) => {
    if (!user) return;
    try {
      if (currentCollaborator) {
        const { error } = await supabase
          .from('collaborators')
          .update(formData)
          .eq('id', currentCollaborator.id);
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Colaborador atualizado." });
      } else {
        const { error } = await supabase
          .from('collaborators')
          .insert({ ...formData, organizer_id: user.id });
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Colaborador adicionado." });
      }
      fetchCollaborators();
      setIsDialogOpen(false);
      setCurrentCollaborator(null);
    } catch (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (collaboratorId) => {
    try {
      const { error } = await supabase.from('collaborators').delete().eq('id', collaboratorId);
      if (error) throw error;
      toast({ title: "Sucesso!", description: "Colaborador removido." });
      fetchCollaborators();
    } catch (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    }
  };

  const handleGenerateBadge = (collaborator, eventId) => {
    if (!eventId) {
      toast({ title: "Atenção", description: "Selecione um evento para gerar o crachá.", variant: "destructive" });
      return;
    }
    const event = events.find(e => e.id === eventId);
    if (!collaborator || !user || !event) {
      toast({ title: "Erro", description: "Dados insuficientes para gerar o crachá.", variant: "destructive" });
      return;
    }
    generateCollaboratorBadgePdf({ collaborator, organizer: user, event });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div></div>;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciar Colaboradores</CardTitle>
            <CardDescription>Adicione e gerencie a equipe interna dos seus eventos.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentCollaborator(null)}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{currentCollaborator ? 'Editar' : 'Adicionar'} Colaborador</DialogTitle>
                <DialogDescription>
                  Preencha os dados do membro da equipe.
                </DialogDescription>
              </DialogHeader>
              <CollaboratorForm
                collaborator={currentCollaborator}
                roles={roles}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsDialogOpen(false)}
                loading={loading}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {collaborators.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {collaborators.map(c => (
                <div key={c.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between">
                  <div className="mb-4 md:mb-0">
                    <p className="font-semibold text-lg">{c.name}</p>
                    <p className="text-gray-500">{c.role}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(eventId) => c.selectedEventId = eventId}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Selecione um evento" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingEvents ? <SelectItem value="loading" disabled>Carregando...</SelectItem> : organizerEvents.map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => handleGenerateBadge(c, c.selectedEventId)}>
                        <Badge className="h-4 w-4 mr-2" /> Gerar Crachá
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setCurrentCollaborator(c); setIsDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
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
                            Esta ação não pode ser desfeita. Isso removerá permanentemente o colaborador da sua equipe.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive hover:bg-destructive/90">
                            Sim, remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Users2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum colaborador encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">Comece adicionando os membros da sua equipe.</p>
                <div className="mt-6">
                    <Button onClick={() => { setCurrentCollaborator(null); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Colaborador
                    </Button>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizerCollaborators;