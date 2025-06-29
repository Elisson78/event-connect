import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Eye, Link as LinkIcon, Loader2, Save, Shield, ShieldOff, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AdminPagesManagement = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);

  const initialFormState = {
    title: '',
    slug: '',
    content: { body: '' },
    is_published: false
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('pages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPages(data);
    } catch (error) {
      toast({ title: 'Erro ao buscar páginas', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);
  
  const handleOpenDialog = (page = null) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        title: page.title,
        slug: page.slug,
        content: page.content || { body: '' },
        is_published: page.is_published
      });
    } else {
      setEditingPage(null);
      setFormData(initialFormState);
    }
    setIsDialogOpen(true);
  };

  const handleFormChange = (key, value) => {
    if (key === 'content') {
      setFormData(prev => ({ ...prev, content: { body: value } }));
    } else if (key === 'slug') {
      setFormData(prev => ({ ...prev, [key]: value.toLowerCase().replace(/[^a-z0-9-]+/g, '') }));
    } else {
      setFormData(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingPage) {
        const { error } = await supabase.from('pages').update(payload).eq('id', editingPage.id);
        if (error) throw error;
        toast({ title: 'Página atualizada!', description: `A página "${payload.title}" foi salva.` });
      } else {
        const { error } = await supabase.from('pages').insert(payload);
        if (error) throw error;
        toast({ title: 'Página criada!', description: `A página "${payload.title}" foi criada com sucesso.` });
      }
      setIsDialogOpen(false);
      fetchPages();
    } catch (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (pageId, pageTitle) => {
    if (!window.confirm(`Tem certeza que deseja excluir a página "${pageTitle}"?`)) return;
    try {
      const { error } = await supabase.from('pages').delete().eq('id', pageId);
      if (error) throw error;
      toast({ title: 'Página excluída!', description: `A página "${pageTitle}" foi removida.` });
      fetchPages();
    } catch (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Gerenciar Páginas</CardTitle>
          <CardDescription>Crie, edite e gerencie as páginas do seu site.</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" /> Nova Página</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
        ) : (
          <div className="space-y-3">
            {pages.map(page => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    {page.is_published ? <Globe className="h-5 w-5 text-green-500" title="Publicada"/> : <Eye className="h-5 w-5 text-gray-400" title="Rascunho"/>}
                    <div>
                      <p className="font-semibold">{page.title}</p>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <LinkIcon className="h-3 w-3" />
                        <span>/p/{page.slug}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {page.is_system_page ? (
                        <span className="flex items-center text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full"><Shield className="h-3 w-3 mr-1"/> Sistema</span>
                    ) : (
                       <Link to={`/p/${page.slug}`} target="_blank"><Button variant="outline" size="icon"><Eye className="h-4 w-4"/></Button></Link>
                    )}
                    <Button variant="outline" size="icon" onClick={() => handleOpenDialog(page)} disabled={page.is_system_page}><Edit className="h-4 w-4"/></Button>
                    {page.is_deletable ? (
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(page.id, page.title)}><Trash2 className="h-4 w-4"/></Button>
                    ) : (
                      <Button variant="destructive" size="icon" disabled><ShieldOff className="h-4 w-4" /></Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Editar Página' : 'Criar Nova Página'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Página</Label>
              <Input id="title" value={formData.title} onChange={e => handleFormChange('title', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL (slug)</Label>
              <Input id="slug" value={formData.slug} onChange={e => handleFormChange('slug', e.target.value)} required placeholder="ex: sobre-nos"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea id="content" value={formData.content.body} onChange={e => handleFormChange('content', e.target.value)} rows={10} placeholder="Escreva o conteúdo da página aqui..."/>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_published" checked={formData.is_published} onCheckedChange={checked => handleFormChange('is_published', checked)} />
              <Label htmlFor="is_published">Publicar página</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminPagesManagement;