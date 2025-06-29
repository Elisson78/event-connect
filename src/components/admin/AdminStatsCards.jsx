import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, BarChart3, Shield } from 'lucide-react';

const AdminStatsCards = ({ stats }) => {
  const { totalUsers, newUsersThisWeek, totalEvents, activeEvents, totalParticipations, totalOrganizers } = stats;
  
  const statCards = [
    { title: "Total de Usuários", value: totalUsers, icon: Users, subtext: `+${newUsersThisWeek} esta semana`, color: "blue" },
    { title: "Total de Eventos", value: totalEvents, icon: Calendar, subtext: `${activeEvents} ativos`, color: "orange" },
    { title: "Participações", value: totalParticipations, icon: BarChart3, subtext: "Total de inscrições", color: "green" },
    { title: "Organizadores", value: totalOrganizers, icon: Shield, subtext: "Usuários ativos", color: "purple" },
  ];

  const iconColorClass = {
    blue: "text-blue-600",
    orange: "text-orange-600",
    green: "text-green-600",
    purple: "text-purple-600",
  }

  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => (
        <Card key={index} className="dashboard-card card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${iconColorClass[card.color]}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${iconColorClass[card.color]}`}>{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStatsCards;