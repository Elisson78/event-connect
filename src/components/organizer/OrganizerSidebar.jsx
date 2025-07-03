import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Calendar, Users, Building, DollarSign, HeartHandshake as Handshake, ShoppingBag, Settings, Gift } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';

const OrganizerSidebar = ({ isOpen, onClose }) => {
    const { profile: user } = useProfile();
    const location = useLocation();

    const menuItems = [
        { href: '/organizer/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
        { href: '/organizer/dashboard/profile', label: 'Perfil', icon: Building },
        { href: '/organizer/dashboard/events-management', label: 'Eventos', icon: Calendar },
        { href: '/organizer/dashboard/registrations', label: 'Inscritos', icon: Users },
        { href: '/organizer/dashboard/finances', label: 'Financeiro', icon: DollarSign },
        { href: '/organizer/dashboard/collaborators', label: 'Colaboradores', icon: Handshake },
        { href: '/organizer/dashboard/marketplace', label: 'Mercado', icon: ShoppingBag },
        { href: '/organizer/dashboard/giveaways', label: 'Sorteios', icon: Gift },
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
                        <NavLink item={{ href: '/organizer/dashboard/settings', label: 'Configurações', icon: Settings }} />
                    </div>
                </div>
            </aside>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose}></div>}
        </>
    );
};

export default OrganizerSidebar;