
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profileLoading && profile) {
      toast({
        title: "Login bem-sucedido!",
        description: `Bem-vindo(a) de volta, ${profile.name || profile.email}!`,
        className: "bg-green-100 border-green-400 text-green-700",
      });

      switch (profile.role) {
        case 'organizer':
          navigate('/organizer/dashboard');
          break;
        case 'participant':
          navigate('/participant/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/');
      }
    }
  }, [profile, profileLoading, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "E-mail ou senha incorretos.";
      if (error.message.toLowerCase().includes('email not confirmed')) {
        errorMessage = "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e spam.";
      } else if (error.message.toLowerCase().includes('invalid login credentials')) {
        errorMessage = "Credenciais de login inválidas. Verifique seu e-mail e senha.";
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link 
          to="/" 
          className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Voltar para a página inicial
        </Link>
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="text-center p-8 bg-gray-50/50">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
              className="flex justify-center mb-4"
            >
              <div className="p-4 bg-gradient-to-tr from-blue-500 to-orange-400 rounded-full shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <CardTitle className="text-3xl font-bold text-gray-800">
              Acesse sua Conta
            </CardTitle>
            <CardDescription className="text-gray-500 pt-1">
              Bem-vindo(a) de volta ao <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">EventiConnect</span>!
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Não tem uma conta?{' '}
                <Link 
                  to="/register" 
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Cadastre-se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;