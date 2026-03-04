# processmap_case

## Backend (.NET + PostgreSQL)
- Configure a connection string no `appsettings.json`
- Rode migrations:
  - `dotnet ef database update`
- Rode a API:
  - `dotnet run`

Swagger: https://localhost:57242/swagger

## Frontend (React)
- `cd ProcessMap.Web`
- `npm install`
- `npm run dev`

Front: http://localhost:5173
               +--------------------+
               |      Usuário       |
               |  (Browser React)   |
               +---------+----------+
                         |
                         | HTTP / JSON
                         v
               +--------------------+
               |   Frontend React   |
               |  (ProcessMap.Web)  |
               +---------+----------+
                         |
                         | REST API
                         | Axios
                         v
              +----------------------+
              |  Backend .NET API    |
              |  ProcessMap.Api      |
              |  ASP.NET Core        |
              +----------+-----------+
                         |
                         | Entity Framework
                         v
               +--------------------+
               |   PostgreSQL DB    |
               |  processmap_case   |
               +--------------------+

Frontend

React + Vite

Consome API REST

Visualização hierárquica de processos

CRUD de áreas e processos

Backend

ASP.NET Core Web API

Padrão REST

Entity Framework Core

DTOs para comunicação

Banco

PostgreSQL

Estrutura hierárquica de processos usando self-reference

📊 2. Arquitetura de Dados
Areas
 ├── Id
 └── Nome

ProcessNodes
 ├── Id
 ├── AreaId
 ├── ParentId
 ├── Nome
 ├── Tipo
 ├── Status
 └── Importance

ProcessSystemTools
 ├── Id
 ├── ProcessNodeId
 └── Nome

Relacionamentos:

Area
  └── Processos

Processo
  └── Subprocessos (self reference)
🔁 3. Fluxo da aplicação
Usuário cria Área
      |
      v
Frontend React
      |
POST /api/areas
      |
      v
.NET API
      |
Entity Framework
      |
      v
PostgreSQL
🎨 4. Visualização da árvore de processos
Área: Pessoas

Recrutamento e Seleção
 ├ Definição de perfil da vaga
 ├ Divulgação da vaga
 ├ Triagem de currículos
 ├ Entrevistas
 └ Oferta de contratação

Avaliação de Performance
 ├ Definição de critérios
 ├ Avaliação trimestral
 └ Feedback

Desligamento
 ├ Notificação formal
 ├ Processamento de rescisão
 └ Devolução de equipamentos
