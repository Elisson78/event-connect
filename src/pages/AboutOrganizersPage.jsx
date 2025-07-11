import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, BarChart, CheckCircle, DollarSign, TrendingUp, Users, Zap } from 'lucide-react';

const AboutOrganizersPage = () => {
  useEffect(() => {
    document.title = 'Para Organizadores - Event Connect';
  }, []);

  const plans = [
    {
      name: "Básico",
      price: "Grátis",
      features: [
        "Publicação de até 2 eventos/mês",
        "Página básica do evento",
        "Até 50 participantes por evento",
        "Suporte via comunidade",
      ],
      cta: "Comece Agora",
      link: "/register?role=organizer",
      popular: false,
      gradient: "from-gray-400 to-gray-600",
    },
    {
      name: "Pro",
      price: "R$ 49",
      priceSuffix: "/mês",
      features: [
        "Eventos ilimitados",
        "Página do evento personalizável",
        "Até 500 participantes por evento",
        "Suporte prioritário por email",
        "Estatísticas avançadas",
      ],
      cta: "Escolher Plano Pro",
      link: "/register?role=organizer",
      popular: true,
      gradient: "from-blue-500 to-blue-700",
    },
    {
      name: "Empresarial",
      price: "Personalizado",
      features: [
        "Tudo do plano Pro",
        "Gerente de contas dedicado",
        "Integrações customizadas",
        "Suporte VIP 24/7",
        "Relatórios personalizados",
      ],
      cta: "Entre em Contato",
      link: "mailto:vendas@eventiconnect.com",
      popular: false,
      gradient: "from-orange-500 to-orange-700",
    },
  ];

  const benefits = [
    { icon: <Zap className="h-8 w-8 text-orange-500" />, title: "Publique Rapidamente", description: "Crie e lance seu evento em minutos com nossa interface intuitiva." },
    { icon: <Users className="h-8 w-8 text-blue-500" />, title: "Alcance Seu Público", description: "Nossa plataforma ajuda você a divulgar seus eventos para milhares de participantes." },
    { icon: <BarChart className="h-8 w-8 text-green-500" />, title: "Gerencie com Facilidade", description: "Ferramentas completas para gerenciar inscrições, pagamentos e comunicação." },
    { icon: <DollarSign className="h-8 w-8 text-red-500" />, title: "Monetize Seus Eventos", description: "Opções flexíveis de ingressos e pagamentos seguros integrados." },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <motion.header 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="bg-gradient-to-r from-slate-900 via-gray-800 to-slate-900 text-white py-20 md:py-32"
      >
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Potencialize Seus Eventos com <span className="text-orange-400">Event Connect</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            A plataforma completa para criar, gerenciar e promover eventos de sucesso. Junte-se a milhares de organizadores que confiam na Event Connect.
          </p>
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-10 py-7 rounded-lg font-semibold shadow-xl transform hover:scale-105 transition-transform">
            <Link to="/register?role=organizer">Comece a Organizar Agora</Link>
          </Button>
        </div>
      </motion.header>

      <section id="benefits" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Por que escolher a Event Connect?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Oferecemos as ferramentas e o suporte que você precisa para transformar suas ideias em eventos memoráveis.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow"
              >
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      <section id="history" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Nossa Jornada</h2>
                <p className="text-lg text-gray-600">Conectando pessoas através de experiências incríveis.</p>
            </div>
            <div className="bg-white p-8 md:p-12 rounded-xl shadow-xl space-y-6">
                <p className="text-gray-700 text-lg leading-relaxed">
                    A Event Connect nasceu da paixão por eventos e da crença de que a tecnologia pode simplificar e enriquecer a forma como eles são organizados e vivenciados. Desde 2023, nossa missão tem sido fornecer uma plataforma robusta, intuitiva e acessível para organizadores de todos os tamanhos.
                </p>
                <p className="text-gray-700 text-lg leading-relaxed">
                    Começamos como uma pequena equipe de entusiastas e, hoje, somos uma comunidade crescente que já ajudou a realizar milhares de eventos, desde pequenas reuniões locais até grandes conferências nacionais. Acreditamos no poder dos encontros para inspirar, educar e entreter.
                </p>
                <p className="text-gray-700 text-lg leading-relaxed">
                    Nossos valores são inovação contínua, foco no cliente e paixão por resultados. Estamos sempre buscando novas maneiras de melhorar nossa plataforma e oferecer o melhor suporte possível aos nossos usuários. Junte-se a nós e faça parte desta história de sucesso!
                </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-gray-800 text-gray-400 text-center">
        <div className="container mx-auto px-6">
          <p>&copy; {new Date().getFullYear()} Event Connect. Todos os direitos reservados.</p>
          <p className="text-sm">Feito com ❤️ para conectar pessoas.</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutOrganizersPage;