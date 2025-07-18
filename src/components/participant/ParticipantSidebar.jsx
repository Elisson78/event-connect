import React from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { Home, CalendarCheck, UserCircle, LogOut, Trophy, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ParticipantSidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { profile: user } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'P';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const navItems = [
    { name: t('participant.overview') || 'Visão Geral', path: '/participant/dashboard', icon: Home },
    { name: t('participant.myEvents') || 'Meus Eventos', path: 'my-events', icon: CalendarCheck },
    { name: t('participant.prizes') || 'Prêmios', path: 'prizes', icon: Trophy },
    { name: t('participant.documents') || 'Documentos', path: 'documents', icon: Award },
    { name: t('participant.profile') || 'Perfil', path: 'profile', icon: UserCircle },
  ];

  return (
    <>
      <aside className={`fixed lg:relative inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-gradient-to-b from-blue-700 to-blue-500 text-white p-6 flex flex-col shadow-lg z-50`}>
        <div className="flex flex-col items-center mb-10">
          <Avatar className="h-24 w-24 mb-3 border-4 border-blue-400">
            <AvatarImage src={user?.avatar_url || ''} alt={user?.name || 'Participante'} />
            <AvatarFallback className="text-3xl bg-blue-600 text-white">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold">{user?.name || 'Participante'}</h2>
          <p className="text-sm text-blue-200">{user?.email}</p>
        </div>

        <nav className="flex-1 space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/participant/dashboard'} 
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out hover:bg-blue-600 hover:shadow-md ${
                  isActive ? 'bg-blue-800 shadow-inner' : 'hover:bg-opacity-75'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
          <NavLink
            to="finances"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out hover:bg-blue-600 hover:shadow-md ${
                isActive ? 'bg-blue-800 shadow-inner' : 'hover:bg-opacity-75'
              }`
            }
          >
            <span className="text-xl">💰</span>
            <span>{t('participant.finances') || 'Finanças'}</span>
          </NavLink>
        </nav>

        <div className="mt-auto">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-blue-100 hover:bg-red-500 hover:text-white rounded-lg transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('logout') || 'Sair'}</span>
          </Button>
          <p className="text-xs text-center text-blue-300 mt-4">
            EventiConnect © {new Date().getFullYear()}
          </p>
        </div>
      </aside>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose}></div>}
    </>
  );
};

export default ParticipantSidebar;