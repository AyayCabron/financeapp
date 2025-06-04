💰 Gerenciador Financeiro Pessoal
Este projeto é um sistema completo para gerenciamento de finanças pessoais, desenvolvido com um frontend em React e um backend em Flask, utilizando PostgreSQL como banco de dados. Ele permite aos usuários registrar transações, gerenciar contas e categorias, visualizar relatórios e importar/exportar dados.

👨‍💻 Autor
Vinicius Silva

🚀 Visão Geral do Projeto
O Gerenciador Financeiro Pessoal foi criado para ajudar indivíduos a controlar suas receitas e despesas de forma eficiente. Com uma interface intuitiva, o usuário pode cadastrar transações, organizar suas contas bancárias e categorias de gastos, e ter uma visão clara de sua saúde financeira através de planilhas e gráficos. A aplicação suporta autenticação de usuários, garantindo que os dados financeiros sejam privados e seguros.

Funcionalidades Principais:
Autenticação de Usuários: Login e registro seguros.

Gestão de Contas: Crie e gerencie diferentes contas (corrente, poupança, investimento, cartão de crédito, dinheiro físico) com saldos atualizados.

Gestão de Categorias: Defina categorias personalizadas para receitas e despesas.

Gestão de Transações: Registre receitas e despesas com detalhes como valor, descrição, data, tipo, conta e categoria.

Planilhas Interativas: Visualize e edite transações em uma interface de planilha, com filtros e busca.

Importação de Dados: Importe transações via arquivo CSV, facilitando a migração de dados de outras fontes.

Exportação de Dados: Exporte todas as suas transações para um arquivo CSV para análise externa ou backup.

Download de Modelo de Importação: Baixe um modelo CSV para garantir o formato correto na importação.

Dashboard Personalizável: (Mencionado no models.py) Um layout de dashboard flexível para exibir informações financeiras importantes.

Modo Claro/Escuro: Alternância de tema para melhor experiência visual.

🛠️ Tecnologias Utilizadas
Frontend (React)
React: Biblioteca JavaScript para construção de interfaces de usuário.

Material-UI (MUI): Biblioteca de componentes React para um design elegante e responsivo.

React Router DOM: Para navegação e roteamento na aplicação.

Axios: Cliente HTTP para fazer requisições ao backend.

PapaParse: Biblioteca para análise e manipulação de arquivos CSV diretamente no navegador.

Backend (Flask)
Flask: Microframework web em Python.

Flask-JWT-Extended: Para autenticação baseada em JSON Web Tokens (JWT).

SQLAlchemy: ORM (Object Relational Mapper) para interagir com o banco de dados.

Psycopg2: Adaptador PostgreSQL para Python.

Pandas: Biblioteca para manipulação e análise de dados, utilizada para processamento de CSV na importação/exportação.

Gunicorn: Servidor WSGI para produção (usado em ambientes de deploy como Render).

Banco de Dados
PostgreSQL: Sistema de gerenciamento de banco de dados relacional robusto.

⚙️ Configuração do Ambiente (Desenvolvimento Local)
Siga estas instruções para configurar e rodar o projeto em sua máquina local.

Pré-requisitos
Python 3.8+

Node.js e npm (ou Yarn)

PostgreSQL instalado e rodando

1. Configuração do Banco de Dados PostgreSQL
Crie um novo banco de dados PostgreSQL para o projeto. Por exemplo: personal_finance_db.

CREATE DATABASE personal_finance_db;

Crie um usuário para o banco de dados (opcional, mas recomendado para segurança).

CREATE USER finance_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE personal_finance_db TO finance_user;

Atualize as credenciais do banco de dados no seu backend. Você precisará de um arquivo de configuração ou variáveis de ambiente. Exemplo de URL de conexão (para DATABASE_URL):
postgresql://finance_user:your_password@localhost:5432/personal_finance_db

2. Configuração do Backend (API Flask)
Clone o repositório do seu projeto (se ainda não o fez).

git clone <URL_DO_SEU_REPOSITORIO>
cd personal_finance_api

Crie e ative um ambiente virtual Python:

python -m venv .venv
# No Windows:
.venv\Scripts\activate
# No macOS/Linux:
source .venv/bin/activate

Instale as dependências do Python:

pip install -r requirements.txt
# Certifique-se de que requirements.txt inclui:
# Flask
# Flask-JWT-Extended
# SQLAlchemy
# psycopg2-binary
# pandas
# gunicorn (para deploy, mas bom ter para consistência)
# python-dotenv (se você usa .env para variáveis de ambiente)

Crie as tabelas do banco de dados:
Certifique-se de que você tem um script para criar as tabelas (ex: create_tables.py no diretório database ou na raiz do projeto). Execute-o:

python database/create_tables.py # Ou o caminho correto para seu script

Importante: Se você alterou o nome da coluna saldo para saldo_atual na tabela contas, você precisará garantir que seu banco de dados reflita essa mudança. Se for um ambiente de desenvolvimento, a forma mais fácil é dropar e recriar as tabelas. Para produção, use ferramentas de migração como Alembic.

Configure as variáveis de ambiente para o Flask. Crie um arquivo .env na raiz do diretório personal_finance_api (se você usa python-dotenv) com o seguinte:

DATABASE_URL="postgresql://finance_user:your_password@localhost:5432/personal_finance_db"
JWT_SECRET_KEY="sua_chave_secreta_jwt_muito_segura"
FLASK_APP=main.py # Ou o nome do seu arquivo principal Flask
FLASK_ENV=development

Inicie o servidor Flask:

