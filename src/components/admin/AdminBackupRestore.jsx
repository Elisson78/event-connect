
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Database, AlertTriangle, CheckCircle, History, FileText, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const AdminBackupRestore = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [backupFile, setBackupFile] = useState(null);
  const [sqlContent, setSqlContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreHistory, setRestoreHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchRestoreHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('backup_restore_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRestoreHistory(data || []);
    } catch (error) {
      console.error('Error fetching restore history:', error);
      toast({
        title: "Erro ao carregar histórico",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingHistory(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchRestoreHistory();
  }, [fetchRestoreHistory]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo de backup não pode exceder 50MB.",
          variant: "destructive"
        });
        return;
      }
      setBackupFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setSqlContent(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const validateSqlContent = (sql) => {
    const dangerousCommands = [
      'DROP DATABASE',
      'DROP SCHEMA',
      'TRUNCATE',
      'DELETE FROM auth.',
      'DELETE FROM storage.',
      'ALTER SYSTEM',
      'CREATE ROLE',
      'DROP ROLE'
    ];

    const upperSql = sql.toUpperCase();
    for (const command of dangerousCommands) {
      if (upperSql.includes(command)) {
        return {
          isValid: false,
          error: `Comando perigoso detectado: ${command}. Por segurança, este comando não é permitido.`
        };
      }
    }

    if (!sql.trim()) {
      return {
        isValid: false,
        error: 'O conteúdo SQL não pode estar vazio.'
      };
    }

    return { isValid: true };
  };

  const executeRestore = async () => {
    if (!sqlContent.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nenhum conteúdo SQL para executar.",
        variant: "destructive"
      });
      return;
    }

    const validation = validateSqlContent(sqlContent);
    if (!validation.isValid) {
      toast({
        title: "Erro de validação",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setIsRestoring(true);
    try {
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const statement of statements) {
        try {
          const { error } = await supabase.rpc('execute_sql', { sql_statement: statement });
          if (error) {
            errorCount++;
            errors.push(`Erro em: ${statement.substring(0, 50)}... - ${error.message}`);
          } else {
            successCount++;
          }
        } catch (err) {
          errorCount++;
          errors.push(`Erro em: ${statement.substring(0, 50)}... - ${err.message}`);
        }
      }

      await supabase.from('backup_restore_history').insert({
        filename: backupFile?.name || 'SQL Manual',
        file_size: backupFile?.size || sqlContent.length,
        statements_executed: successCount,
        errors_count: errorCount,
        executed_by: user.id,
        status: errorCount === 0 ? 'success' : 'partial_success',
        error_details: errors.length > 0 ? errors : null
      });

      if (errorCount === 0) {
        toast({
          title: "Restauração concluída!",
          description: `${successCount} comandos executados com sucesso.`,
        });
      } else {
        toast({
          title: "Restauração parcial",
          description: `${successCount} sucessos, ${errorCount} erros. Verifique o histórico.`,
          variant: "destructive"
        });
      }

      setSqlContent('');
      setBackupFile(null);
      await fetchRestoreHistory();

    } catch (error) {
      console.error('Error during restore:', error);
      toast({
        title: "Erro na restauração",
        description: error.message,
        variant: "destructive"
      });

      await supabase.from('backup_restore_history').insert({
        filename: backupFile?.name || 'SQL Manual',
        file_size: backupFile?.size || sqlContent.length,
        statements_executed: 0,
        errors_count: 1,
        executed_by: user.id,
        status: 'failed',
        error_details: [error.message]
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDownloadBackup = async () => {
    toast({
      title: "🚧 Funcionalidade em desenvolvimento",
      description: "O download de backup será implementado em breve. Use ferramentas externas como pg_dump por enquanto.",
    });
  };

  const clearHistory = async () => {
    try {
      const { error } = await supabase
        .from('backup_restore_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      toast({
        title: "Histórico limpo",
        description: "Todo o histórico de restaurações foi removido.",
      });

      setRestoreHistory([]);
    } catch (error) {
      toast({
        title: "Erro ao limpar histórico",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Backup e Restauração</h2>
          <p className="text-gray-600">Gerencie backups e restaure dados do banco</p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Atenção:</strong> A restauração de backup pode sobrescrever dados existentes. 
          Sempre faça um backup atual antes de restaurar dados antigos.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="restore" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="restore">Restaurar Backup</TabsTrigger>
          <TabsTrigger value="backup">Criar Backup</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="restore">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Restaurar do Backup</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="backup-file">Arquivo de Backup (.sql)</Label>
                  <Input
                    id="backup-file"
                    type="file"
                    accept=".sql,.txt"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                  {backupFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Arquivo: {backupFile.name} ({(backupFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sql-content">Conteúdo SQL</Label>
                  <Textarea
                    id="sql-content"
                    value={sqlContent}
                    onChange={(e) => setSqlContent(e.target.value)}
                    placeholder="Cole aqui o conteúdo SQL do backup ou carregue um arquivo acima..."
                    rows={12}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                {sqlContent && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Prévia do Backup</h4>
                    <p className="text-sm text-blue-700">
                      Comandos detectados: {sqlContent.split(';').filter(s => s.trim()).length}
                    </p>
                    <p className="text-sm text-blue-700">
                      Tamanho: {(sqlContent.length / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}

                <Button
                  onClick={executeRestore}
                  disabled={!sqlContent.trim() || isRestoring}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isRestoring ? (
                    <>
                      <Database className="h-4 w-4 mr-2 animate-spin" />
                      Executando Restauração...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Executar Restauração
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Criar Backup</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <Database className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Backup Automático
                </h3>
                <p className="text-gray-600 mb-6">
                  Para criar um backup completo do banco de dados, use ferramentas externas como pg_dump 
                  ou acesse o painel do Supabase.
                </p>
                <Button
                  onClick={handleDownloadBackup}
                  variant="outline"
                  className="mx-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Backup (Em Breve)
                </Button>
              </div>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Dica:</strong> Para backups manuais, use o comando: 
                  <code className="bg-gray-100 px-2 py-1 rounded ml-2">
                    pg_dump -h [host] -U [user] -d [database] &gt; backup.sql
                  </code>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Histórico de Restaurações</span>
              </CardTitle>
              {restoreHistory.length > 0 && (
                <Button
                  onClick={clearHistory}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Histórico
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : restoreHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma restauração realizada ainda.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {restoreHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {entry.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : entry.status === 'partial_success' ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-semibold">{entry.filename}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Tamanho:</span>
                          <span className="ml-1 font-medium">
                            {(entry.file_size / 1024).toFixed(2)} KB
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Comandos:</span>
                          <span className="ml-1 font-medium">{entry.statements_executed}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Erros:</span>
                          <span className="ml-1 font-medium">{entry.errors_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className={`ml-1 font-medium ${
                            entry.status === 'success' ? 'text-green-600' :
                            entry.status === 'partial_success' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {entry.status === 'success' ? 'Sucesso' :
                             entry.status === 'partial_success' ? 'Parcial' : 'Falhou'}
                          </span>
                        </div>
                      </div>

                      {entry.error_details && entry.error_details.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                          <h5 className="font-semibold text-red-800 mb-2">Erros Encontrados:</h5>
                          <ul className="text-sm text-red-700 space-y-1">
                            {entry.error_details.slice(0, 3).map((error, index) => (
                              <li key={index} className="truncate">• {error}</li>
                            ))}
                            {entry.error_details.length > 3 && (
                              <li className="text-red-600">
                                ... e mais {entry.error_details.length - 3} erros
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AdminBackupRestore;
