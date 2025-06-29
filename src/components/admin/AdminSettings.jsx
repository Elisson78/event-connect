import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Upload, Eye, History, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const AdminSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;

      const settingsMap = data.reduce((acc, setting) => {
        if (!acc[setting.category]) acc[setting.category] = {};
        acc[setting.category][setting.setting_key] = {
          ...setting,
          value: setting.setting_value
        };
        return acc;
      }, {});

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: {
          ...prev[category][key],
          value: value
        }
      }
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updates = [];
      const history = [];

      for (const category in settings) {
        for (const key in settings[category]) {
          const setting = settings[category][key];
          updates.push({
            id: setting.id,
            setting_value: setting.value,
            updated_at: new Date().toISOString(),
            updated_by: user.id
          });

          history.push({
            setting_id: setting.id,
            old_value: setting.setting_value,
            new_value: setting.value,
            changed_by: user.id,
            changed_at: new Date().toISOString(),
            change_reason: 'Admin panel update'
          });
        }
      }

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            setting_value: update.setting_value,
            updated_at: update.updated_at,
            updated_by: update.updated_by
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      for (const historyEntry of history) {
        if (historyEntry.old_value !== historyEntry.new_value) {
          const { error } = await supabase
            .from('settings_history')
            .insert(historyEntry);

          if (error) console.error('Error saving history:', error);
        }
      }

      toast({
        title: "Configurações salvas!",
        description: "Todas as configurações foram atualizadas com sucesso.",
      });

      await fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (category, key, setting) => {
    const value = setting.value || '';
    const fieldId = `${category}-${key}`;

    switch (setting.setting_type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <Input
            id={fieldId}
            type={setting.setting_type}
            value={value}
            onChange={(e) => handleSettingChange(category, key, e.target.value)}
            placeholder={setting.description}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleSettingChange(category, key, e.target.value)}
            placeholder={setting.description}
            rows={3}
          />
        );

      case 'toggle':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={value === 'true'}
              onCheckedChange={(checked) => handleSettingChange(category, key, checked ? 'true' : 'false')}
            />
            <Label htmlFor={fieldId} className="text-sm text-gray-600">
              {value === 'true' ? 'Ativado' : 'Desativado'}
            </Label>
          </div>
        );

      case 'select':
        const options = getSelectOptions(key);
        return (
          <Select value={value} onValueChange={(newValue) => handleSettingChange(category, key, newValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <Input
              id={fieldId}
              type="color"
              value={value}
              onChange={(e) => handleSettingChange(category, key, e.target.value)}
              className="w-16 h-10"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => handleSettingChange(category, key, e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            <Input
              id={fieldId}
              type="url"
              value={value}
              onChange={(e) => handleSettingChange(category, key, e.target.value)}
              placeholder="URL da imagem"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toast({
                title: "🚧 Funcionalidade em Breve!",
                description: "O upload de imagens será implementado em breve!",
              })}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        );

      default:
        return (
          <Input
            id={fieldId}
            value={value}
            onChange={(e) => handleSettingChange(category, key, e.target.value)}
            placeholder={setting.description}
          />
        );
    }
  };

  const getSelectOptions = (key) => {
    switch (key) {
      case 'timezone':
        return [
          { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
          { value: 'America/New_York', label: 'Nova York (UTC-5)' },
          { value: 'Europe/London', label: 'Londres (UTC+0)' },
          { value: 'Asia/Tokyo', label: 'Tóquio (UTC+9)' }
        ];
      case 'default_language':
        return [
          { value: 'pt-BR', label: 'Português (Brasil)' },
          { value: 'en-US', label: 'English (US)' },
          { value: 'es-ES', label: 'Español' }
        ];
      default:
        return [];
    }
  };

  const getCategoryTitle = (category) => {
    const titles = {
      geral: 'Configurações Gerais',
      seo: 'SEO e Analytics',
      redes_sociais: 'Redes Sociais',
      aparencia: 'Aparência'
    };
    return titles[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações do Site</h2>
          <p className="text-gray-600">Gerencie as configurações globais da plataforma</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Sair da Pré-visualização' : 'Pré-visualizar'}
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="redes_sociais">Redes Sociais</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
        </TabsList>

        {Object.keys(settings).map((category) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>{getCategoryTitle(category)}</span>
                  <Button variant="ghost" size="sm">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.keys(settings[category]).map((key) => {
                  const setting = settings[category][key];
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`${category}-${key}`} className="font-medium">
                          {setting.label}
                        </Label>
                        {setting.description && (
                          <span className="text-xs text-gray-500" title={setting.description}>
                            <HelpCircle className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      {renderField(category, key, setting)}
                      {setting.description && (
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
};

export default AdminSettings;