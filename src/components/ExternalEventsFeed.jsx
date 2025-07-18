import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ExternalLink, Globe, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchRSSFeed } from '@/lib/rssParser';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/hooks/useTranslation';

const ExternalEventsFeed = () => {
  const { t } = useTranslation('common');
  const { isRSSEnabled, getRSSUrl, getRSSMaxEvents } = useSettings();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug logs
  console.log('ExternalEventsFeed - isRSSEnabled:', isRSSEnabled());
  console.log('ExternalEventsFeed - getRSSUrl:', getRSSUrl());
  console.log('ExternalEventsFeed - getRSSMaxEvents:', getRSSMaxEvents());

  useEffect(() => {
    console.log('ExternalEventsFeed - useEffect triggered, isRSSEnabled:', isRSSEnabled());
    if (isRSSEnabled()) {
      fetchExternalEvents();
    } else {
      setLoading(false);
      setEvents([]);
    }
  }, [isRSSEnabled]);

  const fetchExternalEvents = async () => {
    try {
      console.log('ExternalEventsFeed - fetchExternalEvents iniciado');
      setLoading(true);
      setError(null);
      
      // URL do RSS feed das configurações
      const rssUrl = getRSSUrl();
      const maxEvents = getRSSMaxEvents();
      
      console.log('ExternalEventsFeed - rssUrl:', rssUrl);
      console.log('ExternalEventsFeed - maxEvents:', maxEvents);
      
      // Em produção, você pode usar o RSS real
      // const result = await fetchRSSFeed(rssUrl);
      
      // Por enquanto, vamos usar dados mockados baseados no RSS que você forneceu
      const mockEvents = [
        {
          id: 1,
          title: "Pique-nique Eau en ville au Parc des Bastions - L'eau, le sol, les arbres",
          description: "En été, la démarche du Canton Eau en ville propose des formats d'expérience et de partage destinés à un large public durant la pause de midi.",
          date: "27 juin 2025",
          location: "Parc des Bastions, Genève",
          link: "https://www.ge.ch/node/37596",
          image: "https://www.ge.ch/media/styles/xl_2_col_730x324/public/illustration/2024-11/Illustration.png?h=bc71f1f0&itok=g1PXm-zw",
          category: "Meio Ambiente",
          source: "Canton de Genève"
        },
        {
          id: 2,
          title: "PAV EXPO : ouverture publique",
          description: "Rejoignez-nous mercredi 6 août lors d'une ouverture publique de la salle d'exposition du PAV !",
          date: "3 juillet 2025",
          location: "Pavillon Sicli - Salle d'exposition du PAV",
          link: "https://www.ge.ch/node/39977",
          image: "https://www.ge.ch/media/styles/xl_2_col_730x324/public/illustration/2025-07/IMG_1684_0.jpeg?h=ad634735&itok=KjPw9z0V",
          category: "Exposição",
          source: "Canton de Genève"
        },
        {
          id: 3,
          title: "Réussir son démarrage en comprenant son marché",
          description: "Etapes clés et points d'attention pour maximiser les chances de réussir le lancement de son entreprise",
          date: "7 janvier 2025",
          location: "Genève",
          link: "https://www.ge.ch/node/38153",
          image: "https://www.ge.ch/media/styles/xl_2_col_730x324/public/illustration/2025-01/atelier%20genilem%201460x648_2.png?h=5b7a7560&itok=N7J21JsL",
          category: "Formação",
          source: "Canton de Genève"
        },
        {
          id: 4,
          title: "12e Journée cantonale des proches aidants Genève 2025",
          description: "Répit musical pour toutes et tous ! Célébrons les proches aidants",
          date: "9 juillet 2025",
          location: "Salle communale d'Onex",
          link: "https://www.ge.ch/node/40041",
          image: null,
          category: "Cultura",
          source: "Canton de Genève"
        }
      ];

      // Limitar o número de eventos conforme configuração
      const limitedEvents = mockEvents.slice(0, maxEvents);
      console.log('ExternalEventsFeed - limitedEvents:', limitedEvents);
      setEvents(limitedEvents);
    } catch (err) {
      setError(t('error_loading_external_events'));
      console.error('Erro ao buscar eventos externos:', err);
    } finally {
      setLoading(false);
      console.log('ExternalEventsFeed - fetchExternalEvents finalizado');
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Se RSS está desabilitado, não mostrar nada
  if (!isRSSEnabled()) {
    console.log('ExternalEventsFeed - RSS desabilitado, retornando null');
    return null;
  }

  console.log('ExternalEventsFeed - Renderizando componente, loading:', loading, 'events:', events.length, 'error:', error);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <p className="text-red-600 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-semibold text-gray-800">{t('external_events')}</h2>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-xs">
            {t('events_found', { count: events.length })}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchExternalEvents}
            disabled={loading}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <div className="relative">
                {event.image && (
                  <div className="h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
                  {event.category}
                </Badge>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                  {event.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {truncateText(event.description)}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(event.date)}
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {t('source')}: {event.source}
                  </span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(event.link, '_blank')}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {t('view_event')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {events.length === 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-8 text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t('no_external_events')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExternalEventsFeed; 