import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import Navbar from '@/components/Navbar';
import EventCard from '@/components/EventCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Mail, Briefcase, Award, Building, Hash, Phone, MapPin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start">
    <Icon className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
    <div className="flex flex-col">
      <span className="font-semibold text-gray-700">{label}</span>
      <span className="text-gray-600 break-words">{value}</span>
    </div>
  </div>
);

const OrganizerProfilePage = () => {
  const { organizerId } = useParams();
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrganizerData = async () => {
      setLoading(true);
      try {
        const { data: organizerData, error: organizerError } = await supabase
          .from('users')
          .select('id, name, email, role, profile_image_url, banner_image_url, bio, website_url, company_name, company_id_number, company_address, company_phone, phone, address, created_at, logo_url')
          .eq('id', organizerId)
          .eq('role', 'organizer')
          .single();

        if (organizerError || !organizerData) {
          console.error('Error fetching organizer:', organizerError);
          toast({ title: "Erro", description: "Organizador não encontrado ou não é um organizador válido.", variant: "destructive" });
          setOrganizer(null);
        } else {
          setOrganizer(organizerData);
        }

        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('organizer_id', organizerId)
          .eq('status', 'available')
          .order('start_date', { ascending: true });

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          toast({ title: "Erro ao buscar eventos", description: eventsError.message, variant: "destructive" });
        } else {
          setEvents(eventsData || []);
        }
      } catch (error) {
        console.error('General error:', error);
        toast({ title: "Erro inesperado", description: "Ocorreu um erro ao carregar a página.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (organizerId) {
      fetchOrganizerData();
    }
  }, [organizerId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!organizer) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Organizador Não Encontrado</h1>
          <p className="text-gray-600 mt-4">Não foi possível encontrar informações sobre este organizador.</p>
          <Link to="/events" className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Ver todos os eventos
          </Link>
        </div>
      </>
    );
  }
  
  const bannerImageUrl = organizer.banner_image_url || `https://source.unsplash.com/random/1600x400?landscape,nature,abstract&sig=${organizer.id}`;
  const profileImageUrl = organizer.profile_image_url || `https://source.unsplash.com/random/200x200?portrait,person&sig=${organizer.id}`;

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative h-56 md:h-72 bg-gradient-to-r from-slate-800 via-gray-700 to-slate-900">
          <img  
            src={bannerImageUrl}
            alt={`Banner de ${organizer.name}`}
            className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-white rounded-xl shadow-xl p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white shadow-lg -mt-16 md:-mt-20 relative z-10 flex-shrink-0">
                <AvatarImage 
                  src={profileImageUrl} 
                  alt={`Foto de perfil de ${organizer.name}`}
                />
                <AvatarFallback className="text-4xl">{organizer.name ? organizer.name.charAt(0).toUpperCase() : 'O'}</AvatarFallback>
              </Avatar>
              <div className="flex-grow text-center md:text-left mt-4 md:mt-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 break-words">{organizer.name}</h1>
                <p className="text-md text-blue-600 font-medium mt-1"><Briefcase className="inline h-4 w-4 mr-1" />Organizador de Eventos</p>
                 {organizer.website_url && (
                  <a 
                    href={organizer.website_url.startsWith('http') ? organizer.website_url : `https://${organizer.website_url}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-gray-500 hover:text-orange-600 transition-colors mt-1 block break-all"
                  >
                    {organizer.website_url}
                  </a>
                )}
              </div>
              <div className="flex-shrink-0 mt-4 md:mt-0">
                <Button asChild className="btn-orange text-white w-full sm:w-auto">
                  <a href={`mailto:${organizer.email}`}>
                    <Mail className="h-4 w-4 mr-2" /> Contatar
                  </a>
                </Button>
              </div>
            </div>

            {organizer.bio && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Sobre {organizer.name}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{organizer.bio}</p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Briefcase className="mr-2 h-6 w-6 text-blue-600" /> Detalhes do Organizador</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                  {organizer.company_name && <InfoItem icon={Building} label="Empresa" value={organizer.company_name} />}
                  {organizer.company_id_number && <InfoItem icon={Hash} label="CNPJ" value={organizer.company_id_number} />}
                  {organizer.email && <InfoItem icon={Mail} label="Email de Contato" value={organizer.email} />}
                  {organizer.company_phone && <InfoItem icon={Phone} label="Telefone da Empresa" value={organizer.company_phone} />}
                  {organizer.phone && <InfoItem icon={Phone} label="Telefone Pessoal" value={organizer.phone} />}
                  {organizer.company_address && <InfoItem icon={MapPin} label="Endereço da Empresa" value={organizer.company_address} />}
                  {organizer.address && <InfoItem icon={MapPin} label="Endereço Pessoal" value={organizer.address} />}
                  {organizer.created_at && <InfoItem icon={Calendar} label="Membro Desde" value={new Date(organizer.created_at).toLocaleDateString('pt-BR')} />}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                Eventos Ativos de <span className="text-gradient">{organizer.name}</span>
              </h2>
            </div>

            {events.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">Nenhum evento futuro encontrado</h3>
                <p className="text-gray-500 mt-2">Este organizador não possui eventos futuros disponíveis no momento.</p>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrganizerProfilePage;
