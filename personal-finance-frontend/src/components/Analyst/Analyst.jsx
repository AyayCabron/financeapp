import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Ícones do Material UI
import DashboardIcon from '@mui/icons-material/Dashboard'; // Ícone para Dashboard
import AnalyticsIcon from '@mui/icons-material/Analytics'; // Ícone principal para Análise
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; // Ícone para tendências
import TrendingDownIcon from '@mui/icons-material/TrendingDown'; // Ícone para tendências
import CategoryIcon from '@mui/icons-material/Category'; // Ícone para categorias
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'; // Ícone para contas
import LightbulbIcon from '@mui/icons-material/Lightbulb'; // Ícone para sugestões
import SavingsIcon from '@mui/icons-material/Savings'; // Ícone para economia/metas

import { format, parseISO, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import api from '../../api/axios'; // Certifique-se de que o caminho está correto
import { useAuth } from '../../context/AuthContext'; // Importar o hook useAuth

const Analyst = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- Estados para os dados brutos ---
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [goals, setGoals] = useState([]);

  // --- Estados de Carregamento e Erro ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  // --- Estado para o Período de Análise ---
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const today = new Date();
    return format(today, 'yyyy-MM'); // Padrão: Mês atual (ex: '2023-10')
  });

  // --- Funções de Snackbar ---
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Formatter para moeda
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }), []);

  // --- Geração de Períodos Disponíveis para o Filtro ---
  const availablePeriods = useMemo(() => {
    const periods = new Set();
    const today = new Date();
    // Adiciona o mês atual e os 11 meses anteriores
    for (let i = 0; i < 12; i++) {
      const month = subMonths(today, i);
      periods.add(format(month, 'yyyy-MM'));
    }
    return Array.from(periods).sort((a, b) => b.localeCompare(a)); // Ordena do mais recente para o mais antigo
  }, []);

  // --- Funções de Busca de Dados no Backend ---
  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError("Usuário não autenticado. Redirecionando para o login.");
      showSnackbar("Sessão expirada. Redirecionando para login...", "error");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [transactionsRes, accountsRes, categoriesRes, goalsRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/accounts'),
        api.get('/categories'),
        api.get('/goals'),
      ]);

      setTransactions(transactionsRes.data);
      setAccounts(accountsRes.data);
      setCategories(categoriesRes.data);
      setGoals(goalsRes.data);
      showSnackbar("Dados financeiros carregados com sucesso!", "success");

    } catch (err) {
      console.error("Erro ao carregar dados financeiros:", err);
      if (err.response) {
        if (err.response.status === 401) {
          setError("Sessão expirada ou não autenticado. Por favor, faça login novamente.");
          showSnackbar("Sessão expirada. Redirecionando para login...", "error");
        } else {
          setError(`Erro ao carregar dados: ${err.response.data.message || err.response.statusText}`);
          showSnackbar(`Erro: ${err.response.data.message || 'Erro ao carregar dados.'}`, "error");
        }
      } else if (err.request) {
        setError("Erro de rede: Não foi possível conectar ao servidor.");
        showSnackbar("Erro de rede. Verifique sua conexão.", "error");
      } else {
        setError("Um erro inesperado ocorreu.");
        showSnackbar("Um erro inesperado ocorreu.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [showSnackbar, user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);

  // --- Funções de Análise de Dados (useMemo para otimização) ---

  // Filtra transações pelo período selecionado
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.data) return false;
      return format(parseISO(t.data), 'yyyy-MM') === selectedPeriod;
    });
  }, [transactions, selectedPeriod]);

  // Resumo de Receitas e Despesas para o período selecionado
  const periodSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach(t => {
      const value = parseFloat(t.valor);
      if (t.tipo === 'income') {
        totalIncome += value;
      } else {
        totalExpense += value;
      }
    });
    const netBalance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, netBalance };
  }, [filteredTransactions]);

  // Top Categorias de Gasto
  const topSpendingCategories = useMemo(() => {
    const categorySpending = {};
    filteredTransactions.forEach(t => {
      if (t.tipo === 'expense' && t.categoria_id) {
        const category = categories.find(cat => cat.id === t.categoria_id);
        if (category) {
          categorySpending[category.nome] = (categorySpending[category.nome] || 0) + parseFloat(t.valor);
        }
      }
    });

    return Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 categorias
  }, [filteredTransactions, categories]);

  // Contas com Maior Saída de Dinheiro (no período selecionado)
  const accountsWithHighestOutflow = useMemo(() => {
    const accountOutflow = {};
    filteredTransactions.forEach(t => {
      if (t.tipo === 'expense' && t.conta_id) {
        const account = accounts.find(acc => acc.id === t.conta_id);
        if (account) {
          accountOutflow[account.nome] = (accountOutflow[account.nome] || 0) + parseFloat(t.valor);
        }
      }
    });

    return Object.entries(accountOutflow)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3); // Top 3 contas
  }, [filteredTransactions, accounts]);

  // Sugestões Financeiras e Conquistas (baseado em dados gerais)
  const financialInsights = useMemo(() => {
    const insights = [];

    // Sugestão: Metas Atingidas
    const achievedGoals = goals.filter(goal => goal.atingido);
    if (achievedGoals.length > 0) {
      insights.push({
        type: 'success',
        message: `Parabéns! Você atingiu ${achievedGoals.length} meta(s) financeira(s). Continue assim!`,
        details: achievedGoals.map(g => g.titulo).join(', '),
      });
    }

    // Sugestão: Saldo Positivo Geral
    const totalCurrentBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.saldo || 0), 0);
    if (totalCurrentBalance > 0) {
      insights.push({
        type: 'info',
        message: `Seu saldo total atual é positivo: ${currencyFormatter.format(totalCurrentBalance)}. Ótimo trabalho!`,
      });
    } else if (totalCurrentBalance < 0) {
      insights.push({
        type: 'warning',
        message: `Seu saldo total atual é negativo: ${currencyFormatter.format(totalCurrentBalance)}. Considere revisar seus gastos.`,
      });
    }

    // Sugestão: Economia em categorias de alto gasto
    if (topSpendingCategories.length > 0) {
      const highestCategory = topSpendingCategories[0];
      insights.push({
        type: 'tip',
        message: `Sua maior área de gasto neste mês é "${highestCategory[0]}". Pequenas economias aqui podem fazer uma grande diferença!`,
        details: `Total gasto: ${currencyFormatter.format(highestCategory[1])}`,
      });
    }

    // Sugestão: Se não há metas, incentive a criar
    if (goals.length === 0) {
      insights.push({
        type: 'tip',
        message: "Definir metas financeiras pode te ajudar a alcançar seus objetivos. Que tal criar uma meta hoje?",
      });
    }

    // Sugestão: Se saldo líquido do período é positivo
    if (periodSummary.netBalance > 0) {
      insights.push({
        type: 'success',
        message: `Neste período, você teve um saldo líquido positivo de ${currencyFormatter.format(periodSummary.netBalance)}. Isso é um ótimo sinal!`,
      });
    } else if (periodSummary.netBalance < 0) {
      insights.push({
        type: 'warning',
        message: `Neste período, você teve um saldo líquido negativo de ${currencyFormatter.format(periodSummary.netBalance)}. Analise seus gastos para identificar oportunidades de melhoria.`,
      });
    }


    return insights;
  }, [goals, accounts, topSpendingCategories, periodSummary, currencyFormatter]);


  // --- Renderização Condicional ---
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">Carregando dados para análise...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>
        <Button onClick={fetchData} variant="contained" color="primary">Tentar Novamente</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          Análise Financeira Detalhada
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ bgcolor: theme.palette.grey[700], '&:hover': { bgcolor: theme.palette.grey[900] } }}
          >
            Voltar para o Dashboard
          </Button>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="period-select-label">Período</InputLabel>
            <Select
              labelId="period-select-label"
              id="period-select"
              value={selectedPeriod}
              label="Período"
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              {availablePeriods.map(period => (
                <MenuItem key={period} value={period}>
                  {format(parseISO(`${period}-01`), 'MMMM/yyyy', { locale: ptBR })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={3}>
          {/* Card: Resumo do Período */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', boxShadow: theme.shadows[3] }}>
              <Typography variant="h5" fontWeight="bold" color="primary.dark" gutterBottom>
                Resumo do Período
              </Typography>
              <List>
                <ListItem>
                  <ListItemAvatar><TrendingUpIcon sx={{ color: theme.palette.success.main }} /></ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body1">Receitas Totais:</Typography>}
                    secondary={<Typography variant="h6" fontWeight="bold">{currencyFormatter.format(periodSummary.totalIncome)}</Typography>}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemAvatar><TrendingDownIcon sx={{ color: theme.palette.error.main }} /></ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body1">Despesas Totais:</Typography>}
                    secondary={<Typography variant="h6" fontWeight="bold">{currencyFormatter.format(periodSummary.totalExpense)}</Typography>}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemAvatar><AnalyticsIcon sx={{ color: theme.palette.info.main }} /></ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body1">Saldo Líquido:</Typography>}
                    secondary={
                      <Typography variant="h6" fontWeight="bold" sx={{ color: periodSummary.netBalance >= 0 ? theme.palette.success.main : theme.palette.error.main }}>
                        {currencyFormatter.format(periodSummary.netBalance)}
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Card: Top Categorias de Gasto */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', boxShadow: theme.shadows[3] }}>
              <Typography variant="h5" fontWeight="bold" color="primary.dark" gutterBottom>
                Top 5 Categorias de Gasto
              </Typography>
              {topSpendingCategories.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhum gasto registrado neste período.
                </Typography>
              ) : (
                <List>
                  {topSpendingCategories.map(([categoryName, amount]) => (
                    <ListItem key={categoryName}>
                      <ListItemAvatar><CategoryIcon sx={{ color: theme.palette.secondary.main }} /></ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body1">{categoryName}</Typography>}
                        secondary={<Typography variant="body2" color="text.secondary">{currencyFormatter.format(amount)}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Card: Contas com Maior Saída de Dinheiro */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', boxShadow: theme.shadows[3] }}>
              <Typography variant="h5" fontWeight="bold" color="primary.dark" gutterBottom>
                Contas com Maior Saída (Período)
              </Typography>
              {accountsWithHighestOutflow.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma saída de dinheiro registrada neste período.
                </Typography>
              ) : (
                <List>
                  {accountsWithHighestOutflow.map(([accountName, amount]) => (
                    <ListItem key={accountName}>
                      <ListItemAvatar><AccountBalanceWalletIcon sx={{ color: theme.palette.warning.main }} /></ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body1">{accountName}</Typography>}
                        secondary={<Typography variant="body2" color="text.secondary">{currencyFormatter.format(amount)}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Card: Sugestões e Insights Financeiros */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', boxShadow: theme.shadows[3] }}>
              <Typography variant="h5" fontWeight="bold" color="primary.dark" gutterBottom>
                Sugestões e Insights
              </Typography>
              {financialInsights.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Continue registrando seus dados para obter insights personalizados!
                </Typography>
              ) : (
                <List>
                  {financialInsights.map((insight, index) => (
                    <ListItem key={index} alignItems="flex-start">
                      <ListItemAvatar>
                        {insight.type === 'success' && <SavingsIcon sx={{ color: theme.palette.success.main }} />}
                        {insight.type === 'info' && <LightbulbIcon sx={{ color: theme.palette.info.main }} />}
                        {insight.type === 'warning' && <TrendingDownIcon sx={{ color: theme.palette.warning.main }} />}
                        {insight.type === 'tip' && <LightbulbIcon sx={{ color: theme.palette.primary.main }} />}
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body1" fontWeight="bold">{insight.message}</Typography>}
                        secondary={insight.details && <Typography variant="body2" color="text.secondary">{insight.details}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Placeholder para Gráficos Futuros */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', boxShadow: theme.shadows[3], textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" color="primary.dark" gutterBottom>
                Visualizações Gráficas (Em Breve!)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aqui você poderá ver gráficos de barras para tendências de gastos, gráficos de pizza para distribuição de categorias, e muito mais!
              </Typography>
              <Box sx={{ mt: 2, height: 200, bgcolor: theme.palette.action.hover, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" color="text.disabled">Espaço para Gráficos</Typography>
              </Box>
            </Paper>
          </Grid>

        </Grid>
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Analyst;
