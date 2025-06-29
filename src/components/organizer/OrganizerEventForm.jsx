import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { Link2, Megaphone, Info } from 'lucide-react';
import { useEvents } from '@/contexts/EventContext';
import { motion, AnimatePresence } from 'framer-motion';

const OrganizerEventForm = ({ formData, onInputChange, onSubmit, onCancel, submitButtonText = "Criar Evento" }) => {
  const { adPlans, loadingAdPlans, eventCategories, loadingEventCategories } = useEvents();
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (formData.category_id && eventCategories.length > 0) {
      const category = eventCategories.find(c => c.id === formData.category_id);
      setSelectedCategory(category);
    } else {
      setSelectedCategory(null);
    }
  }, [formData.category_id, eventCategories]);

  const handleDetailsChange = (key, value) => {
    onInputChange('details', {
      ...formData.details,
      [key]: value,
    });
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

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Evento</Label>
          <Input id="name" value={formData.name} onChange={(e) => onInputChange('name', e.target.value)} required />
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
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => onInputChange('description', e.target.value)} required />
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
          <Label htmlFor="date">Data</Label>
          <Input id="date" type="date" value={formData.date} onChange={(e) => onInputChange('date', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Horário</Label>
          <Input id="time" type="time" value={formData.time} onChange={(e) => onInputChange('time', e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Local</Label>
        <Input id="location" value={formData.location} onChange={(e) => onInputChange('location', e.target.value)} placeholder="Ex: São Paulo - SP" required />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="max_participants">Máximo de Participantes</Label>
          <Input id="max_participants" type="number" value={formData.max_participants} onChange={(e) => onInputChange('max_participants', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Preço (opcional)</Label>
          <Input id="price" value={formData.price || ''} onChange={(e) => onInputChange('price', e.target.value)} placeholder="Ex: R$ 50,00 ou Gratuito" />
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
      
      <div className="space-y-2 pt-4 border-t">
        <Label htmlFor="ad_plan_id" className="flex items-center text-lg font-semibold text-gray-700">
          <Megaphone className="h-5 w-5 mr-2 text-orange-500"/>
          Impulsionar Evento (Opcional)
        </Label>
        <p className="text-sm text-gray-500">Selecione um plano de publicidade para dar mais visibilidade ao seu evento.</p>
        <Select value={formData.ad_plan_id || 'none'} onValueChange={(value) => onInputChange('ad_plan_id', value === 'none' ? null : value)}>
          <SelectTrigger>
            <SelectValue placeholder={loadingAdPlans ? 'Carregando planos...' : 'Nenhum plano selecionado'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {adPlans.map(plan => (
              <SelectItem key={plan.id} value={plan.id}>
                <div className="flex justify-between items-center w-full">
                  <span>{plan.name} ({plan.platform})</span>
                  <span className="text-green-600 font-semibold">R$ {plan.price}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="btn-primary text-white">{submitButtonText}</Button>
      </DialogFooter>
    </form>
  );
};

export default OrganizerEventForm;