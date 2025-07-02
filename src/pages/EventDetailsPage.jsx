import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Clock, Users, ArrowLeft, Share2, Heart, Info, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { useEvents } from '@/contexts/EventContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/components/ui/use-toast';

const EventDetailsPage = () => {
  const { id } = useParams();
  const { events, isUserRegistered, loadingEvents } = useEvents();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const event = events.find(e => e.id === id);

  if (loadingEvents) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Evento não encontrado</h1>
          <Link to="/events">
            <Button>Voltar aos eventos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleRegisterClick = () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para se inscrever em eventos. Redirecionando...",
        variant: "destructive"
      });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (profile?.role !== 'participant') {
      toast({
        title: "Acesso negado",
        description: "Apenas participantes podem se inscrever em eventos.",
        variant: "destructive"
      });
      return;
    }
    
    const isFree = !event.price || parseFloat(String(event.price).replace(/[^0-9,-]+/g, "").replace(',', '.')) === 0;

    if (isFree) {
       toast({
          title: "🚧 A inscrição para eventos gratuitos será implementada em breve!",
          description: "No momento, o fluxo de pagamento está disponível. Tente se inscrever em um evento pago.",
        });
      // Future logic for free events can go here.
    } else {
      navigate(`/payment/${event.id}`);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copiado!",
      description: "O link do evento foi copiado para a área de transferência.",
    });
  };

  const handleFavorite = () => {
    toast({
      title: "🚧 Esta funcionalidade ainda não foi implementada—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀"
    });
  };

  const isRegistered = user && isUserRegistered(event.id, profile?.id);
  const isAvailable = event.status === 'available' && (event.current_participants || 0) < event.max_participants;
  
  let bannerImageUrl = event.banner_image_url;
  if (!bannerImageUrl || bannerImageUrl.trim() === '') {
    bannerImageUrl = `https://source.unsplash.com/random/1200x400?event,landscape&sig=${event.id}`;
  }

  let cardImageUrl = event.card_image_url;
  if (!cardImageUrl || cardImageUrl.trim() === '') {
    cardImageUrl = `https://source.unsplash.com/random/400x300?event,portrait&sig=${event.id}`;
  }

  const renderDetailItem = (label, value) => (
    <div className="bg-slate-50 p-4 rounded-lg">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="text-lg text-gray-800 whitespace-pre-wrap">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link 
            to="/events" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos eventos
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="relative h-72 md:h-96">
                  <img  
                    src={bannerImageUrl} 
                    alt={`Banner do evento ${event.name || 'Evento'}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <Button
                      onClick={handleShare}
                      size="sm"
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleFavorite}
                      size="sm"
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold text-white ${
                      isAvailable ? 'status-available' : 'status-unavailable'
                    }`}>
                      {isAvailable ? 'Inscrições Abertas' : 'Esgotado'}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {event.name}
                  </h1>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Data e Hora</p>
                        <p className="text-gray-600">
                          {event.start_date ? new Date(event.start_date + 'T00:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'A definir'}
                          {event.end_date && event.end_date !== event.start_date && ` a ${new Date(event.end_date + 'T00:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
                        </p>
                        {event.start_time && (
                          <p className="text-gray-500 text-sm">
                            Das {event.start_time.substring(0, 5)}{event.end_time && ` às ${event.end_time.substring(0, 5)}`}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Local</p>
                        <p className="text-gray-600">{event.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Users className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Participantes</p>
                        <p className="text-gray-600">
                          {(event.current_participants || 0)}/{event.max_participants} inscritos
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Tag className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Categoria</p>
                        <p className="text-gray-600">{event.category?.name || 'Não definida'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre o Evento</h2>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {event.description}
                    </p>
                  </div>

                  {event.details && event.category?.details_schema && Object.keys(event.details).length > 0 && (
                    <div className="mb-8">
                       <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                         <Info className="h-6 w-6 mr-2 text-blue-600"/>
                         Informações Adicionais
                       </h2>
                       <div className="grid md:grid-cols-2 gap-4">
                         {event.category.details_schema.map(field => 
                           event.details[field.key] ? (
                             renderDetailItem(field.label, event.details[field.key])
                           ) : null
                         )}
                       </div>
                    </div>
                  )}

                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Vagas Preenchidas</span>
                      <span className="text-sm text-gray-500">
                        {Math.round(((event.current_participants || 0) / event.max_participants) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-orange-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${((event.current_participants || 0) / event.max_participants) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-lg">
                <CardHeader className="flex flex-col items-center">
                    <img  
                      src={cardImageUrl} 
                      alt={`Card do evento ${event.name || 'Evento'}`}
                      className="w-full h-40 object-cover rounded-t-lg mb-4"
                    />
                  <CardTitle className="text-center">
                    {event.price ? (
                      <span className="text-3xl font-bold text-orange-600">{event.price}</span>
                    ) : (
                      <span className="text-3xl font-bold text-green-600">Gratuito</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isRegistered ? (
                    <Button disabled className="w-full h-12 bg-green-600 text-white text-lg">
                      ✓ Você está inscrito
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleRegisterClick}
                      disabled={!isAvailable || isRegistered}
                      className="w-full h-12 btn-orange text-white text-lg font-semibold"
                    >
                      {isAvailable ? 'Inscrever-se Agora' : 'Esgotado'}
                    </Button>
                  )}
                  
                  <div className="text-center text-sm text-gray-600">
                    <p>{event.max_participants - (event.current_participants || 0)} vagas restantes</p>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Informações Importantes</h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Confirmação por email</li>
                      <li>• Chegue 30 minutos antes</li>
                      <li>• Documento obrigatório</li>
                      <li>• Cancelamento até 24h antes</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EventDetailsPage;