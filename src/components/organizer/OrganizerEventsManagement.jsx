import React from 'react';
import OrganizerOverview from './OrganizerOverview'; // Reutilizar o componente de visão geral

const OrganizerEventsManagement = () => {
  // Este componente pode no futuro ter filtros mais avançados ou visualizações diferentes
  // Por agora, ele simplesmente renderiza o OrganizerOverview que já contém a lista de eventos e criação/edição.
  return (
    <div>
      <OrganizerOverview />
    </div>
  );
};

export default OrganizerEventsManagement;