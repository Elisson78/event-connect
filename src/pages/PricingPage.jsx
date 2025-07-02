import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import RevenueCalculator from '@/components/pricing/RevenueCalculator';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, PlusCircle, Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const planIcons = {
  Gratuito: <TrendingUp className="h-8 w-8 text-gray-500" />, // fallback
  Plus: <PlusCircle className="h-8 w-8 text-yellow-500" />,
  Pro: <Star className="h-8 w-8 text-violet-500" />,
};

const getPlanIcon = (name) => {
  if (name.toLowerCase().includes('plus')) return planIcons.Plus;
  if (name.toLowerCase().includes('pro')) return planIcons.Pro;
  if (name.toLowerCase().includes('gratuito') || name.toLowerCase().includes('free')) return planIcons.Gratuito;
  return planIcons.Gratuito;
};

const PricingPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('plans').select('*').order('created_at');
      if (!error) setPlans(data.filter(p => p.is_active));
      setLoading(false);
    };
    fetchPlans();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900">
              Calcule sua receita potencial
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Com a nossa calculadora de preços, você pode estimar sua renda de forma rápida e fácil. Nossas taxas são cobradas por ingresso vendido e todos os valores são emitidos com IVA incluso. Teste sem compromisso qual é o seu rendimento por pacote.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <RevenueCalculator />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-24 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Nossos Planos em Detalhe</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Transparência é fundamental. Aqui estão as taxas para cada um dos nossos pacotes.
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {loading ? (
                <div className="col-span-3 text-center text-gray-500 py-12">Carregando planos...</div>
              ) : plans.length === 0 ? (
                <div className="col-span-3 text-center text-gray-500 py-12">Nenhum plano disponível no momento.</div>
              ) : (
                plans.map((plan, idx) => (
                  <Card
                    key={plan.id}
                    className={`text-left shadow-lg hover:shadow-xl transition-shadow duration-300 ${plan.name.toLowerCase().includes('plus') ? 'border-2 border-yellow-400' : ''}`}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        {getPlanIcon(plan.name)}
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      </div>
                      <CardDescription className="text-lg font-semibold text-gray-800 pt-2">
                        {plan.fee_percent > 0 ? `${parseFloat(plan.fee_percent).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}% + ` : ''}CHF {parseFloat(plan.fee_fixed).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </CardDescription>
                      <CardDescription>por ingresso vendido</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{plan.description}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;