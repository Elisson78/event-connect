import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Trophy, ArrowRight, Star, Zap, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import EventCard from '@/components/EventCard';
import { useEvents } from '@/contexts/EventContext';
import { QRCode } from 'react-qrcode-logo';
import InstallPwaButton from '@/components/InstallPwaButton';
import { useLanguage } from '@/contexts/LanguageContext';

const HomePage = () => {
  const { events, loadingEvents, networkError } = useEvents();
  const { t } = useLanguage();
  const featuredEvents = events.slice(0, 4);

  useEffect(() => {
    document.title = t('page_title_home');
  }, [t]);

  const features = [
    {
      icon: Calendar,
      title: t('feature_easy_creation'),
      description: t('feature_easy_creation_desc')
    },
    {
      icon: Users,
      title: t('feature_complete_management'),
      description: t('feature_complete_management_desc')
    },
    {
      icon: Trophy,
      title: t('feature_premium_experience'),
      description: t('feature_premium_experience_desc')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <section className="hero-section min-h-[80vh] flex items-center justify-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                      {t('hero_title_line1')}
        <span className="block text-orange-400">{t('hero_title_line2')}</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              {t('hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/events">
                <Button size="lg" className="btn-orange text-white px-8 py-4 text-lg">
                  {t('explore_events')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg">
                  {t('create_event_now')}
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex justify-center">
              <div className="max-w-xs w-full">
                <InstallPwaButton />
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute top-20 left-10 animate-float">
          <Star className="h-8 w-8 text-orange-400 opacity-60" />
        </div>
        <div className="absolute bottom-32 right-16 animate-float" style={{ animationDelay: '2s' }}>
          <Zap className="h-12 w-12 text-blue-400 opacity-60" />
        </div>
        <div className="absolute top-1/3 right-20 animate-float" style={{ animationDelay: '4s' }}>
          <Trophy className="h-10 w-10 text-yellow-400 opacity-60" />
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('why_choose_title')} <span className="text-gradient">EventiConnect</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('why_choose_subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center p-8 rounded-2xl dashboard-card card-hover"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full mb-6">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('upcoming_events')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('upcoming_events_subtitle')}
            </p>
          </motion.div>

          {loadingEvents && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
          )}

          {networkError && !loadingEvents && (
            <div className="text-center py-16 text-red-600 bg-red-50 rounded-lg">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-xl font-semibold">{t('error_loading_events')}</p>
        <p>{t('error_loading_events_desc')}</p>
            </div>
          )}

          {!loadingEvents && !networkError && featuredEvents.length > 0 && (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-12">
                <Link to="/events">
                  <Button size="lg" className="btn-primary text-white px-8 py-4">
                    {t('view_all_events')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </>
          )}

          {!loadingEvents && !networkError && events.length === 0 && (
             <div className="text-center py-16">
               <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
               <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                 {t('no_events_available')}
               </h3>
               <p className="text-gray-600">
                 {t('no_events_available_desc')}
               </p>
             </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('ready_to_create_next_event')}
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {t('ready_to_create_next_event_desc')}
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
                {t('start_now_free')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">EventiConnect</span>
              </div>
              <p className="text-gray-400">
                {t('footer_platform_desc')}
              </p>
            </div>
            <div>
              <span className="text-lg font-semibold mb-4 block">Plataforma</span>
              <ul className="space-y-2 text-gray-400">
                <li>{t('create_events')}</li>
                <li>{t('participate')}</li>
                <li>{t('manage')}</li>
              </ul>
            </div>
            <div>
              <span className="text-lg font-semibold mb-4 block">Suporte</span>
              <ul className="space-y-2 text-gray-400">
                <li>{t('help_center')}</li>
                <li>{t('contact')}</li>
                <li>{t('faq')}</li>
              </ul>
            </div>
            <div>
              <span className="text-lg font-semibold mb-4 block">Legal</span>
              <ul className="space-y-2 text-gray-400">
                <li>{t('terms_of_use')}</li>
                <li>{t('privacy_policy')}</li>
                <li>{t('cookies')}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} EventiConnect. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;