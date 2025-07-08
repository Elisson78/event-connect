import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Eye, Edit, Trash2, Plus } from 'lucide-react';

const OrganizerEventList = ({ events, onEdit, onDelete, onShowCreateDialog, getEventRegistrations }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum evento criado ainda</h3>
        <p className="text-gray-600 mb-4">Comece criando seu primeiro evento!</p>
        <Button onClick={onShowCreateDialog} className="btn-primary text-white">
          <Plus className="h-4 w-4 mr-2" />
          Criar Primeiro Evento
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const registrations = getEventRegistrations(event.id);
        const pendingCount = registrations.filter(r => r.status === 'pending_approval').length;
        return (
        <div key={event.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{event.name}</h3>
                  {pendingCount > 0 && (
                    <Badge variant="warning">{pendingCount} pendentes</Badge>
                  )}
                </div>
              <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {event.start_date ? new Date(event.start_date + 'T00:00:00Z').toLocaleDateString('pt-BR') : 'A definir'}
                    {event.start_time && ` das ${event.start_time.substring(0, 5)}`}
                    {event.end_time && ` às ${event.end_time.substring(0, 5)}`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{event.current_participants || 0}/{event.max_participants} inscritos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                    <span>{registrations.length} visualizações (inscrições)</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 ml-4">
              <Button onClick={() => onEdit(event)} size="sm" variant="outline">
                <Edit className="h-4 w-4" />
              </Button>
              <Button onClick={() => onDelete(event.id, event.name)} size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
};

export default OrganizerEventList;