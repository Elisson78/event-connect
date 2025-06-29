import React from 'react';
import { useEvents } from '@/contexts/EventContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Building, AlertTriangle } from 'lucide-react';

const OrganizerCard = ({ organizer }) => {
  const getInitials = (name) => {
    if (!name) return 'O';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Card className="h-full flex flex-col text-center items-center shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pt-8">
          <Avatar className="h-24 w-24 border-4 border-slate-200">
            <AvatarImage src={organizer.logo_url} alt={organizer.company_name} />
            <AvatarFallback className="text-3xl bg-slate-200">{getInitials(organizer.company_name)}</AvatarFallback>
          </Avatar>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center">
          <CardTitle className="text-xl font-bold">{organizer.company_name}</CardTitle>
          <p className="text-gray-600 mt-2 flex-grow line-clamp-3">{organizer.bio || 'Este organizador ainda não adicionou uma biografia.'}</p>
          <Link to={`/organizador/${organizer.id}`} className="mt-4">
            <Button>Ver Perfil</Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AllOrganizersPage = () => {
  const { allUsers, loadingUsers, networkError } = useEvents();

  const organizers = allUsers.filter(user => user.role === 'organizer');

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
            Nossos <span className="text-gradient">Organizadores</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Conheça as empresas e pessoas que tornam os melhores eventos possíveis.
          </p>
        </motion.div>

        {loadingUsers && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-16 w-16 animate-spin text-orange-500" />
          </div>
        )}

        {networkError && !loadingUsers && (
          <div className="col-span-full text-center py-16 text-red-600 bg-red-50 rounded-lg">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-xl font-semibold">Ocorreu um erro de rede.</p>
            <p>Não foi possível carregar a lista de organizadores. Tente novamente mais tarde.</p>
          </div>
        )}

        {!loadingUsers && !networkError && organizers.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {organizers.map((organizer, index) => (
              <motion.div
                key={organizer.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <OrganizerCard organizer={organizer} />
              </motion.div>
            ))}
          </div>
        )}

        {!loadingUsers && !networkError && organizers.length === 0 && (
          <div className="text-center py-16">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Nenhum organizador encontrado
            </h3>
            <p className="text-gray-600">
              Ainda não temos organizadores cadastrados. Volte em breve!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllOrganizersPage;