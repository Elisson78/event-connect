import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, PlusCircle, Star, TrendingUp, Tag, FileText } from 'lucide-react';

const plans = {
  Gratuito: { name: 'Gratuito', fee_percent: 0, fee_fixed: 0.50, features: ['Todas as funções essenciais', 'Com publicidade de terceiros'] },
  Plus: { name: 'Plus', fee_percent: 0.039, fee_fixed: 0.49, features: ['Todas as funções do Gratuito', 'Suporte prioritário'] },
  Pro: { name: 'Pro', fee_percent: 0.049, fee_fixed: 0.89, features: ['Todas as funções do Plus', 'Sem anúncios de terceiros'] },
};

const RevenueCalculator = () => {
  const [ticketPrice, setTicketPrice] = useState('');
  const [numTickets, setNumTickets] = useState('');
  const [noThirdPartyAds, setNoThirdPartyAds] = useState(false);
  const [results, setResults] = useState({
    plan: plans.Gratuito,
    grossRevenue: 0,
    totalCommission: 0,
    netRevenue: 0,
  });

  useEffect(() => {
    const price = parseFloat(ticketPrice) || 0;
    const quantity = parseInt(numTickets) || 0;

    let selectedPlan = plans.Gratuito;
    if (noThirdPartyAds) {
      selectedPlan = plans.Pro;
    } else if (price > 50) {
      selectedPlan = plans.Plus;
    }

    const grossRevenue = price * quantity;
    const totalCommission = (price * selectedPlan.fee_percent + selectedPlan.fee_fixed) * quantity;
    const netRevenue = grossRevenue - totalCommission;

    setResults({
      plan: selectedPlan,
      grossRevenue,
      totalCommission,
      netRevenue,
    });
  }, [ticketPrice, numTickets, noThirdPartyAds]);

  const formatCurrency = (value) => {
    return `CHF ${value.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
      <Card className="lg:col-span-3 shadow-2xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-800">Calcule sua receita</CardTitle>
          <CardDescription>
            Digite o número de ingressos e o preço. O plano é selecionado automaticamente com base nas seguintes regras: se o preço do bilhete for superior a CHF 50, o pacote Plus é selecionado. Se você marcar 'sem anúncios de terceiros', o pacote Pro será aplicado.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-6 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
            <div>
              <Label htmlFor="ticket-price" className="font-semibold text-gray-700">Preço do ingresso</Label>
              <div className="relative mt-2">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="ticket-price"
                  type="number"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  className="pl-10 text-lg"
                  placeholder="0.00"
                />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">CHF</span>
              </div>
            </div>
            <div>
              <Label htmlFor="num-tickets" className="font-semibold text-gray-700">Ingressos vendidos</Label>
              <div className="relative mt-2">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="num-tickets"
                  type="number"
                  value={numTickets}
                  onChange={(e) => setNumTickets(e.target.value)}
                  className="pl-10 text-lg"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-violet-50 border border-violet-200 rounded-lg">
            <Checkbox
              id="no-ads"
              checked={noThirdPartyAds}
              onCheckedChange={setNoThirdPartyAds}
              className="h-5 w-5"
            />
            <Label htmlFor="no-ads" className="text-base font-medium text-violet-800 flex items-center">
              Sem anúncios de terceiros
              <Star className="h-4 w-4 ml-2 text-violet-500 fill-current" />
              <span className="ml-1 font-bold">Pro</span>
            </Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Receita Bruta (IVA incl.)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(results.grossRevenue)}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-800">Custos Totais</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(results.totalCommission)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Sua Receita Líquida</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.netRevenue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={results.plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Card className={`h-full shadow-2xl rounded-2xl border-0 ${
              results.plan.name === 'Gratuito' ? 'bg-gray-100' :
              results.plan.name === 'Plus' ? 'bg-yellow-50 border-yellow-300' :
              'bg-violet-100 border-violet-300'
            }`}>
              <CardContent className="p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    {results.plan.name === 'Gratuito' && <TrendingUp className="h-8 w-8 text-gray-500" />}
                    {results.plan.name === 'Plus' && <PlusCircle className="h-8 w-8 text-yellow-500" />}
                    {results.plan.name === 'Pro' && <Star className="h-8 w-8 text-violet-500" />}
                    <h3 className="text-2xl font-bold">Pacote {results.plan.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-6">O plano ideal para suas necessidades atuais.</p>
                  <ul className="space-y-3">
                    {results.plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button variant="default" size="lg" className="w-full mt-8">
                  Comparar Pacotes
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RevenueCalculator;