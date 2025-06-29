import React from 'react';
import { useEvents } from '@/contexts/EventContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Loader2, Building, AlertTriangle, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminOrganizersManagement = () => {
  const { allUsers, loadingUsers, networkError } = useEvents();

  const organizers = allUsers.filter(user => user.role === 'organizer');

  const getInitials = (name) => {
    if (!name) return 'O';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  if (loadingUsers) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-16 w-16 animate-spin text-orange-500" />
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="text-center py-16 text-red-600 bg-red-50 rounded-lg">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
        <p className="text-xl font-semibold">Ocorreu um erro de rede.</p>
        <p>Não foi possível carregar a lista de organizadores.</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Gerenciar Organizadores</CardTitle>
        <CardDescription>Visualize e acesse o perfil de todos os organizadores da plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        {organizers.length > 0 ? (
          <div className="space-y-4">
            {organizers.map((organizer, index) => (
              <motion.div
                key={organizer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={organizer.logo_url} alt={organizer.company_name} />
                      <AvatarFallback>{getInitials(organizer.company_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{organizer.company_name || organizer.name}</p>
                      <p className="text-sm text-gray-500">{organizer.email}</p>
                    </div>
                  </div>
                  <Link to={`/organizador/${organizer.id}`}>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Visualizar Perfil</span>
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Nenhum organizador encontrado
            </h3>
            <p className="text-gray-600">
              Ainda não há usuários com a função de organizador.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminOrganizersManagement;