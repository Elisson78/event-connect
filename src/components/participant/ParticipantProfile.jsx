
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Phone, Home, Camera, Save, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

const ParticipantProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { refetchProfile } = useProfile();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setAvatarPreview(user.avatar_url || '');
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return 'P';
    const names = nameStr.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    let newAvatarUrl = user.avatar_url;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('user_files') 
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('user_files')
          .getPublicUrl(filePath);
        newAvatarUrl = urlData.publicUrl;
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast({
          title: "Erro no Upload",
          description: "Falha ao carregar a nova foto de perfil. Tente novamente.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    const updates = {
      name,
      phone,
      address,
      avatar_url: newAvatarUrl,
    };

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      await refetchProfile();

      toast({
        title: "Perfil Atualizado!",
        description: "Seus dados foram salvos com sucesso.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro ao Atualizar",
        description: "Não foi possível salvar suas alterações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading || !user) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="max-w-2xl mx-auto shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
          <div className="flex flex-col items-center sm:flex-row sm:items-start">
            <div className="relative mb-4 sm:mb-0 sm:mr-6">
              <Avatar className="h-32 w-32 border-4 border-blue-300 shadow-lg">
                <AvatarImage src={avatarPreview || undefined} alt={name} />
                <AvatarFallback className="text-4xl bg-blue-400 text-white">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label htmlFor="avatarUpload" className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-gray-100 transition-colors">
                  <Camera className="h-5 w-5 text-blue-600" />
                  <input id="avatarUpload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              )}
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-center sm:text-left">{name || 'Nome do Participante'}</CardTitle>
              <CardDescription className="text-blue-100 text-center sm:text-left mt-1">{email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="font-semibold text-gray-700 flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-500" /> Nome Completo
                </Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  disabled={!isEditing || loading}
                  className="mt-1 h-11" 
                />
              </div>
              <div>
                <Label htmlFor="email" className="font-semibold text-gray-700 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-blue-500" /> Email
                </Label>
                <Input id="email" type="email" value={email} disabled className="mt-1 h-11 bg-gray-100 cursor-not-allowed" />
                <p className="text-xs text-gray-500 mt-1">O e-mail não pode ser alterado aqui.</p>
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="font-semibold text-gray-700 flex items-center">
                <Phone className="h-4 w-4 mr-2 text-blue-500" /> Telefone
              </Label>
              <Input 
                id="phone" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="(XX) XXXXX-XXXX"
                disabled={!isEditing || loading}
                className="mt-1 h-11" 
              />
            </div>

            <div>
              <Label htmlFor="address" className="font-semibold text-gray-700 flex items-center">
                <Home className="h-4 w-4 mr-2 text-blue-500" /> Endereço
              </Label>
              <Input 
                id="address" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                placeholder="Sua rua, número, bairro, cidade..."
                disabled={!isEditing || loading}
                className="mt-1 h-11" 
              />
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 p-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            {isEditing ? (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    if(user) {
                      setName(user.name || '');
                      setPhone(user.phone || '');
                      setAddress(user.address || '');
                      setAvatarPreview(user.avatar_url || '');
                      setAvatarFile(null);
                    }
                  }}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="btn-primary text-white w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </>
            ) : (
              <Button 
                type="button" 
                onClick={() => setIsEditing(true)} 
                className="btn-primary text-white w-full sm:w-auto"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};

export default ParticipantProfile;
