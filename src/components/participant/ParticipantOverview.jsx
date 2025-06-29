import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Trophy, Star, Heart, Users, TrendingUp, Briefcase, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEvents } from '@/contexts/EventContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const ParticipantOverview = () => {
  const { user } = useAuth();
  const { events, getUserRegistrations, loadingEvents, loadingRegistrations } = useEvents();
  const { toast } = useToast();

  if (loadingEvents || loadingRegistrations) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const userRegistrations = getUserRegistrations(user?.id || '');
  const registeredEvents = events.filter(event => 
    userRegistrations.some(reg => reg.event_id === event.id)
  );

  const upcomingEvents = registeredEvents.filter(event => 
    new Date(event.date) >= new Date()
  ).sort((a,b) => new Date(a.date) - new Date(b.date));

  const pastEvents = registeredEvents.filter(event => 
    new Date(event.date) < new Date()
  ).sort((a,b) => new Date(b.date) - new Date(a.date));

  const handleActionToast = (message) => {
    toast({
      title: "🚧 Funcionalidade em Breve!",
      description: message || "Esta funcionalidade ainda não foi implementada. Você pode solicitá-la no seu próximo prompt! 🚀",
    });
  };

  const StatCard = ({ title, value, icon: Icon, color, unit }) => (
    <Card className="dashboard-card card-hover transform transition-all duration-300 hover:scale-105">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color}`}>{value || 'N/A'}
          {unit && <span className="text-lg ml-1">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );

  const EventListItem = ({ event, isUpcoming }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`border rounded-xl p-4 md:p-6 shadow-sm hover:shadow-lg transition-all duration-300 ${isUpcoming ? 'bg-white' : 'bg-gray-50'}`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex-1 mb-3 md:mb-0">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">
            {event.name}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} às {event.time}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        </div>
        <div className="flex space-x-2 mt-2 md:mt-0">
          <Link to={`/event/${event.id}`}>
            <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              Ver Detalhes
            </Button>
          </Link>
          {!isUpcoming && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleActionToast('Certificados estarão disponíveis em breve.')}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <Trophy className="h-4 w-4 mr-1.5" />
              Certificado
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Eventos Inscritos" value={registeredEvents.length} icon={Users} color="text-blue-600" />
        <StatCard title="Próximos Eventos" value={upcomingEvents.length} icon={Clock} color="text-orange-600" />
        <StatCard title="Código da Sorte" value={user?.participant_code} icon={Ticket} color="text-yellow-600" />
        <StatCard title="Eventos Concluídos" value={pastEvents.length} icon={Trophy} color="text-green-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Clock className="h-6 w-6 text-orange-500" />
              <span className="text-xl">Próximos Eventos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-4">
                  Nenhum evento agendado por enquanto.
                </p>
                <Link to="/events">
                  <Button className="btn-primary text-white px-6 py-3 text-base">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Explorar Novos Eventos
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <EventListItem key={event.id} event={event} isUpcoming={true} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Trophy className="h-6 w-6 text-green-500" />
              <span className="text-xl">Eventos Concluídos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {pastEvents.length === 0 ? (
              <div className="text-center py-10">
                <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  Participe de eventos para ver seu histórico aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastEvents.map((event) => (
                  <EventListItem key={event.id} event={event} isUpcoming={false} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <Briefcase className="h-6 w-6 text-indigo-500" />
            <span className="text-xl">Ações Rápidas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link to="/events">
              <Button className="w-full h-16 btn-primary text-white text-base">
                <Calendar className="h-5 w-5 mr-2" />
                Explorar Eventos
              </Button>
            </Link>
            <Button 
              onClick={() => handleActionToast('Em breve: visualize todos os seus certificados aqui.')}
              className="w-full h-16 btn-orange text-white text-base"
            >
              <Trophy className="h-5 w-5 mr-2" />
              Meus Certificados
            </Button>
            <Button 
              onClick={() => handleActionToast('Compartilhe suas conquistas nas redes sociais!')}
              variant="outline" 
              className="w-full h-16 text-base text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              <Heart className="h-5 w-5 mr-2" />
              Compartilhar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParticipantOverview;