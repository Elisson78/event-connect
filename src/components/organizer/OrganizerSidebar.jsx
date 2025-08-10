import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Calendar, Users, Building, DollarSign, HeartHandshake as Handshake, ShoppingBag, Settings, Gift, CreditCard, LogOut, User } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/components/ui/use-toast';

const OrganizerSidebar = ({ isOpen, onClose }) => {
    const { t } = useTranslation('common');
    const { profile: user } = useProfile();
    const { signOut } = useAuth();
    const { toast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
            toast({
                title: t('logout_success_title'),
                description: t('logout_success_desc'),
                className: "bg-green-100 border-green-400 text-green-700",
            });
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
            toast({
                title: t('logout_error_title'),
                description: t('logout_error_desc'),
                variant: "destructive"
            });
        }
    };

    const menuItems = [
        { href: '/organizer/dashboard', label: t('organizer_overview'), icon: LayoutDashboard },
        { href: '/organizer/dashboard/profile', label: t('company_profile'), icon: Building },
        { href: '/organizer/dashboard/events-management', label: t('events'), icon: Calendar },
        { href: '/organizer/dashboard/registrations', label: t('manage_registrations'), icon: Users },
        { href: '/organizer/dashboard/finances', label: t('my_finances'), icon: DollarSign },
        { href: '/organizer/dashboard/collaborators', label: t('collaborators'), icon: Handshake },
        { href: '/organizer/dashboard/marketplace', label: t('marketplace'), icon: ShoppingBag },
        { href: '/organizer/dashboard/giveaways', label: t('giveaway_system'), icon: Gift },
        { href: '/organizer/dashboard/payments', label: t('payment_methods'), icon: CreditCard },
    ];

    const NavLink = ({ item }) => (
        <Link to={item.href} onClick={onClose}>
            <motion.div
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                    location.pathname === item.href
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'hover:bg-slate-600 hover:shadow-md'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
            </motion.div>
        </Link>
    );

    return (
        <>
            <aside className={`fixed lg:relative inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-gradient-to-b from-slate-800 to-slate-700 text-white shadow-xl z-50`}>
                <div className="p-6 flex flex-col h-full">
                    <div className="text-center mb-8 pt-16 lg:pt-0">
                        <h2 className="text-xl font-bold text-gradient">
                            {user?.company_name || user?.name || 'Organizador'}
                        </h2>
                    </div>
                    <nav className="flex-grow space-y-2">
                        {menuItems.map((item) => <NavLink key={item.href} item={item} />)}
                    </nav>
                    <div className="mt-8 pt-6 border-t border-slate-600">
                        <NavLink item={{ href: '/organizer/dashboard/settings', label: t('settings'), icon: Settings }} />
                    </div>
                    
                    {/* Seção do Usuário e Logout */}
                    <div className="mt-6 pt-4 border-t border-slate-600">
                        <div className="flex items-center space-x-3 px-4 py-3 mb-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-slate-600 rounded-full">
                                <User className="h-5 w-5 text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {user?.company_name || user?.name || 'Organizador'}
                                </p>
                                <p className="text-xs text-slate-300 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        
                        <motion.button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200 cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium">{t('logout')}</span>
                        </motion.button>
                    </div>
                </div>
            </aside>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose}></div>}
        </>
    );
};

export default OrganizerSidebar;