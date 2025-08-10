# 🎉 Event Connect

Uma plataforma moderna para conectar organizadores de eventos e participantes, desenvolvida com React, Vite e Supabase.

## ✨ Funcionalidades

- **🎫 Gestão de Eventos**: Criação e gerenciamento completo de eventos
- **👥 Sistema de Inscrições**: Processo simplificado para participantes
- **💳 Pagamentos**: Integração com Stripe para processamento seguro
- **🌍 Internacionalização**: Suporte para português (PT-BR) e francês (FR-CH)
- **📊 Dashboard Admin**: Painel administrativo com métricas e gestão de taxas
- **🎯 Sistema de Stands**: Gerenciamento de espaços para feiras e eventos
- **🎁 Sistema de Sorteios**: Funcionalidade para sorteios e prêmios
- **📱 PWA**: Aplicação web progressiva com funcionalidades offline

## 🚀 Tecnologias

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Pagamentos**: Stripe
- **Internacionalização**: i18next
- **Roteamento**: React Router DOM
- **Animações**: Framer Motion

## 📦 Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/event-connect.git
   cd event-connect
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   ```
   
   Edite o arquivo `.env.local` com suas configurações:
   ```env
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   VITE_STRIPE_PUBLISHABLE_KEY=sua_chave_stripe
   ```

4. **Execute o projeto**
   ```bash
   npm run dev
   ```

## 🏗️ Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção localmente

## 🌐 Deploy

### GitHub Pages

1. **Faça o build do projeto**
   ```bash
   npm run build
   ```

2. **Configure o GitHub Actions** (opcional)
   - Crie um workflow em `.github/workflows/deploy.yml`
   - Configure para fazer deploy automático

3. **Deploy manual**
   ```bash
   git add .
   git commit -m "Deploy: versão X.X.X"
   git push origin main
   ```

### Vercel/Netlify

1. **Conecte seu repositório** ao serviço de deploy
2. **Configure as variáveis de ambiente**
3. **Deploy automático** a cada push para main

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── admin/          # Componentes administrativos
│   ├── auth/           # Componentes de autenticação
│   ├── common/         # Componentes compartilhados
│   ├── organizer/      # Componentes do organizador
│   └── participant/    # Componentes do participante
├── contexts/           # Contextos React
├── hooks/              # Hooks customizados
├── pages/              # Páginas da aplicação
├── services/           # Serviços e APIs
├── translations/        # Arquivos de tradução
└── utils/              # Utilitários
```

## 🔧 Configuração do Banco

O projeto utiliza Supabase como backend. Execute os scripts SQL na seguinte ordem:

1. `database_organizer_taxa.sql` - Sistema de taxas
2. `database_platform_fees.sql` - Taxas da plataforma
3. `database_raffles.sql` - Sistema de sorteios
4. `admin_dashboard_rpc_fixed.sql` - Funções RPC do dashboard

## 🌍 Internacionalização

O projeto suporta múltiplos idiomas através do i18next:

- **Português (PT-BR)**: `src/translations/pt-BR.json`
- **Francês (FR-CH)**: `src/translations/fr-CH.json`

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através de:
- **Email**: suporte@eventconnect.com
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/event-connect/issues)

---

**Desenvolvido com ❤️ pela equipe Event Connect**
