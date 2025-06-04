//src/components/FunctionGuide/FunctionGuide.jsx

import React from 'react';
import {
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Button,
  AppBar,
  Toolbar,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CategoryIcon from '@mui/icons-material/Category';
import GridOnIcon from '@mui/icons-material/GridOn';
import EventNoteIcon from '@mui/icons-material/EventNote';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CalculateIcon from '@mui/icons-material/Calculate';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const FunctionGuide = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 4 }}>
        <Toolbar>
          <Tooltip title="Voltar">
            <IconButton edge="start" color="primary" aria-label="voltar" onClick={handleGoBack} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main' }}>
            Guia de Funções
          </Typography>
        </Toolbar>
      </AppBar>
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: '8px' }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Bem-vindo ao Guia de Funções do seu aplicativo de Finanças Pessoais! Aqui você encontrará uma explicação detalhada de cada recurso, para que possa aproveitar ao máximo todas as ferramentas disponíveis.
        </Typography>
        <Typography variant="body1">
          Explore as seções abaixo para entender como cada funcionalidade pode te ajudar a gerenciar suas finanças de forma mais eficiente.
        </Typography>
      </Paper>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <AddCircleOutlineIcon color="primary" />
          </ListItemIcon>
          <Typography variant="h6" color="primary.main">Nova Transação</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Permite registrar todas as suas entradas (receitas) e saídas (despesas) de dinheiro. É o coração do controle financeiro. Você pode especificar a descrição, valor, data, conta associada e categoria.
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Campos: Descrição, Valor, Tipo (Receita/Despesa), Data, Conta, Categoria." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Funcionalidade: Atualiza o saldo da conta selecionada automaticamente." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <AccountBalanceWalletIcon color="primary" />
          </ListItemIcon>
          <Typography variant="h6" color="primary.main">Nova Conta</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Cadastre todas as suas contas financeiras: conta corrente, poupança, investimentos, carteira, etc. Cada conta terá seu próprio saldo e você poderá registrar transações específicas para elas.
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Campos: Nome da Conta, Saldo Inicial, Tipo (Ex: Corrente, Poupança, Dinheiro)." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Funcionalidade: Permite organizar suas finanças por diferentes fontes ou destinos de dinheiro." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <CategoryIcon color="primary" />
          </ListItemIcon>
          <Typography variant="h6" color="primary.main">Categorias</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Organize suas transações em categorias personalizadas (ex: Alimentação, Transporte, Salário, Aluguel). Isso é crucial para analisar onde seu dinheiro está sendo gasto ou de onde ele vem.
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Funcionalidade: Permite criar e gerenciar categorias para receitas e despesas." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Importância: Facilita a visualização de padrões de gastos e a criação de orçamentos." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <GridOnIcon color="primary" />
          </ListItemIcon>
          <Typography variant="h6" color="primary.main">Planilhas Financeiras</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Visualize e exporte seus dados financeiros em formato de planilha. Ideal para análises mais aprofundadas ou para compartilhar informações.
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Funcionalidade: Exportação de dados de transações, contas ou categorias." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Benefício: Facilita a integração com outras ferramentas ou para relatórios personalizados." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <EventNoteIcon color="primary" />
          </ListItemIcon>
          <Typography variant="h6" color="primary.main">Agenda Financeira</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Acompanhe compromissos financeiros futuros, como vencimento de contas, datas de recebimento de salário ou pagamentos de faturas. Nunca mais perca um prazo importante!
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Funcionalidade: Registro e visualização de eventos financeiros em um calendário." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Benefício: Ajuda no planejamento e evita juros por atraso." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <EmojiEventsIcon color="primary" />
          </ListItemIcon>
          <Typography variant="h6" color="primary.main">Metas e Objetivos</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Defina metas financeiras de curto, médio e longo prazo (ex: comprar um carro, fazer uma viagem, economizar para aposentadoria) e acompanhe seu progresso.
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Funcionalidade: Criação de metas com valores e prazos, e acompanhamento do saldo em relação à meta." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Benefício: Incentiva a economia e o foco em seus objetivos financeiros." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <ShoppingCartIcon color="primary" />
          </ListItemIcon>
          <Typography variant="h6" color="primary.main">Listas de Compras</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Crie e gerencie listas de compras para supermercado, casa, ou qualquer outra necessidade. Acompanhe itens, quantidades, preços estimados e reais, e marque como comprado.
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Funcionalidade: Criação de listas, adição/edição/exclusão de itens, marcação de item como comprado, cálculo de custos totais (estimado e real)." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Benefício: Ajuda a evitar compras por impulso e a controlar gastos específicos." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <CalculateIcon color="primary" />
          </ListItemIcon>
          <Typography variant="h6" color="primary.main">Calculadora Inteligente</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Uma ferramenta auxiliar para realizar cálculos financeiros rápidos, como juros compostos, parcelas de empréstimos, ou conversões de moeda.
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Funcionalidade: Diversos tipos de cálculos financeiros pré-programados." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Benefício: Agiliza decisões financeiras e simulações." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <AnalyticsIcon color="primary" />
          </ListItemIcon>
          <Typography variant="h6" color="primary.main">Analista Financeiro</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Receba insights e relatórios visuais sobre suas finanças. Gráficos de gastos por categoria, fluxo de caixa, evolução do saldo e muito mais para uma visão clara da sua saúde financeira.
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Funcionalidade: Geração de gráficos e relatórios automatizados baseados em suas transações." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Benefício: Identifica pontos de melhoria, tendências e ajuda na tomada de decisões estratégicas." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{ borderRadius: '8px' }}
        >
          Voltar
        </Button>
      </Box>

      <Snackbar open={false} autoHideDuration={6000}>
        <Alert severity="info" sx={{ width: '100%' }}>
          Ainda em desenvolvimento...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FunctionGuide;
