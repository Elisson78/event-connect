// Script para testar o componente RSS
console.log('=== TESTE DO COMPONENTE RSS ===');

// Simular as configurações que vêm do banco
const mockSettings = {
  rss_feed_enabled: 'true',
  rss_feed_url: 'https://www.ge.ch/feed/evenements',
  rss_feed_max_events: '10'
};

console.log('Configurações RSS:', mockSettings);

// Testar se o RSS está habilitado
const isRSSEnabled = () => {
  return mockSettings.rss_feed_enabled === 'true';
};

console.log('RSS habilitado:', isRSSEnabled());

// Testar se o componente deve ser renderizado
if (isRSSEnabled()) {
  console.log('✅ Componente RSS deve ser renderizado');
  
  // Simular os eventos mockados
  const mockEvents = [
    {
      id: 1,
      title: "Pique-nique Eau en ville au Parc des Bastions",
      description: "En été, la démarche du Canton Eau en ville propose des formats d'expérience",
      date: "27 juin 2025",
      location: "Parc des Bastions, Genève",
      link: "https://www.ge.ch/node/37596",
      image: "https://www.ge.ch/media/styles/xl_2_col_730x324/public/illustration/2024-11/Illustration.png?h=bc71f1f0&itok=g1PXm-zw",
      category: "Meio Ambiente",
      source: "Canton de Genève"
    }
  ];
  
  console.log('Eventos mockados:', mockEvents);
  console.log('Número de eventos:', mockEvents.length);
} else {
  console.log('❌ Componente RSS não deve ser renderizado');
}

console.log('=== FIM DO TESTE ==='); 