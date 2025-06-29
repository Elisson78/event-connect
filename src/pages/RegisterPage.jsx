
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Mail, Lock, User, ArrowLeft, UserCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('name, display_name')
          .neq('name', 'admin'); 
        if (error) throw error;
        setAvailableRoles(data || []);
      } catch (error) {
        console.error("Error fetching roles:", error);
        toast({ title: 'Erro ao carregar tipos de conta', description: error.message, variant: 'destructive' });
      }
    };
    fetchRoles();
  }, [toast]);

  const validateForm = () => {
    const { name, email, password, confirmPassword, role } = formData;
    if (!name.trim()) {
      toast({ title: "Campo obrigatório", description: "Por favor, preencha seu nome.", variant: "destructive" });
      return false;
    }
    if (!email) {
      toast({ title: "Campo obrigatório", description: "Por favor, preencha seu email.", variant: "destructive" });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        toast({ title: "Email inválido", description: "Por favor, insira um email válido.", variant: "destructive" });
        return false;
    }
    if (!role) {
      toast({ title: "Campo obrigatório", description: "Por favor, selecione um tipo de conta.", variant: "destructive" });
      return false;
    }
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return false;
    }
    if (password !== confirmPassword) {
      toast({ title: "As senhas não coincidem", description: "Por favor, verifique sua senha.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    const { name, email, password, role } = formData;

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: `Bem-vindo(a), ${name}! Você já pode fazer o login.`,
        className: "bg-green-100 border-green-400 text-green-700",
        duration: 9000,
      });

      navigate('/login');
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Ocorreu um erro inesperado. Tente novamente.";
      if (error.message && error.message.toLowerCase().includes("user already registered")) {
          errorMessage = "Este e-mail já está cadastrado. Tente fazer login.";
      }
      toast({ title: "Erro no cadastro", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, role: value }));
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
                        <UserCheck className="h-8 w-8 text-white" />
                    </div>
                </motion.div>
              <CardTitle className="text-3xl font-bold text-gray-800">Crie sua conta</CardTitle>
              <CardDescription className="text-gray-500 pt-1">É rápido e fácil. Comece agora!</CardDescription>
            </CardHeader>

            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="name" type="text" placeholder="Seu nome" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required className="pl-10 h-11"/>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="email" type="email" placeholder="seu.email@exemplo.com" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required className="pl-10 h-11"/>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">Eu sou</Label>
                   <Select value={formData.role} onValueChange={handleSelectChange}>
                      <SelectTrigger className="h-11">
                        <div className="flex items-center gap-3">
                            <UserCheck className="h-5 w-5 text-gray-400" />
                            <SelectValue placeholder="Selecione um tipo de conta" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                           <SelectItem key={role.name} value={role.name}>{role.display_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} required className="pl-10 h-11"/>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                   <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="confirmPassword" type="password" placeholder="Repita a senha" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} required className="pl-10 h-11"/>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white !mt-6">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {loading ? 'Criando...' : 'Criar Conta'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-gray-600">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                    Faça login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
