import React, { useState } from 'react';
import { useEvents } from '@/contexts/EventContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminEventTypes = () => {
  const { eventCategories, loadingEventCategories, refetchEventCategories } = useEvents();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', details_schema: [] });
  
  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        details_schema: category.details_schema || [],
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', details_schema: [] });
    }
    setIsDialogOpen(true);
  };
  
  const handleFieldChange = (index, key, value) => {
    const updatedSchema = [...formData.details_schema];
    updatedSchema[index][key] = value;
    setFormData({ ...formData, details_schema: updatedSchema });
  };

  const addField = () => {
    setFormData({
      ...formData,
      details_schema: [...formData.details_schema, { key: '', label: '', type: 'text', placeholder: '' }]
    });
  };

  const removeField = (index) => {
    const updatedSchema = formData.details_schema.filter((_, i) => i !== index);
    setFormData({ ...formData, details_schema: updatedSchema });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Sanitize schema: remove empty fields
    const sanitizedSchema = formData.details_schema.filter(field => field.key && field.label);
    const payload = { ...formData, details_schema: sanitizedSchema };

    try {
      if (editingCategory) {
        // Update
        const { error } = await supabase.from('event_categories').update(payload).eq('id', editingCategory.id);
        if (error) throw error;
        toast({ title: 'Sucesso!', description: 'Categoria atualizada.' });
      } else {
        // Create
        const { error } = await supabase.from('event_categories').insert(payload);
        if (error) throw error;
        toast({ title: 'Sucesso!', description: 'Nova categoria criada.' });
      }
      setIsDialogOpen(false);
      refetchEventCategories();
    } catch (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"? Esta ação não pode ser desfeita.`)) return;
    
    try {
      const { error } = await supabase.from('event_categories').delete().eq('id', categoryId);
      if (error) throw error;
      toast({ title: 'Sucesso!', description: `Categoria "${categoryName}" excluída.` });
      refetchEventCategories();
    } catch (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Gerenciar Tipos de Evento</CardTitle>
          <CardDescription>Crie, edite e remova as categorias de eventos da plataforma.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Editar' : 'Criar Nova'} Categoria de Evento</DialogTitle>
              <DialogDescription>
                Defina um nome e campos personalizados para esta categoria.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Categoria</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Campos Personalizados</h3>
                <AnimatePresence>
                  {formData.details_schema.map((field, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-3 border rounded-lg space-y-2 bg-gray-50"
                    >
                       <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Chave (sem espaços/acentos)</Label>
                            <Input value={field.key} onChange={e => handleFieldChange(index, 'key', e.target.value.toLowerCase().replace(/\s/g, '_'))} placeholder="ex: palestrantes" />
                          </div>
                          <div>
                            <Label className="text-xs">Rótulo (Label)</Label>
                            <Input value={field.label} onChange={e => handleFieldChange(index, 'label', e.target.value)} placeholder="Ex: Palestrantes do Evento" />
                          </div>
                          <div>
                            <Label className="text-xs">Tipo do Campo</Label>
                             <select value={field.type} onChange={e => handleFieldChange(index, 'type', e.target.value)} className="w-full p-2 border rounded">
                               <option value="text">Texto Curto</option>
                               <option value="textarea">Texto Longo</option>
                             </select>
                          </div>
                           <div>
                            <Label className="text-xs">Placeholder</Label>
                            <Input value={field.placeholder} onChange={e => handleFieldChange(index, 'placeholder', e.target.value)} placeholder="Texto de ajuda no campo" />
                           </div>
                       </div>
                       <Button type="button" variant="destructive" size="sm" onClick={() => removeField(index)}>
                         <X className="h-4 w-4 mr-1" /> Remover Campo
                       </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <Button type="button" variant="outline" onClick={addField}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Campo Personalizado
                </Button>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loadingEventCategories ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {eventCategories.map(category => (
              <div key={category.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleOpenDialog(category)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(category.id, category.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminEventTypes;