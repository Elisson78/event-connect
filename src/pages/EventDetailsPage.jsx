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
import { useTranslation } from '@/hooks/useTranslation';

const EventDetailsPage = () => {
  const { t } = useTranslation('common');
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('event_not_found')}</h1>
          <Link to="/events">
            <Button>{t('back_to_events')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleRegisterClick = () => {
    if (!user) {
      toast({
        title: t('login_required'),
        description: t('login_required_desc'),
        variant: "destructive"
      });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (profile?.role !== 'participant') {
      toast({
        title: t('access_denied'),
        description: t('access_denied_desc'),
        variant: "destructive"
      });
      return;
    }
    
    const isFree = !event.price || parseFloat(String(event.price).replace(/[^0-9,-]+/g, "").replace(',', '.')) === 0;

    if (isFree) {
       toast({
          title: t('free_events_coming_soon'),
          description: t('free_events_coming_soon_desc'),
        });
      // Future logic for free events can go here.
    } else {
      navigate(`/payment/${event.id}`);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: t('link_copied'),
      description: t('link_copied_desc'),
    });
  };

  const handleFavorite = () => {
    toast({
      title: t('feature_not_implemented')
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
            {t('back_to_events')}
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="relative h-72 md:h-96">
                  <img  
                    src={bannerImageUrl} 
                    alt={t('event_banner_alt', { name: event.name || 'Evento' })}
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
                      {isAvailable ? t('registration_open') : t('sold_out')}
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
                        <p className="font-semibold text-gray-900">{t('date_and_time')}</p>
                        <p className="text-gray-600">
                          {event.start_date ? new Date(event.start_date + 'T00:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : t('to_be_defined')}
                          {event.end_date && event.end_date !== event.start_date && ` a ${new Date(event.end_date + 'T00:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
                        </p>
                        {event.start_time && (
                          <p className="text-gray-500 text-sm">
                            {event.end_time ? t('to_time', { startTime: event.start_time.substring(0, 5), endTime: event.end_time.substring(0, 5) }) : t('from_time', { startTime: event.start_time.substring(0, 5) })}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{t('location')}</p>
                        <p className="text-gray-600">{event.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Users className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{t('participants')}</p>
                        <p className="text-gray-600">
                          {t('registered_count', { current: event.current_participants || 0, max: event.max_participants })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Tag className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{t('category')}</p>
                        <p className="text-gray-600">{event.category?.name || t('not_defined')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('about_event')}</h2>
                    {((event.price === 0 || event.is_free) && (
                      <div className="mb-4">
                        <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-full shadow-sm">
                          {t('free_event')}
                        </span>
                      </div>
                    ))}
                    <div className="bg-white p-0 rounded-none shadow-none w-full">
                      <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line text-justify">
                        {event.description}
                      </p>
                    </div>
                  </div>

                  {event.details && event.category?.details_schema && Object.keys(event.details).length > 0 && (
                    <div className="mb-8">
                       <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                         <Info className="h-6 w-6 mr-2 text-blue-600"/>
                         {t('additional_info')}
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
                      <span className="text-sm font-medium text-gray-700">{t('spots_filled')}</span>
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
                      alt={t('event_card_alt', { name: event.name || 'Evento' })}
                      className="w-full h-40 object-cover rounded-t-lg mb-4"
                    />
                  <CardTitle className="text-center">
                    {event.price ? (
                      <span className="text-3xl font-bold text-orange-600">{event.price}</span>
                    ) : (
                      <span className="text-3xl font-bold text-green-600">{t('free')}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isRegistered ? (
                    <Button disabled className="w-full h-12 bg-green-600 text-white text-lg">
                      {t('you_are_registered')}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleRegisterClick}
                      disabled={!isAvailable || isRegistered}
                      className="w-full h-12 btn-orange text-white text-lg font-semibold"
                    >
                      {isAvailable ? t('register_now') : t('sold_out')}
                    </Button>
                  )}
                  
                  <div className="text-center text-sm text-gray-600">
                    <p>{t('spots_remaining', { count: event.max_participants - (event.current_participants || 0) })}</p>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">{t('important_info')}</h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>{t('email_confirmation')}</li>
                      <li>{t('arrive_early')}</li>
                      <li>{t('document_required')}</li>
                      <li>{t('cancellation_policy')}</li>
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