flask run
# Ou se você usa gunicorn para teste local:
# gunicorn main:app -b 127.0.0.1:5000

O backend estará rodando em http://127.0.0.1:5000 (ou a porta configurada).

3. Configuração do Frontend (React)
Navegue até o diretório do frontend:

cd ../ # Se você estava no diretório do backend, volte para a raiz do projeto
cd frontend # Ou o nome do seu diretório frontend

Instale as dependências do Node.js:

npm install
# ou
yarn install

Adicione a biblioteca PapaParse ao seu public/index.html (dentro da tag <head>):

<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js"></script>

Configure a URL da API do backend. Crie um arquivo .env na raiz do diretório do seu frontend com:

REACT_APP_API_URL=http://localhost:5000

Importante: Certifique-se de que seu arquivo src/api/axios.js (ou similar) esteja configurado para usar esta variável de ambiente para a baseURL e para incluir o token JWT nas requisições:

// Exemplo de src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // Usa a variável de ambiente
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Ou de onde você armazena o token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

Inicie o servidor de desenvolvimento React:

npm start
# ou
yarn start

O frontend estará rodando em http://localhost:3000 (ou outra porta disponível).

🚀 Como Usar
Acesse o Frontend: Abra seu navegador e vá para http://localhost:3000.

Registro/Login: Se for seu primeiro acesso, registre uma nova conta. Caso contrário, faça login com suas credenciais.

Gerencie Contas e Categorias: Antes de adicionar transações, é recomendado cadastrar suas contas (ex: "Conta Corrente", "Poupança") e categorias (ex: "Salário", "Alimentação", "Transporte").

Adicione Transações: Utilize os formulários para registrar suas receitas e despesas.

Explore as Planilhas: Na seção de planilhas, você pode visualizar, editar, filtrar e buscar suas transações.

Importar/Exportar: Use os botões de importação e exportação para gerenciar seus dados via CSV. Baixe o modelo de importação para garantir o formato correto.

🌐 Endpoints da API (Backend)
Todos os endpoints abaixo exigem autenticação JWT (cabeçalho Authorization: Bearer <token>) exceto /auth/register e /auth/login.

Autenticação
POST /auth/register - Registra um novo usuário.

POST /auth/login - Autentica um usuário e retorna um JWT.

Usuários
GET /users/me - Retorna informações do usuário autenticado.

PUT /users/me/dashboard-layout - Atualiza a ordem do layout do dashboard do usuário.

Contas
POST /accounts - Cria uma nova conta.

GET /accounts - Lista todas as contas do usuário.

GET /accounts/<int:account_id> - Retorna uma conta específica.

PUT /accounts/<int:account_id> - Atualiza uma conta existente.

DELETE /accounts/<int:account_id> - Exclui uma conta.

Categorias
POST /categories - Cria uma nova categoria.

GET /categories - Lista todas as categorias do usuário.

GET /categories/<int:category_id> - Retorna uma categoria específica.

PUT /categories/<int:category_id> - Atualiza uma categoria existente.

DELETE /categories/<int:category_id> - Exclui uma categoria.

Transações
POST /transactions - Cria uma nova transação.

GET /transactions - Lista todas as transações do usuário.

GET /transactions/<int:transaction_id> - Retorna uma transação específica.

PUT /transactions/<int:transaction_id> - Atualiza uma transação existente.

DELETE /transactions/<int:transaction_id> - Exclui uma transação.

POST /transactions/import - Importa transações de um arquivo CSV.

GET /transactions/export - Exporta todas as transações para um arquivo CSV.

☁️ Deploy (Hospedagem em Nuvem)
Para disponibilizar o projeto online, você precisará implantar o frontend, o backend e o banco de dados separadamente.

Sugestões de Plataformas Gratuitas/Freemium:
Frontend (React):

Vercel: Ótimo para aplicações React, com integração contínua e CDN.

Netlify: Similar ao Vercel, também com deploy contínuo e CDN.

Backend (Flask) & Banco de Dados (PostgreSQL):

Render: Oferece planos gratuitos para serviços web (Flask) e bancos de dados gerenciados (PostgreSQL). É uma excelente opção para projetos pequenos e médios, e uma alternativa moderna ao Heroku.

ElephantSQL: Para um serviço de PostgreSQL dedicado (plano "Tiny Turtle" gratuito com 20MB).

Passos Gerais para Deploy:
Prepare seu código para produção:

Certifique-se de que todas as dependências estão no requirements.txt (backend) e package.json (frontend).

Crie um Procfile na raiz do seu projeto Flask para o Gunicorn (ex: web: gunicorn main:app).

Configure variáveis de ambiente no seu provedor de nuvem (ex: DATABASE_URL, JWT_SECRET_KEY, REACT_APP_API_URL).

Ajuste as configurações de CORS no seu Flask para permitir requisições do domínio do seu frontend em produção.

Implante o Banco de Dados: Crie uma instância PostgreSQL no Render ou ElephantSQL e obtenha a URL de conexão.

Implante o Backend: Crie um serviço web no Render, conecte seu repositório Flask e configure as variáveis de ambiente (incluindo a DATABASE_URL do passo anterior).

Implante o Frontend: Crie um novo projeto no Vercel ou Netlify, conecte seu repositório React e configure a variável de ambiente REACT_APP_API_URL com a URL do seu backend implantado.

🤝 Contribuição
Contribuições são bem-vindas! Sinta-se à vontade para abrir issues para bugs ou sugestões, e enviar pull requests com melhorias.

📄 Licença
Este projeto é licenciado sob a Licença MIT.