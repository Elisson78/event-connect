import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, BarChart3 } from 'lucide-react';

const OrganizerStatsCards = ({ eventsCount, participantsCount, activeEventsCount }) => {
  const stats = [
    { title: "Total de Eventos", value: eventsCount, icon: Calendar, color: "blue" },
    { title: "Total de Participantes", value: participantsCount, icon: Users, color: "orange" },
    { title: "Eventos Ativos", value: activeEventsCount, icon: BarChart3, color: "green" },
  ];

  const iconColorClass = {
    blue: "text-blue-600",
    orange: "text-orange-600",
    green: "text-green-600",
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="dashboard-card card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${iconColorClass[stat.color]}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${iconColorClass[stat.color]}`}>{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrganizerStatsCards;