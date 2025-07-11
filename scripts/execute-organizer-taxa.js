import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = 'https://jthzmlxisefyvzlnudsi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aHptbHhpc2VmeXZ6bG51ZHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODU1MzQsImV4cCI6MjA2NTg2MTUzNH0.EX5sziSNoKU9KucDWhe4Si0rlJObY778g18-cez8XM8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeOrganizerTaxaSQL() {
  try {
    console.log('🚀 Iniciando execução do script SQL para criar tabela organizer_taxa...');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, '..', 'database_organizer_taxa.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Conteúdo do script SQL carregado...');
    
    // Executar o SQL usando a função rpc do Supabase
    // Nota: Para executar SQL DDL, precisamos usar o service_role key
    // Como não temos acesso ao service_role, vamos usar uma abordagem alternativa
    
    console.log('⚠️  Para executar este script SQL, você precisa:');
    console.log('');
    console.log('1. Acessar o Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Selecionar seu projeto: jthzmlxisefyvzlnudsi');
    console.log('3. Ir para SQL Editor');
    console.log('4. Copiar e colar o conteúdo do arquivo execute_organizer_taxa.sql');
    console.log('5. Clicar em "Run" para executar');
    console.log('');
    console.log('📋 Conteúdo do script para copiar:');
    console.log('=' .repeat(80));
    console.log(sqlContent);
    console.log('=' .repeat(80));
    
    // Alternativa: tentar criar a tabela usando queries individuais
    console.log('');
    console.log('🔄 Tentando criar a tabela usando queries individuais...');
    
    // Verificar se a tabela já existe
    const { data: existingTable, error: checkError } = await supabase
      .from('organizer_taxa')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.log('❌ Tabela organizer_taxa não existe. Execute o script SQL no Supabase Dashboard.');
    } else if (existingTable) {
      console.log('✅ Tabela organizer_taxa já existe!');
    } else {
      console.log('❓ Erro ao verificar tabela:', checkError);
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
  }
}

// Executar o script
executeOrganizerTaxaSQL(); 