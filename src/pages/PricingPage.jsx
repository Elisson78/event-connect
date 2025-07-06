import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import RevenueCalculator from '@/components/pricing/RevenueCalculator';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, PlusCircle, Star } from 'lucide-react';

const PricingPage = () => {
  useEffect(() => {
    document.title = 'Planos e Preços - Event Connect';
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
              <Card className="text-left shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-gray-500" />
                    <CardTitle className="text-2xl">Gratuito</CardTitle>
                  </div>
                  <CardDescription className="text-lg font-semibold text-gray-800 pt-2">CHF 0.50</CardDescription>
                  <CardDescription>por ingresso vendido</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Ideal para eventos gratuitos ou para quem está começando. Inclui publicidade de terceiros.</p>
                </CardContent>
              </Card>
              <Card className="text-left shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-yellow-400">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <PlusCircle className="h-8 w-8 text-yellow-500" />
                    <CardTitle className="text-2xl">Plus</CardTitle>
                  </div>
                  <CardDescription className="text-lg font-semibold text-gray-800 pt-2">3.9% + CHF 0.49</CardDescription>
                  <CardDescription>por ingresso vendido</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Selecionado automaticamente para ingressos acima de CHF 50. Oferece suporte prioritário.</p>
                </CardContent>
              </Card>
              <Card className="text-left shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Star className="h-8 w-8 text-violet-500" />
                    <CardTitle className="text-2xl">Pro</CardTitle>
                  </div>
                  <CardDescription className="text-lg font-semibold text-gray-800 pt-2">4.9% + CHF 0.89</CardDescription>
                  <CardDescription>por ingresso vendido</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Para uma experiência premium sem anúncios de terceiros no seu evento.</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;