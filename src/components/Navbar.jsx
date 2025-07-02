import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Calendar, LogOut, User, Briefcase, Menu, X, PercentCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!profile) return '/';
    switch (profile.role) {
      case 'organizer':
        return '/organizer/dashboard';
      case 'participant':
        return '/participant/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const navLinks = [
    { to: "/events", text: "Eventos" },
    { to: "/planos", text: "Planos", icon: <PercentCircle className="h-4 w-4 mr-1.5" /> },
    { to: "/para-organizadores", text: "Para Organizadores", icon: <Briefcase className="h-4 w-4 mr-1.5" /> },
  ];

  if (profile) {
    navLinks.push({ to: getDashboardLink(), text: "Dashboard" });
  }

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gradient">Event Connect</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(link => (
              <Link 
                key={link.to}
                to={link.to} 
                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                {link.icon} {link.text}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {profile ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">{profile.name}</span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="btn-primary text-white">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center text-gray-700 hover:text-blue-600 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium"
                >
                  {link.icon} {link.text}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              {profile ? (
                <div className="px-5">
                  <div className="flex items-center mb-3">
                    <User className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-gray-700 font-medium">{profile.name}</span>
                  </div>
                  <Button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </Button>
                </div>
              ) : (
                <div className="px-5 space-y-3">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Entrar</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full btn-primary text-white">Cadastrar</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;