import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, BarChart3, Shield } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const AdminStatsCards = ({ stats }) => {
  const { t } = useTranslation('common');
  const { totalUsers, newUsersThisWeek, totalEvents, activeEvents, totalParticipations, totalOrganizers } = stats;
  
  const statCards = [
    { title: t('total_users'), value: totalUsers, icon: Users, subtext: t('new_users_this_week', { count: newUsersThisWeek }), color: "blue" },
    { title: t('total_events'), value: totalEvents, icon: Calendar, subtext: t('active_events', { count: activeEvents }), color: "orange" },
    { title: t('participations'), value: totalParticipations, icon: BarChart3, subtext: t('total_registrations'), color: "green" },
    { title: t('organizers'), value: totalOrganizers, icon: Shield, subtext: t('active_users'), color: "purple" },
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