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

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="btn-primary text-white">{submitButtonText}</Button>
      </DialogFooter>
    </form>
  );
};

export default OrganizerEventForm;