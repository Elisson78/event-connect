
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Building2, 
  CreditCard, 
  DollarSign, 
  Settings, 
  Palette, 
  FileText, 
  Store, 
  Calendar, 
  CheckSquare,
  Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

const AdminSidebar = ({ onNavigate, onOpenSettings }) => {
  const { t } = useTranslation('common');
  const [activeSection, setActiveSection] = React.useState('dashboard');

  const handleNavigation = (section) => {
    setActiveSection(section);
    onNavigate(section);
  };

  const menuItems = [
    { id: 'dashboard', label: t('admin_dashboard'), icon: LayoutDashboard },
    { id: 'users', label: t('users'), icon: Users },
    { id: 'roles', label: t('admin_roles'), icon: Shield },
    { id: 'organizers', label: t('organizers'), icon: Building2 },
    { id: 'plans', label: t('plans'), icon: CreditCard },
    { id: 'platform_fees', label: t('taxes'), icon: DollarSign },
    { id: 'payments', label: t('admin_payments'), icon: CreditCard },
    { id: 'manual_payments', label: t('confirmations'), icon: CheckSquare },
    { id: 'event-types', label: t('event_types'), icon: Calendar },
    { id: 'pages', label: t('pages'), icon: FileText },
    { id: 'marketplace', label: t('market'), icon: Store },
    { id: 'cardSettings', label: t('cards'), icon: Palette },
    { id: 'backup', label: t('backup'), icon: Database },
    { id: 'settings', label: t('configurations'), icon: Settings },
  ];

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto z-30"
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('administration')}</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "default" : "ghost"}
                className={`w-full justify-start ${
                  activeSection === item.id 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => handleNavigation(item.id)}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
};

export default AdminSidebar;
