import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Save, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileForm from './profile/ProfileForm';
import MediaManager from './profile/MediaManager';
import CertificateGenerator from './profile/CertificateGenerator';

const OrganizerProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { refetchProfile } = useProfile();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '', company_name: '', company_id_number: '', company_phone: '',
    company_address: '', email: '', bio: '', website_url: '', logo_url: '',
    profile_image_url: '', banner_image_url: '', document_url: '', document_filename: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const resetFormState = useCallback((currentUser) => {
    if (!currentUser) return;
    setFormData({
      name: currentUser.name || '',
      company_name: currentUser.company_name || '',
      company_id_number: currentUser.company_id_number || '',
      company_phone: currentUser.company_phone || '',
      company_address: currentUser.company_address || '',
      email: currentUser.email || '',
      bio: currentUser.bio || '',
      website_url: currentUser.website_url || '',
      logo_url: currentUser.logo_url || '',
      profile_image_url: currentUser.profile_image_url || '',
      banner_image_url: currentUser.banner_image_url || '',
      document_url: currentUser.document_url || '',
      document_filename: currentUser.document_filename || '',
    });
    setLogoFile(null);
    setProfileImageFile(null);
    setBannerImageFile(null);
    setDocumentFile(null);
  }, []);

  useEffect(() => {
    if (user) {
      resetFormState(user);
    }
  }, [user, resetFormState]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file, type) => {
    if (!file) return;
    if (type === 'logo') setLogoFile(file);
    else if (type === 'profile') setProfileImageFile(file);
    else if (type === 'banner') setBannerImageFile(file);
    else if (type === 'document') {
      if (file.type !== 'application/pdf') {
        toast({ title: "Arquivo Inválido", description: "Por favor, selecione um arquivo PDF.", variant: "destructive" });
        return;
      }
      setDocumentFile(file);
      handleInputChange('document_filename', file.name);
    }
    if (type !== 'document') {
      handleInputChange(`${type}_url`, URL.createObjectURL(file));
    }
  };

  const extractPathFromUrl = (url) => {
    if (!url) return null;
    try {
      const urlObject = new URL(url);
      const path = urlObject.pathname.split('/user_files/')[1];
      return path ? decodeURIComponent(path) : null;
    } catch (error) {
      console.error("Invalid URL for path extraction:", url, error);
      return null;
    }
  };

  const handleRemoveFile = async (type) => {
    if (!user) return;
    const urlToDelete = user[type + '_url'];
    const path = extractPathFromUrl(urlToDelete);
    if (!path) {
      toast({ title: "Erro", description: "Não foi possível encontrar o caminho do arquivo para remover.", variant: "destructive" });
      return;
    }

    setLoadingSubmit(true);
    try {
      const { error: deleteError } = await supabase.storage.from('user_files').remove([path]);
      if (deleteError) throw deleteError;

      const updateData = { [type + '_url']: null };
      if (type === 'document') {
        updateData.document_filename = null;
      }

      const { error: dbError } = await supabase.from('users').update(updateData).eq('id', user.id);
      if (dbError) throw dbError;

      handleInputChange(type + '_url', '');
      if (type === 'document') handleInputChange('document_filename', '');

      await refetchProfile();
      toast({ title: "Arquivo Removido", description: "O arquivo foi removido com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao remover arquivo", description: error.message, variant: "destructive" });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const uploadFile = async (file, bucketFolder, userId) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${bucketFolder}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('user_files').upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('user_files').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoadingSubmit(true);

    try {
      const updates = {};

      if (logoFile) updates.logo_url = await uploadFile(logoFile, 'logos', user.id);
      if (profileImageFile) updates.profile_image_url = await uploadFile(profileImageFile, 'profile_pics', user.id);
      if (bannerImageFile) updates.banner_image_url = await uploadFile(bannerImageFile, 'banners', user.id);
      if (documentFile) {
        updates.document_url = await uploadFile(documentFile, 'documents', user.id);
        updates.document_filename = documentFile.name;
      }

      if (updates.profile_image_url || updates.logo_url) {
        updates.avatar_url = updates.profile_image_url || updates.logo_url;
      }

      const textFields = ['name', 'company_name', 'company_id_number', 'company_phone', 'company_address', 'bio', 'website_url'];
      textFields.forEach(field => {
        if (formData[field] !== user[field]) {
          updates[field] = formData[field];
        }
      });
      
      if (!documentFile && formData.document_filename !== user.document_filename) {
          updates.document_filename = formData.document_filename;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('users').update(updates).eq('id', user.id);
        if (error) throw error;
      }

      await refetchProfile();

      toast({ title: "Perfil Atualizado!", description: "Seus dados foram salvos com sucesso." });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: "Erro ao Atualizar", description: `Não foi possível salvar: ${error.message}`, variant: "destructive" });
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (authLoading || !user) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="profile">Perfil da Empresa</TabsTrigger>
            <TabsTrigger value="media">Mídia e Documentos</TabsTrigger>
            <TabsTrigger value="certificates">Certificados e Crachás</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileForm
              formData={formData}
              handleInputChange={handleInputChange}
              isEditing={isEditing}
              loadingSubmit={loadingSubmit}
              handleFileChange={handleFileChange}
            />
          </TabsContent>
          
          <TabsContent value="media">
            <MediaManager
              formData={formData}
              handleFileChange={handleFileChange}
              handleRemoveFile={handleRemoveFile}
              isEditing={isEditing}
              loadingSubmit={loadingSubmit}
            />
          </TabsContent>

          <TabsContent value="certificates">
            <CertificateGenerator />
          </TabsContent>
        </Tabs>

        <CardFooter className="bg-gray-50 p-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-4 rounded-b-xl border-t">
          {isEditing ? (
            <>
              <Button type="button" variant="outline" onClick={() => { setIsEditing(false); resetFormState(user); }} disabled={loadingSubmit} className="w-full sm:w-auto">Cancelar</Button>
              <Button type="submit" disabled={loadingSubmit} className="btn-primary text-white w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {loadingSubmit ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => setIsEditing(true)} className="btn-primary text-white w-full sm:w-auto">
              <Edit3 className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          )}
        </CardFooter>
      </form>
    </motion.div>
  );
};

export default OrganizerProfile;
