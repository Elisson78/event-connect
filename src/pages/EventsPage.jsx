import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import EventCard from '@/components/EventCard';
import { useEvents } from '@/contexts/EventContext';

const EventCardSkeleton = () => (
  <div className="border rounded-lg p-4 space-y-3 animate-pulse bg-white shadow-md">
    <div className="h-48 bg-gray-200 rounded-md"></div>
    <div className="space-y-2">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
    <div className="flex justify-between items-center pt-2">
      <div className="h-10 bg-gray-200 rounded w-24"></div>
      <div className="h-10 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
);

const EventsPage = () => {
  const { events, loadingEvents, networkError, eventCategories, loadingEventCategories } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const handleTypeChange = (value) => {
    setSelectedType(value === 'all-types' ? '' : value);
  };

  const handleLocationChange = (value) => {
    setSelectedLocation(value === 'all-locations' ? '' : value);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || event.category_id === selectedType;
    const matchesLocation = !selectedLocation || event.location.includes(selectedLocation);
    
    return matchesSearch && matchesType && matchesLocation;
  });

  const locations = [...new Set(events.map(event => event.location.split(' - ')[1]).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Explore <span className="text-gradient">Eventos</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubra eventos incríveis acontecendo perto de você
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            <Select value={selectedType || 'all-types'} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">Todos os tipos</SelectItem>
                {loadingEventCategories ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : (
                  eventCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select value={selectedLocation || 'all-locations'} onValueChange={handleLocationChange}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Localização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-locations">Todas as cidades</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => {
                setSearchTerm('');
                setSelectedType('');
                setSelectedLocation('');
              }}
              variant="outline"
              className="h-12"
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {loadingEvents && (
            Array.from({ length: 8 }).map((_, index) => <EventCardSkeleton key={index} />)
          )}

          {!loadingEvents && !networkError && filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </div>

        {!loadingEvents && networkError && (
          <div className="col-span-full text-center py-16 text-red-600 bg-red-50 rounded-lg">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-xl font-semibold">Ocorreu um erro ao carregar os eventos.</p>
            <p>Por favor, verifique sua conexão e tente novamente.</p>
          </div>
        )}

        {!loadingEvents && !networkError && filteredEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Nenhum evento encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;