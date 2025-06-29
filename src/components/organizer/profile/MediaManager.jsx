import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, UserCircle, Image as ImageIcon, Trash2, FileText } from 'lucide-react';

const MediaManager = ({ formData, handleFileChange, handleRemoveFile, isEditing, loadingSubmit }) => {
  return (
    <Card className="shadow-lg rounded-xl mt-4">
      <CardHeader><CardTitle>Mídia e Documentos da Empresa</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['logo', 'profile', 'banner'].map(type => {
            const title = type === 'logo' ? 'Logo da Empresa' : type === 'profile' ? 'Foto de Perfil' : 'Imagem de Banner';
            const icon = type === 'logo' ? Building : type === 'profile' ? UserCircle : ImageIcon;
            return (
              <div key={type} className="space-y-2">
                <Label className="font-semibold text-gray-700 flex items-center">{React.createElement(icon, { className: "h-4 w-4 mr-2 text-orange-500" })} {title}</Label>
                <div className="relative w-40 h-40 border rounded-md p-2 flex items-center justify-center bg-gray-50">
                  {formData[type + '_url'] ? (
                    <>
                      <img-replace src={formData[type + '_url']} alt={`Preview ${type}`} className="max-w-full max-h-full object-contain" />
                      {isEditing && (
                        <Button type="button" variant="destructive" size="icon" className="absolute -top-3 -right-3 rounded-full h-8 w-8" onClick={() => handleRemoveFile(type)} disabled={loadingSubmit}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  ) : <span className="text-xs text-gray-400">Sem imagem</span>}
                </div>
                {isEditing && <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files[0], type)} disabled={loadingSubmit} className="h-11" />}
              </div>
            );
          })}
        </div>
        <div className="space-y-2 pt-6 border-t">
          <Label className="font-semibold text-gray-700 flex items-center"><FileText className="h-4 w-4 mr-2 text-orange-500" /> Material de Divulgação (PDF)</Label>
          {formData.document_url ? (
            <div className="flex items-center gap-4 p-3 border rounded-md bg-gray-50">
              <FileText className="h-8 w-8 text-blue-600" />
              <a href={formData.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium break-all">{formData.document_filename || 'Ver Documento'}</a>
              <div className="flex-grow" />
              {isEditing && (
                <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleRemoveFile('document')} disabled={loadingSubmit}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (isEditing && <p className="text-sm text-gray-500">Nenhum documento enviado.</p>)}
          {isEditing && <Input type="file" accept=".pdf" onChange={(e) => handleFileChange(e.target.files[0], 'document')} disabled={loadingSubmit} className="h-11" />}
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaManager;