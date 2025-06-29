
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

const AdminSidebar = ({ onNavigate, onOpenSettings }) => {
  const [activeSection, setActiveSection] = React.useState('dashboard');

  const handleNavigation = (section) => {
    setActiveSection(section);
    onNavigate(section);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'roles', label: 'Funções', icon: Shield },
    { id: 'organizers', label: 'Organizadores', icon: Building2 },
    { id: 'plans', label: 'Planos', icon: CreditCard },
    { id: 'platform_fees', label: 'Taxas', icon: DollarSign },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
    { id: 'manual_payments', label: 'Confirmações', icon: CheckSquare },
    { id: 'event-types', label: 'Tipos de Evento', icon: Calendar },
    { id: 'pages', label: 'Páginas', icon: FileText },
    { id: 'marketplace', label: 'Mercado', icon: Store },
    { id: 'cardSettings', label: 'Cards', icon: Palette },
    { id: 'backup', label: 'Backup', icon: Database },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto z-30"
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Administração</h2>
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
