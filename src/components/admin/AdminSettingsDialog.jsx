import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette } from 'lucide-react';

const AdminSettingsDialog = ({ isOpen, onOpenChange, settings, onSettingsChange, onSave }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Configurações da Plataforma</span>
          </DialogTitle>
          <DialogDescription>
            Personalize a aparência e configurações da plataforma
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="platform-name">Nome da Plataforma</Label>
            <Input
              id="platform-name"
              value={settings.platform_name}
              onChange={(e) => onSettingsChange('platform_name', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="logo-url">URL do Logo</Label>
            <Input
              id="logo-url"
              value={settings.logo_url}
              onChange={(e) => onSettingsChange('logo_url', e.target.value)}
              placeholder="https://exemplo.com/logo.png"
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Cor Primária</Label>
              <div className="flex space-x-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => onSettingsChange('primary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => onSettingsChange('primary_color', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondary-color">Cor Secundária</Label>
              <div className="flex space-x-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => onSettingsChange('secondary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings.secondary_color}
                  onChange={(e) => onSettingsChange('secondary_color', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-100 rounded-lg">
            <h4 className="font-medium mb-2">Pré-visualização</h4>
            <div className="flex items-center space-x-4">
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: settings.primary_color }}
              ></div>
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: settings.secondary_color }}
              ></div>
              <span className="font-bold text-lg" style={{ color: settings.primary_color }}>
                {settings.platform_name}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave} className="btn-primary text-white">
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSettingsDialog;