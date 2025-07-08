import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, User, Mail, Phone, MapPin, Link2, Tag } from 'lucide-react';

const getInitials = (nameStr) => {
  if (!nameStr) return 'O';
  const names = nameStr.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : nameStr.substring(0, 2).toUpperCase();
};

const ProfileForm = ({ formData, handleInputChange, isEditing, loadingSubmit, handleFileChange }) => {
  return (
    <Card className="shadow-lg rounded-xl overflow-hidden mt-4">
      <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 p-8 text-white">
        <div className="flex flex-col items-center sm:flex-row sm:items-start">
          <label htmlFor="profile-logo-upload" className="cursor-pointer group relative">
            <Avatar className="h-32 w-32 border-4 border-slate-500 shadow-lg bg-slate-600 group-hover:opacity-80 transition-opacity">
            <AvatarImage src={formData.logo_url || formData.profile_image_url || undefined} alt={formData.company_name || formData.name} />
            <AvatarFallback className="text-4xl">{getInitials(formData.company_name || formData.name)}</AvatarFallback>
          </Avatar>
            <input
              id="profile-logo-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => e.target.files && e.target.files[0] && handleFileChange(e.target.files[0], 'logo')}
              disabled={loadingSubmit}
            />
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Trocar foto/logo</span>
          </label>
          <div className="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left">
            <CardTitle className="text-3xl font-bold">{formData.company_name || formData.name || 'Nome da Empresa/Organizador'}</CardTitle>
            <CardDescription className="text-slate-300 mt-1">{formData.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
          <div className="space-y-1">
            <Label htmlFor="company_name" className="font-semibold text-gray-700 flex items-center"><Building className="h-4 w-4 mr-2 text-orange-500" /> Nome da Empresa</Label>
            <Input id="company_name" value={formData.company_name} onChange={(e) => handleInputChange('company_name', e.target.value)} disabled={!isEditing || loadingSubmit} className="h-11" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name" className="font-semibold text-gray-700 flex items-center"><User className="h-4 w-4 mr-2 text-orange-500" /> Seu Nome (Contato Principal)</Label>
            <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} disabled={!isEditing || loadingSubmit} className="h-11" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className="font-semibold text-gray-700 flex items-center"><Mail className="h-4 w-4 mr-2 text-orange-500" /> Email de Contato</Label>
            <Input id="email" type="email" value={formData.email} disabled className="h-11 bg-gray-100 cursor-not-allowed" />
            <p className="text-xs text-gray-500 mt-1">O e-mail de login não pode ser alterado aqui.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="company_id_number" className="font-semibold text-gray-700 flex items-center"><Tag className="h-4 w-4 mr-2 text-orange-500" /> CNPJ / ID da Empresa</Label>
            <Input id="company_id_number" value={formData.company_id_number} onChange={(e) => handleInputChange('company_id_number', e.target.value)} disabled={!isEditing || loadingSubmit} className="h-11" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="company_phone" className="font-semibold text-gray-700 flex items-center"><Phone className="h-4 w-4 mr-2 text-orange-500" /> Telefone da Empresa</Label>
            <Input id="company_phone" value={formData.company_phone} onChange={(e) => handleInputChange('company_phone', e.target.value)} placeholder="(XX) XXXXX-XXXX" disabled={!isEditing || loadingSubmit} className="h-11" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="company_address" className="font-semibold text-gray-700 flex items-center"><MapPin className="h-4 w-4 mr-2 text-orange-500" /> Endereço da Empresa</Label>
            <Input id="company_address" value={formData.company_address} onChange={(e) => handleInputChange('company_address', e.target.value)} placeholder="Rua, Número, Bairro, Cidade - Estado" disabled={!isEditing || loadingSubmit} className="h-11" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="website_url" className="font-semibold text-gray-700 flex items-center"><Link2 className="h-4 w-4 mr-2 text-orange-500" /> Website da Empresa</Label>
            <Input id="website_url" value={formData.website_url} onChange={(e) => handleInputChange('website_url', e.target.value)} placeholder="https://suaempresa.com" disabled={!isEditing || loadingSubmit} className="h-11" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="bio" className="font-semibold text-gray-700 flex items-center"><User className="h-4 w-4 mr-2 text-orange-500" /> Sobre a Empresa / Organizador (Bio)</Label>
            <Textarea id="bio" value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} placeholder="Descreva sua empresa, sua missão, etc." disabled={!isEditing || loadingSubmit} rows={4} />
          </div>
          <div className="space-y-1 md:col-span-2 flex items-center mt-2">
            <input
              type="checkbox"
              id="is_nonprofit"
              checked={!!formData.is_nonprofit}
              onChange={e => handleInputChange('is_nonprofit', e.target.checked)}
              disabled={!isEditing || loadingSubmit}
              className="h-5 w-5 mr-2 accent-orange-500"
            />
            <Label htmlFor="is_nonprofit" className="font-semibold text-gray-700 flex items-center">
              <span className="ml-1">Instituição sem fins lucrativos</span>
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;