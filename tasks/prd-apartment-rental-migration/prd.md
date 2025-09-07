# Documento de Requisitos de Produto (PRD)
## Migração para Stack Moderno - Sistema de Gerenciamento de Aluguel de Apartamentos

## Visão Geral

Este PRD define a migração completa do sistema de gerenciamento de aluguel de apartamentos do atual stack (Django + SQLite3 + templates HTML) para uma arquitetura moderna baseada em ReactJS + Tailwind CSS + PostgreSQL + Docker. O objetivo é modernizar a tecnologia mantendo toda a funcionalidade existente, garantindo melhor performance, escalabilidade e experiência de usuário através de interfaces responsivas e acessíveis.

## Objetivos

### Métricas de Sucesso:
- **Preservação de dados**: 100% dos dados atuais migrados sem perdas
- **Paridade funcional**: Todas as funcionalidades existentes mantidas
- **Performance**: Melhoria de pelo menos 30% no tempo de carregamento de páginas
- **Responsividade**: 100% dos componentes funcionais em dispositivos móveis
- **Acessibilidade**: Conformidade com WCAG 2.1 AA
- **Containerização**: Sistema 100% dockerizado e deployável via Docker Compose

### Objetivos de Negócio:
- Modernizar stack tecnológico para facilitar manutenção futura
- Melhorar experiência do usuário com interfaces modernas e responsivas
- Estabelecer base sólida para expansão futura do sistema
- Reduzir tempo de desenvolvimento de novas funcionalidades

## Histórias de Usuário

### Administrador do Sistema
- Como administrador, quero acessar o painel admin Django modernizado para que possa gerenciar apartamentos e construtoras com interface mais intuitiva
- Como administrador, quero fazer upload de fotos e vídeos com previews imediatos para que possa visualizar o conteúdo antes de salvar
- Como administrador, quero que o sistema funcione igual ao atual para que não precise reaprender processos

### Usuário Final (Visitante do Site)
- Como visitante, quero navegar pela lista de apartamentos com interface moderna e responsiva para que possa visualizar propriedades em qualquer dispositivo
- Como visitante, quero alternar entre modo claro e escuro para que possa usar o sistema confortavelmente em diferentes ambientes
- Como visitante com deficiência visual, quero que o site seja totalmente acessível via leitor de tela para que possa navegar independentemente

### Desenvolvedor/DevOps
- Como desenvolvedor, quero ambiente totalmente containerizado para que possa fazer deploy consistent em qualquer ambiente
- Como desenvolvedor, quero separação clara entre frontend e backend para que possa trabalhar independentemente em cada camada

## Funcionalidades Principais

### F1. Frontend ReactJS com Tailwind CSS
**O que faz**: Substitui templates Django por aplicação React moderna com Tailwind CSS
**Por que é importante**: Melhora UX, performance e facilita manutenção
**Como funciona**: SPA React consumindo APIs Django via REST

**Requisitos funcionais:**
1. Implementar todas as páginas atuais (`/aptos/`, `/builders/`) em React
2. Manter roteamento equivalente ao atual
3. Implementar componentes reutilizáveis para listagens e cards
4. Garantir responsividade em todos os breakpoints (mobile-first)
5. Implementar modo escuro/claro persistente
6. Assegurar conformidade WCAG 2.1 AA

### F2. Migração de Banco de Dados SQLite → PostgreSQL
**O que faz**: Migra todos os dados para PostgreSQL mantendo integridade referencial
**Por que é importante**: Melhora performance, escalabilidade e confiabilidade
**Como funciona**: Script de migração automatizada com validação de dados

**Requisitos funcionais:**
7. Preservar 100% dos dados existentes (Builders, Aptos, Fotos, BuilderFoto)
8. Manter todas as relações foreign key
9. Preservar estrutura de diretórios de media files
10. Validar integridade pós-migração
11. Configurar PostgreSQL otimizado para workload da aplicação

### F3. Manutenção da API Backend Django
**O que faz**: Mantém backend Django atual com adaptações para consumo via API REST
**Por que é importante**: Preserva lógica de negócio e minimiza riscos
**Como funciona**: Django REST Framework servindo dados para frontend React

