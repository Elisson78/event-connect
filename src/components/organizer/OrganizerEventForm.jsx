import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { Link2, Megaphone, Info } from 'lucide-react';
import { useEvents } from '@/contexts/EventContext';
import { formatPrice } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { saveAs } from 'file-saver';
import { supabase } from '@/lib/supabaseClient';

const OrganizerEventForm = ({ formData, onInputChange, onSubmit, onCancel, submitButtonText = "Criar Evento", onStandsChange, stands: standsProp = [] }) => {
  const { adPlans, loadingAdPlans, eventCategories, loadingEventCategories } = useEvents();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stands, setStands] = useState(standsProp);
  const [standForm, setStandForm] = useState({ name: '', description: '', price: '' });
  const [editingStandIndex, setEditingStandIndex] = useState(null);
  const [standQuantity, setStandQuantity] = useState('');
  const [standPrefix, setStandPrefix] = useState('');
  const [standToRemove, setStandToRemove] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (formData.category_id && eventCategories.length > 0) {
      const category = eventCategories.find(c => c.id === formData.category_id);
      setSelectedCategory(category);
    } else {
      setSelectedCategory(null);
    }
  }, [formData.category_id, eventCategories]);

  // Detecta se a categoria é Feira
  const isFeira = selectedCategory && selectedCategory.name && selectedCategory.name.toLowerCase().includes('feira');

  const handleDetailsChange = (key, value) => {
    onInputChange('details', {
      ...formData.details,
      [key]: value,
    });
  };

  const handleDateChange = (field, value) => {
    console.log(`=== DATE CHANGE DEBUG ===`);
    console.log(`Field: ${field}`);
    console.log(`Value: "${value}"`);
    console.log(`Value type: ${typeof value}`);
    console.log(`Value length: ${value ? value.length : 0}`);
    console.log(`Is empty string: ${value === ''}`);
    console.log(`Is null: ${value === null}`);
    console.log(`Is undefined: ${value === undefined}`);
    console.log(`Before change - formData.${field}:`, formData[field]);
    console.log(`========================`);
    
    onInputChange(field, value);
    
    // Log after change
    setTimeout(() => {
      console.log(`After change - formData.${field}:`, formData[field]);
    }, 0);
  };

  const handleTimeChange = (field, value) => {
    console.log(`Time field ${field} changed to:`, value);
    onInputChange(field, value);
  };

  const handleStandFormChange = (field, value) => {
    setStandForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddOrEditStand = (e) => {
    e.preventDefault();
    if (!standForm.name || !standForm.price) return;
    const newStand = { ...standForm, price: parseFloat(standForm.price) };
    if (editingStandIndex !== null) {
      setStands(stands.map((s, i) => (i === editingStandIndex ? newStand : s)));
      setEditingStandIndex(null);
    } else {
      setStands([...stands, newStand]);
    }
    setStandForm({ name: '', description: '', price: '' });
  };

  const handleEditStand = (index) => {
    setStandForm(stands[index]);
    setEditingStandIndex(index);
  };

  const handleRemoveStand = (index) => {
    setStands(stands.filter((_, i) => i !== index));
    setEditingStandIndex(null);
    setStandForm({ name: '', description: '', price: '' });
  };

  const handleApplyStandQuantity = async () => {
    const qty = parseInt(standQuantity, 10);
    if (!qty || qty < 1) return;
    // Validação: valor negativo
    if (standForm.price && parseFloat(standForm.price) < 0) {
      toast({ title: 'Valor inválido', description: 'O valor não pode ser negativo.', variant: 'destructive' });
      return;
    }
    // Validação: nomes duplicados
    const regex = /^(\D+?)\s*(\d+)$/i;
    let maxNum = 0;
    let prefixCount = {};
    let lastPrefix = 'Stand';
    stands.forEach(s => {
      const match = regex.exec(s.name);
      if (match) {
        const prefix = match[1].trim();
        const num = parseInt(match[2], 10);
        if (num > maxNum) {
          maxNum = num;
          lastPrefix = prefix;
        }
        prefixCount[prefix] = (prefixCount[prefix] || 0) + 1;
      }
    });
    const mostCommonPrefix = Object.keys(prefixCount).reduce((a, b) => prefixCount[a] > prefixCount[b] ? a : b, lastPrefix);
    const prefixToUse = standPrefix.trim() || mostCommonPrefix || 'Stand';
    const newStands = Array.from({ length: qty }, (_, i) => ({
      name: `${prefixToUse} ${maxNum + i + 1}`,
      description: standForm.description || '',
      price: standForm.price || ''
    }));
    // Checar nomes duplicados
    const allNames = [...stands.map(s => s.name), ...newStands.map(s => s.name)];
    const hasDuplicate = allNames.length !== new Set(allNames).size;
    if (hasDuplicate) {
      toast({ title: 'Nome duplicado', description: 'Já existe stand com esse nome.', variant: 'destructive' });
      return;
    }
    // Se estiver editando um evento existente, salvar imediatamente no banco
    if (formData.id) {
      try {
        // Inserir stands no banco
        const standRows = newStands.map(s => ({
          event_id: formData.id,
          name: s.name,
          description: s.description,
          price: parseFloat(s.price) || 0,
          status: 'disponivel'
        }));
        const { error: standError } = await supabase.from('event_stands').insert(standRows);
        if (standError) {
          toast({ title: 'Erro ao salvar stands', description: standError.message, variant: 'destructive' });
          return;
        }
        // Buscar lista atualizada do banco
        const { data: standsData, error: fetchError } = await supabase
          .from('event_stands')
          .select('id, name, description, price, status, reserved_by')
          .eq('event_id', formData.id);
        if (!fetchError && Array.isArray(standsData)) {
          setStands(standsData.map(s => ({
            name: s.name,
            description: s.description,
            price: s.price,
            status: s.status,
            id: s.id,
            reserved_by: s.reserved_by
          })));
        }
        toast({ title: 'Stands adicionados', description: `${qty} stand(s) adicionados com sucesso.` });
      } catch (err) {
        toast({ title: 'Erro ao salvar stands', description: err.message, variant: 'destructive' });
      }
      setStandForm({ name: '', description: '', price: '' });
      setEditingStandIndex(null);
      return;
    }
    // Caso contrário, só atualiza o estado local (criação de evento)
    setStands([...stands, ...newStands]);
    setStandForm({ name: '', description: '', price: '' });
    setEditingStandIndex(null);
    toast({ title: 'Stands adicionados', description: `${qty} stand(s) adicionados com sucesso.` });
  };

  const renderDynamicField = (field) => {
    const commonProps = {
      id: `details-${field.key}`,
      value: formData.details?.[field.key] || '',
      onChange: (e) => handleDetailsChange(field.key, e.target.value),
      placeholder: field.placeholder || '',
      className: "mt-1"
    };

    switch (field.type) {
      case 'textarea':
        return <Textarea {...commonProps} />;
      case 'text':
      default:
        return <Input {...commonProps} />;
    }
  };

  // Log form data for debugging
  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  // Sempre que stands mudar, notifica o pai
  useEffect(() => {
    if (onStandsChange) onStandsChange(stands);
  }, [stands, onStandsChange]);

  // Atualiza stands do estado quando a prop mudar (ex: ao abrir para edição)
  useEffect(() => {
    setStands(standsProp || []);
  }, [standsProp]);

  const exportStandsToCSV = () => {
    const filteredStands = stands.filter(stand => {
      const term = searchTerm.toLowerCase();
      return (
        stand.name?.toLowerCase().includes(term) ||
        stand.description?.toLowerCase().includes(term) ||
        String(stand.price).toLowerCase().includes(term)
      );
    });
    const csvRows = [
      ['Nome', 'Descrição', 'Valor (CHF)'],
      ...filteredStands.map(s => [s.name, s.description, s.price])
    ];
    const csvContent = csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'stands.csv');
  };

  // Nova função de submit sem validação obrigatória de plano de taxa
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Evento *</Label>
          <Input 
            id="name" 
            value={formData.name} 
            onChange={(e) => onInputChange('name', e.target.value)} 
            required 
            className={!formData.name ? 'border-red-500' : ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category_id">Categoria do Evento</Label>
          <Select value={formData.category_id || ''} onValueChange={(value) => onInputChange('category_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder={loadingEventCategories ? "Carregando..." : "Selecione a categoria"} />
            </SelectTrigger>
            <SelectContent>
              {!loadingEventCategories && eventCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição *</Label>
        <Textarea 
          id="description" 
          value={formData.description} 
          onChange={(e) => onInputChange('description', e.target.value)} 
          required 
          className={!formData.description ? 'border-red-500' : ''}
        />
      </div>

      <AnimatePresence>
        {selectedCategory?.details_schema && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-4 mt-4 border-t border-dashed"
          >
            <h3 className="font-medium text-gray-800 flex items-center"><Info className="h-4 w-4 mr-2 text-blue-500" /> Detalhes de {selectedCategory.name}</h3>
            {selectedCategory.details_schema.map(field => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`details-${field.key}`}>{field.label}</Label>
                {renderDynamicField(field)}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="start_date">Data de Início *</Label>
          <Input 
            id="start_date" 
            type="date" 
            value={formData.start_date} 
            onChange={(e) => handleDateChange('start_date', e.target.value)} 
            required 
            className={!formData.start_date ? 'border-red-500' : ''}
          />
          {!formData.start_date && (
            <p className="text-xs text-red-500">Data de início é obrigatória</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Data de Término</Label>
          <Input 
            id="end_date" 
            type="date" 
            value={formData.end_date} 
            onChange={(e) => handleDateChange('end_date', e.target.value)} 
          />
          {formData.end_date && (
            <p className="text-xs text-green-500">✓ Data de término definida: {formData.end_date}</p>
          )}
          {!formData.end_date && (
            <p className="text-xs text-gray-500">Opcional - deixe vazio se o evento for em um único dia</p>
          )}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="start_time">Horário de Início *</Label>
          <Input 
            id="start_time" 
            type="time" 
            value={formData.start_time} 
            onChange={(e) => handleTimeChange('start_time', e.target.value)} 
            required 
            className={!formData.start_time ? 'border-red-500' : ''}
          />
          {!formData.start_time && (
            <p className="text-xs text-red-500">Horário de início é obrigatório</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">Horário de Término</Label>
          <Input 
            id="end_time" 
            type="time" 
            value={formData.end_time} 
            onChange={(e) => handleTimeChange('end_time', e.target.value)} 
          />
          {formData.end_time && (
            <p className="text-xs text-green-500">✓ Horário de término definido: {formData.end_time}</p>
          )}
          {!formData.end_time && (
            <p className="text-xs text-gray-500">Opcional - deixe vazio se não houver horário de término específico</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Local *</Label>
        <Input 
          id="location" 
          value={formData.location} 
          onChange={(e) => onInputChange('location', e.target.value)} 
          placeholder="Ex: São Paulo - SP" 
          required 
          className={!formData.location ? 'border-red-500' : ''}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="max_participants">Máximo de Participantes *</Label>
          <Input 
            id="max_participants" 
            type="number" 
            value={formData.max_participants} 
            onChange={(e) => onInputChange('max_participants', e.target.value)} 
            required 
            className={!formData.max_participants ? 'border-red-500' : ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Preço (opcional)</Label>
          <Input id="price" value={formData.price || ''} onChange={(e) => onInputChange('price', e.target.value)} placeholder="Ex: CHF 50.00 ou Gratuito" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="card_image_url">URL da Imagem do Card</Label>
          <div className="relative">
            <Link2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
              id="card_image_url" 
              value={formData.card_image_url || ''} 
              onChange={(e) => onInputChange('card_image_url', e.target.value)} 
              placeholder="https://exemplo.com/imagem-card.jpg"
              className="pl-10"
            />
          </div>
          <p className="text-xs text-gray-500">Recomendado: 400x300 pixels ou 640x360 pixels (proporção 4:3 ou 16:9).</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="banner_image_url">URL da Imagem do Banner</Label>
          <div className="relative">
            <Link2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
              id="banner_image_url" 
              value={formData.banner_image_url || ''} 
              onChange={(e) => onInputChange('banner_image_url', e.target.value)} 
              placeholder="https://exemplo.com/imagem-banner.jpg"
              className="pl-10"
            />
          </div>
          <p className="text-xs text-gray-500">Recomendado: 1200x400 pixels ou 1500x500 pixels (proporção 3:1 ou 4:1).</p>
        </div>
      </div>
      
      {/* Removido campo de Plano de Taxa */}
      
      <div className="space-y-2 pt-4 border-t">
        <Label htmlFor="ad_plan_id" className="flex items-center text-lg font-semibold text-gray-700">
          <Megaphone className="h-5 w-5 mr-2 text-orange-500"/>
          Impulsionar Evento (Opcional)
        </Label>
        <p className="text-sm text-gray-500">Selecione um plano de publicidade para dar mais visibilidade ao seu evento. (Opcional)</p>
        <Select value={formData.ad_plan_id || 'none'} onValueChange={(value) => onInputChange('ad_plan_id', value === 'none' ? null : value)}>
          <SelectTrigger>
            <SelectValue placeholder={'Nenhum plano selecionado'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {adPlans.map(plan => (
              <SelectItem key={plan.id} value={plan.id}>
                <div className="flex flex-col w-full">
                  <div className="flex justify-between items-center w-full">
                    <span>{plan.name} ({plan.platform})</span>
                    <span className="text-green-600 font-semibold">{formatPrice(plan.price)}</span>
                  </div>
                  {plan.description && <p className="text-xs text-gray-500 mt-1">{plan.description}</p>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Seção de Stands/Mesas para Locação (apenas para Feira) */}
      {isFeira && (
        <div className="space-y-4 p-4 border rounded-lg bg-blue-50/30">
          <h3 className="font-semibold text-blue-900 text-lg mb-2">Stands/Mesas para Locação</h3>
          <div className="flex flex-col md:flex-row md:gap-4 items-stretch md:items-end mb-2">
            <div className="w-full md:w-32 mb-2 md:mb-0">
              <Label htmlFor="stand-quantity">Quantidade de Stands/Mesas</Label>
              <Input id="stand-quantity" type="number" min="1" value={standQuantity} onChange={e => setStandQuantity(e.target.value)} placeholder="Ex: 10" />
            </div>
            <div className="w-full md:w-32 mb-2 md:mb-0">
              <Label htmlFor="stand-prefix">Prefixo</Label>
              <Input id="stand-prefix" value={standPrefix} onChange={e => setStandPrefix(e.target.value)} placeholder="Ex: Mesa, Stand" />
            </div>
            <div className="w-full md:w-40 mb-2 md:mb-0">
              <Label htmlFor="stand-batch-desc">Descrição</Label>
              <Input id="stand-batch-desc" value={standForm.description} onChange={e => setStandForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Ex: 4m, 5m, etc." />
            </div>
            <div className="w-full md:w-32 mb-2 md:mb-0">
              <Label htmlFor="stand-batch-price">Valor (CHF)</Label>
              <Input id="stand-batch-price" type="number" min="0" step="0.01" value={standForm.price} onChange={e => setStandForm(prev => ({ ...prev, price: e.target.value }))} placeholder="Ex: 300.00" />
            </div>
            <div className="w-full md:w-auto">
              <Button type="button" className="h-10 mt-2 md:mt-6 w-full md:w-auto" onClick={handleApplyStandQuantity}>Aplicar</Button>
            </div>
          </div>
          {/* Campo de busca e botão de exportação */}
          <div className="mb-2 flex flex-col md:flex-row md:items-center md:gap-4">
            <Input
              type="text"
              placeholder="Buscar stand por nome, descrição ou valor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2"
            />
            <Button type="button" className="mt-2 md:mt-0" onClick={exportStandsToCSV}>Exportar CSV</Button>
          </div>
          {/* Tabela de stands filtrada */}
          {stands.length > 0 && (
            <div className="mt-4">
              <table className="min-w-full bg-white border rounded shadow text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left">Nome</th>
                    <th className="px-3 py-2 text-left">Descrição</th>
                    <th className="px-3 py-2 text-left">Valor (CHF)</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {stands
                    .filter(stand => {
                      const term = searchTerm.toLowerCase();
                      return (
                        stand.name?.toLowerCase().includes(term) ||
                        stand.description?.toLowerCase().includes(term) ||
                        String(stand.price).toLowerCase().includes(term)
                      );
                    })
                    .map((stand, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-3 py-2 font-medium">
                          <Input
                            value={stand.name}
                            onChange={e => {
                              const updated = [...stands];
                              updated[idx].name = e.target.value;
                              setStands(updated);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={stand.description}
                            onChange={e => {
                              const updated = [...stands];
                              updated[idx].description = e.target.value;
                              setStands(updated);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={stand.price}
                            onChange={e => {
                              const updated = [...stands];
                              updated[idx].price = e.target.value;
                              setStands(updated);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Select value={stand.status || 'disponivel'} onValueChange={value => {
                            const updated = [...stands];
                            updated[idx].status = value;
                            setStands(updated);
                          }}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="disponivel">Disponível</SelectItem>
                              <SelectItem value="reservado">Reservado</SelectItem>
                              <SelectItem value="vendido">Vendido</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" type="button" onClick={() => setStandToRemove(idx)}>Remover</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza que deseja remover este stand?</AlertDialogTitle>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setStandToRemove(null)}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => {
                                  const updated = stands.filter((_, i) => i !== standToRemove);
                                  setStands(updated);
                                  setStandToRemove(null);
                                  toast({ title: 'Stand removido', description: 'Stand removido com sucesso.' });
                                }}>Remover</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="btn-primary text-white">{submitButtonText}</Button>
      </DialogFooter>
    </form>
  );
};

export default OrganizerEventForm;