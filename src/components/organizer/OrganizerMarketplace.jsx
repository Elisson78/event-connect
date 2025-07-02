import React from 'react';
import { useEvents } from '@/contexts/EventContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Instagram, Facebook, Radio } from 'lucide-react';
import { useToast } from '../ui/use-toast';

const GoogleIcon = () => (
  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

const PlatformIcon = ({ platform }) => {
  switch (platform) {
    case 'Site': return <Sparkles className="h-6 w-6 text-yellow-500" />;
    case 'Instagram': return <Instagram className="h-6 w-6 text-pink-500" />;
    case 'Facebook': return <Facebook className="h-6 w-6 text-blue-600" />;
    case 'Google': return <GoogleIcon />;
    default: return <Radio className="h-6 w-6 text-gray-400" />;
  }
};


const OrganizerMarketplace = () => {
  const { adPlans, loadingAdPlans } = useEvents();
  const { toast } = useToast();

  const handleSelectPlan = (planName) => {
    toast({
      title: "Plano selecionado!",
      description: `O plano "${planName}" foi adicionado ao seu carrinho (simulação).`,
    });
  };

  const activePlans = adPlans.filter(plan => plan.is_active);

  if (loadingAdPlans) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </CardContent>
            <CardFooter>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  const plansByPlatform = activePlans.reduce((acc, plan) => {
    (acc[plan.platform] = acc[plan.platform] || []).push(plan);
    return acc;
  }, {});

  return (
    <div className="space-y-12">
      {Object.entries(plansByPlatform).map(([platform, plans]) => (
        <div key={platform}>
          <div className="flex items-center space-x-3 mb-6">
            <PlatformIcon platform={platform} />
            <h2 className="text-2xl font-bold text-gray-800">{platform}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map(plan => (
              <Card key={plan.id} className="flex flex-col rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-green-600 font-semibold text-2xl">
                    R$ {plan.price.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-gray-600">{plan.description}</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full btn-primary text-white"
                    onClick={() => handleSelectPlan(plan.name)}
                  >
                    <Check className="mr-2 h-4 w-4" /> Selecionar Plano
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ))}
       <div className="mt-12 text-center">
        <p className="text-gray-500">
            🚧 A integração de pagamento com Stripe será implementada em breve! 🚀
        </p>
      </div>
    </div>
  );
};

export default OrganizerMarketplace;