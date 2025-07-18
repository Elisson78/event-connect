import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const AdminPlatformFees = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generatingFeeId, setGeneratingFeeId] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    volume_inscricoes: 0,
    lucro_plataforma: 0,
    taxas_recebidas: 0,
    taxas_pendentes: 0,
    historico_taxas: [],
    eventos_sem_taxa: []
  });

  // Buscar dados do dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_admin_dashboard_data');
      
      if (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        toast({ 
          title: 'Erro ao carregar dados', 
          description: error.message, 
          variant: 'destructive' 
        });
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setDashboardData({
          volume_inscricoes: result.volume_inscricoes || 0,
          lucro_plataforma: result.lucro_plataforma || 0,
          taxas_recebidas: result.taxas_recebidas || 0,
          taxas_pendentes: result.taxas_pendentes || 0,
          historico_taxas: result.historico_taxas || [],
          eventos_sem_taxa: result.eventos_sem_taxa || []
        });
      }
    } catch (error) {
      console.error('Erro geral:', error);
      toast({ 
        title: 'Erro inesperado', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerar taxa manualmente para um evento
  const handleGenerateFee = async (eventId) => {
    setGeneratingFeeId(eventId);
    try {
      const { data, error } = await supabase.rpc('generate_event_service_fee', {
        p_event_id: eventId
      });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const result = data[0];
        if (result.success) {
          toast({ 
            title: 'Taxa gerada com sucesso', 
            description: result.message,
            variant: 'success'
          });
          // Recarregar dados do dashboard
          await fetchDashboardData();
        } else {
          toast({ 
            title: 'Erro ao gerar taxa', 
            description: result.message,
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao gerar taxa:', error);
      toast({ 
        title: 'Erro ao gerar taxa', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setGeneratingFeeId(null);
    }
  };

  // Formatar valor monetário
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(value || 0);
  };

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Carregar dados na montagem do componente
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Cards de métricas
  const metricCards = [
    {
      title: 'Volume de Inscrições',
      value: dashboardData.volume_inscricoes,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Lucro da Plataforma',
      value: formatCurrency(dashboardData.lucro_plataforma),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Taxas Recebidas',
      value: formatCurrency(dashboardData.taxas_recebidas),
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Taxas Pendentes',
      value: formatCurrency(dashboardData.taxas_pendentes),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taxas</h1>
          <p className="text-gray-600">Gerencie as taxas de serviço da plataforma</p>
        </div>
        <Button onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className={card.bgColor}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Histórico de Taxas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Taxas da Plataforma</CardTitle>
          <p className="text-sm text-gray-600">
            Visualize todas as taxas de serviço geradas por inscrições em eventos.
          </p>
        </CardHeader>
        <CardContent>
          {dashboardData.historico_taxas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organizador</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.historico_taxas.map((taxa) => (
                  <TableRow key={taxa.id}>
                    <TableCell className="font-medium">{taxa.organizador || '-'}</TableCell>
                    <TableCell>{taxa.evento || '-'}</TableCell>
                    <TableCell>{taxa.plano || 'Padrão'}</TableCell>
                    <TableCell>{formatCurrency(taxa.valor)}</TableCell>
                    <TableCell>
                      <Badge variant={taxa.status === 'paid' ? 'default' : 'secondary'}>
                        {taxa.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(taxa.data)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma taxa encontrada.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eventos sem Taxa */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos sem Taxa de Serviço</CardTitle>
          <p className="text-sm text-gray-600">
            Estes eventos ainda não possuem taxa de serviço gerada. Clique para gerar manualmente.
          </p>
        </CardHeader>
        <CardContent>
          {dashboardData.eventos_sem_taxa.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Organizador</TableHead>
                  <TableHead>Inscrições Confirmadas</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.eventos_sem_taxa.map((evento) => (
                  <TableRow key={evento.id}>
                    <TableCell className="font-medium">{evento.nome}</TableCell>
                    <TableCell>{evento.organizador || '-'}</TableCell>
                    <TableCell>{evento.inscricoes_confirmadas}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleGenerateFee(evento.id)}
                        disabled={generatingFeeId === evento.id}
                      >
                        {generatingFeeId === evento.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        {generatingFeeId === evento.id ? 'Gerando...' : 'Gerar taxa'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Todos os eventos já possuem taxas geradas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlatformFees;