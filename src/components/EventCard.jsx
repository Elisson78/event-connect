import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, DollarSign, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useEvents } from '@/contexts/EventContext';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

const EventCard = ({ event, showActions = true }) => {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isUserRegistered, cardFieldSettings, loadingCardSettings } = useEvents();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const isRegistered = user && isUserRegistered(event.id, profile?.id);
  const isAvailable = event.status === 'available' && (event.current_participants || 0) < event.max_participants;
  
  let imageUrl = event.card_image_url;
  if (!imageUrl || imageUrl.trim() === '') {
    imageUrl = `https://source.unsplash.com/random/400x300?event&sig=${event.id}`;
  }

  const isFieldVisible = (fieldName) => {
    if (loadingCardSettings) return true;
    const setting = cardFieldSettings[fieldName];
    return setting ? setting.is_visible : true;
  };
  
  const getFieldLabel = (fieldName) => {
    if (loadingCardSettings || !cardFieldSettings[fieldName]) return '';
    return cardFieldSettings[fieldName].label;
  }


  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="event-card overflow-hidden h-full flex flex-col">
        <div className="relative h-48 overflow-hidden">
          <img  
            src={imageUrl} 
            alt={event.name || t('event_image_alt')}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
              isAvailable ? 'status-available' : 'status-unavailable'
            }`}>
              {isAvailable ? t('available') : t('sold_out')}
            </span>
          </div>
          {event.category?.name && (
            <div className="absolute top-4 left-4 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded">
              {event.category.name}
            </div>
          )}
        </div>
        
        <CardContent className="p-6 flex-grow">
          {isFieldVisible('name') && (
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
              {event.name}
            </h3>
          )}
          
       
          
          <div className="space-y-2 text-sm text-gray-600">
            {isFieldVisible('date_time') && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>{event.start_date ? new Date(event.start_date).toLocaleDateString('pt-BR') : t('date_not_defined')}{event.start_time && ` às ${event.start_time}`}</span>
              </div>
            )}
            {isFieldVisible('location') && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>{event.location}</span>
              </div>
            )}
          
          </div>
          
          {event.details && event.category?.details_schema && (
             <div className="space-y-1 text-sm text-gray-600 mt-3 pt-3 border-t border-dashed">
             {event.category.details_schema
               .filter(field => {
                 const fieldName = field?.name || field?.key;
                 if (!fieldName) return false;
                 // Só exibe se estiver ativado no painel admin
                 if (loadingCardSettings) return true;
                 const setting = cardFieldSettings[fieldName];
                 return setting ? setting.is_visible : true;
               })
               .slice(0, 1)
               .map(field => {
                 const fieldName = field?.name || field?.key;
                 return event.details[fieldName] && (
                   <div key={fieldName} className="flex items-start space-x-2">
                     <Info className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                     <p><strong className="font-medium text-gray-800">{field.label}:</strong> <span className="line-clamp-1">{event.details[fieldName]}</span></p>
                   </div>
                 );
               })}
           </div>
          )}

        
        </CardContent>
        
        {showActions && (
          <CardFooter className="p-6 pt-0 flex gap-3">
            <Link to={`/event/${event.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                {t('view_details')}
              </Button>
            </Link>
            {isRegistered ? (
              <Button disabled className="flex-1 bg-green-600 text-white">
                {t('registered')}
              </Button>
            ) : (
              <Button 
                onClick={handleRegisterClick}
                disabled={!isAvailable || isRegistered}
                className="flex-1 btn-orange text-white"
              >
                {isAvailable ? t('register_action') : t('sold_out')}
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

export default EventCard;