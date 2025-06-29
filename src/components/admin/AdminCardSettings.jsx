import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Trash2, Edit3, Save } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"

const AdminCardSettings = ({ settings: initialSettings, onSave, loading }) => {
  const [fields, setFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [editingLabel, setEditingLabel] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (initialSettings && initialSettings.length > 0) {
      setFields(initialSettings.sort((a, b) => a.is_custom - b.is_custom || a.id - b.id));
    }
  }, [initialSettings]);

  const handleVisibilityChange = (fieldName, isVisible) => {
    setFields(fields.map(f => f.field_name === fieldName ? { ...f, is_visible: isVisible } : f));
  };

  const handleAddNewField = async () => {
    if (!newFieldName.trim() || !newFieldLabel.trim()) {
      toast({ title: "Erro", description: "Nome técnico e rótulo do campo são obrigatórios.", variant: "destructive" });
      return;
    }
    if (fields.some(f => f.field_name === newFieldName.trim().toLowerCase().replace(/\s+/g, '_'))) {
      toast({ title: "Erro", description: "Nome técnico do campo já existe.", variant: "destructive" });
      return;
    }

    const newField = {
      field_name: newFieldName.trim().toLowerCase().replace(/\s+/g, '_'),
      label: newFieldLabel.trim(),
      is_visible: true,
      is_custom: true
    };

    setFields([...fields, newField]);
    setNewFieldName('');
    setNewFieldLabel('');
    toast({ title: "Campo personalizado adicionado temporariamente", description: "Salve as configurações para persistir."})
  };

  const handleRemoveField = (fieldName) => {
    setFields(fields.filter(f => f.field_name !== fieldName));
     toast({ title: "Campo personalizado removido temporariamente", description: "Salve as configurações para persistir."})
  };
  
  const handleStartEditLabel = (field) => {
    setEditingField(field.field_name);
    setEditingLabel(field.label);
  };

  const handleSaveEditLabel = (fieldName) => {
    setFields(fields.map(f => f.field_name === fieldName ? { ...f, label: editingLabel } : f));
    setEditingField(null);
    setEditingLabel('');
  };

  const handleSaveChanges = () => {
    onSave(fields);
  };

  return (
    <Card className="shadow-xl border-0 rounded-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">Configurações de Campos do Card de Evento</CardTitle>
        <CardDescription className="text-gray-600">
          Defina quais informações serão exibidas nos cards de evento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Campos Padrão</h3>
          <div className="space-y-3">
            {fields.filter(f => !f.is_custom).map(field => (
              <div key={field.field_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`field-${field.field_name}`}
                    checked={field.is_visible}
                    onCheckedChange={(checked) => handleVisibilityChange(field.field_name, checked)}
                    disabled={loading}
                  />
                  <Label htmlFor={`field-${field.field_name}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                    {field.label}
                  </Label>
                </div>
                 <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">Padrão</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Campos Personalizados</h3>
          {fields.filter(f => f.is_custom).length === 0 && (
            <p className="text-sm text-gray-500">Nenhum campo personalizado adicionado ainda.</p>
          )}
          <div className="space-y-3">
            {fields.filter(f => f.is_custom).map(field => (
              <div key={field.field_name} className="flex items-center justify-between p-3 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
                <div className="flex items-center space-x-3 flex-grow">
                  <Checkbox
                    id={`field-${field.field_name}`}
                    checked={field.is_visible}
                    onCheckedChange={(checked) => handleVisibilityChange(field.field_name, checked)}
                    disabled={loading}
                  />
                  {editingField === field.field_name ? (
                    <Input 
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      className="text-sm flex-grow"
                      disabled={loading}
                    />
                  ) : (
                    <Label htmlFor={`field-${field.field_name}`} className="text-sm font-medium text-blue-700 cursor-pointer">
                      {field.label}
                    </Label>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {editingField === field.field_name ? (
                     <Button variant="ghost" size="icon" onClick={() => handleSaveEditLabel(field.field_name)} disabled={loading} className="text-green-600 hover:text-green-700">
                       <Save className="h-4 w-4" />
                     </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => handleStartEditLabel(field)} disabled={loading} className="text-gray-600 hover:text-gray-700">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon" disabled={loading} className="text-red-600 hover:text-red-700">
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover o campo personalizado "{field.label}"? Esta ação não pode ser desfeita após salvar as configurações.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemoveField(field.field_name)} disabled={loading} className="bg-red-600 hover:bg-red-700">
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Adicionar Novo Campo Personalizado</h3>
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="new-field-name">Nome Técnico (ex: cor_camiseta)</Label>
              <Input 
                id="new-field-name" 
                value={newFieldName} 
                onChange={(e) => setNewFieldName(e.target.value)} 
                placeholder="nome_unico_campo"
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-field-label">Rótulo (ex: Cor da Camiseta)</Label>
              <Input 
                id="new-field-label" 
                value={newFieldLabel} 
                onChange={(e) => setNewFieldLabel(e.target.value)} 
                placeholder="Como aparecerá no card"
                disabled={loading}
              />
            </div>
            <Button onClick={handleAddNewField} disabled={loading || !newFieldName.trim() || !newFieldLabel.trim()} className="btn-outline w-full sm:w-auto">
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Campo
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveChanges} disabled={loading} className="btn-primary text-white w-full sm:w-auto">
          {loading ? "Salvando..." : "Salvar Configurações dos Campos"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminCardSettings;