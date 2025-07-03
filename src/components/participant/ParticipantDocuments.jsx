import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/contexts/ProfileContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Award, Badge, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateCertificatePdf, generateBadgePdf } from '@/lib/pdfGenerator';

const ParticipantDocuments = () => {
  const { profile } = useProfile();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDocs() {
      if (!profile) return;
      setLoading(true);
      // Busca todas as inscrições confirmadas do participante
      const { data, error } = await supabase
        .from('registrations')
        .select('id, event_id, registration_code, status, participant_name, participant_email, events(name, start_date, certificate_enabled)')
        .eq('participant_email', profile.email)
        .eq('status', 'confirmed');
      if (!error && data) {
        setDocs(data);
      }
      setLoading(false);
    }
    fetchDocs();
  }, [profile]);

  const handleDownloadCertificate = (doc) => {
    generateCertificatePdf(doc, doc.events);
  };
  const handleDownloadBadge = (doc) => {
    generateBadgePdf(doc, doc.events);
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Carregando seus documentos...</div>;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Award className="h-6 w-6 text-yellow-500" />
          Documentos
        </CardTitle>
        <CardDescription>Baixe aqui seus certificados, crachás e comprovantes de inscrição.</CardDescription>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <div className="text-gray-500">Nenhum documento disponível no momento.</div>
        ) : (
          <ul className="space-y-4">
            {docs.map(doc => (
              <li key={doc.id} className="border rounded-lg p-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1">
                  <div className="font-bold text-lg text-blue-800">{doc.events?.name || 'Evento'}</div>
                  <div className="text-sm text-gray-700">Data: {doc.events?.start_date ? new Date(doc.events.start_date).toLocaleDateString('pt-BR') : '-'}</div>
                  <div className="text-xs text-gray-500">Código: {doc.registration_code}</div>
                  <div className="text-xs text-gray-500">E-mail: {doc.participant_email}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {doc.events?.certificate_enabled && (
                    <Button size="sm" variant="outline" onClick={() => handleDownloadCertificate(doc)}>
                      <Award className="h-4 w-4 mr-1" /> Certificado
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDownloadBadge(doc)}>
                    <Badge className="h-4 w-4 mr-1" /> Crachá
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    <FileText className="h-4 w-4 mr-1" /> Comprovante
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ParticipantDocuments; 