**Requisitos funcionais:**
12. Manter todos os models existentes (Builders, Aptos, Foto, BuilderFoto)
13. Implementar serializers para API REST
14. Manter admin interface Django funcional
15. Configurar CORS para comunicação frontend/backend
16. Implementar upload de arquivos via API

### F4. Containerização Completa com Docker
**O que faz**: Dockeriza toda a aplicação com Docker Compose
**Por que é importante**: Facilita deploy, desenvolvimento e manutenção
**Como funciona**: Containers separados para frontend, backend, banco e nginx

**Requisitos funcionais:**
17. Container React para frontend com build production
18. Container Django para backend API
19. Container PostgreSQL com configuração otimizada
20. Container Nginx para proxy reverso e arquivos estáticos
21. Docker Compose orquestrando todos os serviços
22. Volumes persistentes para dados e media files

## Experiência do Usuário

### Personas Principais:
- **Admin**: Gerencia conteúdo via Django admin
- **Visitante**: Navega propriedades no site público

### Fluxos Principais:
1. **Listagem de Apartamentos**: Grade responsiva com filtros e busca
2. **Detalhes do Apartamento**: Modal/página com galeria de imagens/vídeos
3. **Listagem de Construtoras**: Cards com informações e media
4. **Navegação Mobile**: Menu hamburger, touch-friendly

### Requisitos UX:
- Design system consistente baseado em Tailwind
- Transições suaves e feedback visual
- Loading states para operações assíncronas
- Modo escuro/claro com preferência do sistema
- Navegação acessível via teclado
- Textos alternativos para todas as imagens
- Contraste adequado (WCAG AA)
- Suporte a leitores de tela

## Restrições Técnicas de Alto Nível

### Preservação de Dados
- **CRÍTICO**: Zero perda de dados durante migração
- Backup completo antes de qualquer migração
- Processo de rollback documentado

### Integrações e Sistemas
- Manter compatibilidade com Django Admin existente
- Preservar URLs atuais para SEO (redirects se necessário)
- Manter estrutura de media files existente

### Performance e Escalabilidade
- Tempo de carregamento inicial < 3 segundos
- API responses < 500ms (95th percentile)
- Suporte para até 1000 apartamentos simultâneos

### Segurança e Compliance
- HTTPS obrigatório em produção
- Headers de segurança implementados
- Validação de uploads de arquivos
- Backup automatizado do banco PostgreSQL

### Requisitos de Tecnologia
- Node.js 18+ para ambiente React
- Python 3.11+ para Django
- PostgreSQL 15+
- Docker & Docker Compose
- Nginx como proxy reverso

## Não-Objetivos (Fora de Escopo)

### Funcionalidades Explicitamente Excluídas:
- Novas funcionalidades de negócio (apenas migração)
- Sistema de autenticação/login público
- API pública externa
- Integração com sistemas de pagamento
- Sistema de reservas/agendamento
- Otimizações SEO avançadas (além de manter URLs)
- Funcionalidades de chat/mensagens
- Sistema de avaliações/reviews
- Integração com redes sociais

### Considerações Futuras:
- Implementação de PWA
- Sistema de notificações
- Analytics avançado
- Funcionalidades de CRM
- Integração com WhatsApp/Telegram

### Limitações:
- Migração será feita em ambiente único (não multi-tenant)
- Media files permanecerão em filesystem local (não cloud storage)
- Sem otimização para SEO beyond URL preservation

## Questões em Aberto

### Requisitos Técnicos:
- **Q1**: Definir estratégia exata de build/deploy do frontend React
  - Build estático servido pelo Nginx ou SSR?
- **Q2**: Configurações específicas de performance do PostgreSQL
  - Quais índices adicionais criar além dos Django padrão?
- **Q3**: Estrutura exata de containers Docker
  - Development vs Production environments

### UX/Design:
- **Q4**: Design system específico - cores, tipografia, espaciamento
  - Usar tema Tailwind customizado ou padrão?
- **Q5**: Comportamento específico de modais e navegação
  - SPA total ou navegação mista?

### Dados e Migração:
- **Q6**: Estratégia de migration em produção
  - Downtime aceitável? Migração blue-green?
- **Q7**: Validação pós-migração
  - Quais testes específicos executar?

### Testes:
- **Q8**: Cobertura de testes requerida
  - Unit, integration, e2e com Playwright?
- **Q9**: Ambiente de staging
  - Replica de produção necessária?