import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateCertificatePdf = (participant, event) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  doc.addFont('Helvetica', 'normal', 'normal');
  doc.addFont('Helvetica', 'bold', 'bold');
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(26, 115, 232);
  doc.setLineWidth(2);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

  doc.setFontSize(36);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(26, 115, 232);
  doc.text('Certificado de Participação', pageWidth / 2, 40, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  doc.text('Este certificado é concedido a', pageWidth / 2, 70, { align: 'center' });

  doc.setFontSize(28);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(255, 140, 0); 
  doc.text(participant.name, pageWidth / 2, 90, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  const text = `pela sua participação no evento "${event.name}", realizado em ${new Date(event.date).toLocaleDateString('pt-BR')}.`;
  const splitText = doc.splitTextToSize(text, pageWidth - 40);
  doc.text(splitText, pageWidth / 2, 110, { align: 'center' });

  const organizerName = event.organizer?.company_name || event.organizer?.name || 'A Organização';
  doc.setFontSize(14);
  doc.text(organizerName, pageWidth / 2, pageHeight - 40, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(pageWidth/2 - 50, pageHeight - 45, pageWidth/2 + 50, pageHeight - 45);
  doc.text('Organizador do Evento', pageWidth / 2, pageHeight - 35, { align: 'center' });
  
  doc.save(`certificado-${participant.name.replace(/ /g, '_')}-${event.name.replace(/ /g, '_')}.pdf`);
};

export const generateBadgePdf = (participant, event) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [70, 100] // Tamanho de um crachá padrão
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.addFont('Helvetica', 'normal', 'normal');
  doc.addFont('Helvetica', 'bold', 'bold');
  
  doc.setDrawColor(26, 115, 232);
  doc.setLineWidth(1);
  doc.rect(2, 2, pageWidth - 4, 96);
  
  if (event.organizer?.logo_url) {
    try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = event.organizer.logo_url;
        doc.addImage(img, 'PNG', pageWidth/2 - 10, 8, 20, 20, undefined, 'FAST');
    } catch(e) {
        console.error("Erro ao carregar o logo para o crachá:", e);
        doc.setFontSize(10);
        doc.text(event.organizer?.company_name || 'Logo', pageWidth / 2, 15, { align: 'center' });
    }
  } else {
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text(event.organizer?.company_name || 'Evento', pageWidth / 2, 15, { align: 'center' });
  }

  doc.setFontSize(20);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(26, 115, 232);
  const participantName = doc.splitTextToSize(participant.name, pageWidth - 20);
  doc.text(participantName, pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  doc.text('PARTICIPANTE', pageWidth / 2, 55, { align: 'center' });
  
  doc.setLineWidth(0.2);
  doc.line(10, 65, pageWidth - 10, 65);

  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  const eventName = doc.splitTextToSize(event.name, pageWidth - 20);
  doc.text(eventName, pageWidth / 2, 75, { align: 'center' });
  
  doc.save(`cracha-${participant.name.replace(/ /g, '_')}.pdf`);
};

export const generateCollaboratorBadgePdf = ({ collaborator, organizer, event }) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [74, 105] // Tamanho padrão A7 para crachás
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.addFont('Helvetica', 'normal', 'normal');
  doc.addFont('Helvetica', 'bold', 'bold');

  // Adiciona o banner do evento ou do organizador no topo
  const bannerUrl = event?.banner_image_url || organizer?.banner_image_url;
  if (bannerUrl) {
    try {
      const bannerImg = new Image();
      bannerImg.crossOrigin = "Anonymous";
      bannerImg.src = bannerUrl;
      doc.addImage(bannerImg, 'PNG', 0, 0, pageWidth, 30);
    } catch (e) {
      console.error("Erro ao carregar imagem do banner para o crachá:", e);
      doc.setFillColor(40, 40, 40);
      doc.rect(0, 0, pageWidth, 30, 'F');
    }
  } else {
    doc.setFillColor(40, 40, 40);
    doc.rect(0, 0, pageWidth, 30, 'F');
  }

  // Adiciona o logo da empresa sobre o banner
  if (organizer?.logo_url) {
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "Anonymous";
      logoImg.src = organizer.logo_url;
      doc.addImage(logoImg, 'PNG', pageWidth / 2 - 12, 18, 24, 24, undefined, 'FAST');
      // Adiciona um círculo branco em volta do logo para destaque
      doc.setFillColor(255, 255, 255);
      doc.circle(pageWidth / 2, 30, 13, 'F');
      doc.addImage(logoImg, 'PNG', pageWidth / 2 - 12, 18, 24, 24, undefined, 'FAST');
    } catch (e) {
      console.error("Erro ao carregar logo para o crachá:", e);
    }
  }

  doc.setFontSize(22);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  const collaboratorName = doc.splitTextToSize(collaborator.name, pageWidth - 16);
  doc.text(collaboratorName, pageWidth / 2, 55, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(collaborator.role.toUpperCase(), pageWidth / 2, 65, { align: 'center' });
  
  doc.setLineWidth(0.3);
  doc.setDrawColor(220, 220, 220);
  doc.line(8, 75, pageWidth - 8, 75);
  
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  const eventName = doc.splitTextToSize(event.name, pageWidth - 16);
  doc.text(eventName, pageWidth / 2, 85, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(new Date(event.date).toLocaleDateString('pt-BR'), pageWidth / 2, 92, { align: 'center' });
  
  doc.save(`cracha_colaborador-${collaborator.name.replace(/ /g, '_')}.pdf`);
};