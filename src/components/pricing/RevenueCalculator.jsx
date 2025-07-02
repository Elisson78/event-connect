import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Tag, FileText } from 'lucide-react';

const getFeeFixed = (ticketPrice) => {
  if (ticketPrice >= 0 && ticketPrice <= 50) return 0.50;
  if (ticketPrice >= 51 && ticketPrice <= 100) return 0.60;
  if (ticketPrice >= 101 && ticketPrice <= 500) return 0.65;
  if (ticketPrice > 500) return 0.65;
  return 0.50;
};

const RevenueCalculator = () => {
  const [ticketPrice, setTicketPrice] = useState('');
  const [numTickets, setNumTickets] = useState('');
  const [results, setResults] = useState({
    feeFixed: 0.50,
    grossRevenue: 0,
    totalCommission: 0,
    netRevenue: 0,
  });

  useEffect(() => {
    const price = parseFloat(ticketPrice) || 0;
    const quantity = parseInt(numTickets) || 0;
    const feeFixed = getFeeFixed(price);
    const grossRevenue = price * quantity;
    const totalCommission = feeFixed * quantity;
    const netRevenue = grossRevenue - totalCommission;
    setResults({ feeFixed, grossRevenue, totalCommission, netRevenue });
  }, [ticketPrice, numTickets]);

  const formatCurrency = (value) => {
    return `CHF ${value.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
      <Card className="lg:col-span-3 shadow-2xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-800">Calcule sua receita</CardTitle>
          <CardDescription>
            Digite o número de ingressos e o preço. A taxa fixa por ingresso será aplicada conforme a tabela:
            <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
              <li>0 a 50 ingressos: <b>CHF 0.50</b> por ingresso</li>
              <li>51 a 100 ingressos: <b>CHF 0.60</b> por ingresso</li>
              <li>101 a 500 ingressos: <b>CHF 0.65</b> por ingresso</li>
              <li>Acima de 500 ingressos: <b>CHF 0.65</b> por ingresso</li>
            </ul>
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
          <div className="pt-4 text-base text-gray-700">
            <b>Taxa fixa aplicada:</b> {formatCurrency(results.feeFixed)} por ingresso
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
            key={results.feeFixed}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Card className="h-full shadow-2xl rounded-2xl border-0 bg-gray-100">
              <CardContent className="p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <h3 className="text-2xl font-bold">Resumo do cálculo</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center space-x-3">
                      <span className="text-gray-700">Taxa fixa aplicada: <b>{formatCurrency(results.feeFixed)}</b> por ingresso</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-gray-700">Receita bruta: <b>{formatCurrency(results.grossRevenue)}</b></span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-gray-700">Custos totais: <b>{formatCurrency(results.totalCommission)}</b></span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-gray-700">Receita líquida: <b>{formatCurrency(results.netRevenue)}</b></span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RevenueCalculator;