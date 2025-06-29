import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Plus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const OrganizerGiveaways = () => {
  const { toast } = useToast();

  const handleCreateGiveaway = () => {
    toast({
      title: "🚧 Funcionalidade em Breve!",
      description: "A criação de sorteios será implementada em breve. Você poderá sortear prêmios para os participantes dos seus eventos!",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="shadow-xl rounded-lg">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">Gerenciamento de Sorteios</CardTitle>
              <CardDescription>Crie e gerencie sorteios para engajar os participantes.</CardDescription>
            </div>
            <Button onClick={handleCreateGiveaway}>
              <Plus className="h-4 w-4 mr-2" /> Criar Sorteio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20">
            <Gift className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum sorteio criado ainda</h3>
            <p className="text-gray-500 mb-6">
              Clique em "Criar Sorteio" para começar a distribuir prêmios e aumentar o engajamento!
            </p>
            <Button onClick={handleCreateGiveaway} size="lg">
              <Plus className="h-5 w-5 mr-2" /> Criar meu primeiro sorteio
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OrganizerGiveaways;