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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Ícone para conquistas
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Ícone para metas atingidas
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'; // Ícone para saldo
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; // Ícone para transações/dinheiro
import DashboardIcon from '@mui/icons-material/Dashboard'; // Ícone para Dashboard

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import api from '../../api/axios'; // Certifique-se de que o caminho está correto
import { useAuth } from '../../context/AuthContext'; // Importar o hook useAuth

const Achievements = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [achievementsData, setAchievementsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

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

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }), []);

  const fetchAchievementsData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError("Usuário não autenticado. Redirecionando para o login.");
      showSnackbar("Sessão expirada. Redirecionando para login...", "error");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [transactionsRes, accountsRes, goalsRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/accounts'),
        api.get('/goals'),
      ]);

      const transactions = transactionsRes.data;
      const accounts = accountsRes.data;
      const goals = goalsRes.data;

      // 1. Saldo Positivo no Fim do Mês (últimos 3 meses)
      const monthlyBalances = {}; // { 'YYYY-MM': { income: X, expense: Y, net: Z } }
      transactions.forEach(t => {
        const date = new Date(t.data);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!monthlyBalances[yearMonth]) {
          monthlyBalances[yearMonth] = { income: 0, expense: 0, net: 0 };
        }
        if (t.tipo === 'income') {
          monthlyBalances[yearMonth].income += parseFloat(t.valor);
        } else {
          monthlyBalances[yearMonth].expense += parseFloat(t.valor);
        }
        monthlyBalances[yearMonth].net = monthlyBalances[yearMonth].income - monthlyBalances[yearMonth].expense;
      });

      const sortedMonths = Object.keys(monthlyBalances).sort().reverse(); // Mais recente primeiro
      const recentPositiveMonths = sortedMonths.slice(0, 3).filter(month => monthlyBalances[month].net > 0);

      // 2. Metas Atingidas
      const achievedGoals = goals.filter(goal => goal.atingido);

      // 3. Contas com Saldo Positivo
      const positiveAccounts = accounts.filter(account => parseFloat(account.saldo) > 0);

      setAchievementsData({
        recentPositiveMonths,
        monthlyBalances, // Para exibir o valor líquido
        achievedGoals,
        positiveAccounts,
      });
      showSnackbar("Conquistas carregadas com sucesso!", "success");

    } catch (err) {
      console.error("Erro ao carregar conquistas:", err);
      if (err.response) {
        if (err.response.status === 401) {
          setError("Sessão expirada ou não autenticado. Por favor, faça login novamente.");
          showSnackbar("Sessão expirada. Redirecionando para login...", "error");
        } else {
          setError(`Erro ao carregar conquistas: ${err.response.data.message || err.response.statusText}`);
          showSnackbar(`Erro: ${err.response.data.message || 'Erro ao carregar conquistas.'}`, "error");
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
      fetchAchievementsData();
    }
  }, [fetchAchievementsData, user]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">Carregando suas conquistas financeiras...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>
        <Button onClick={fetchAchievementsData} variant="contained" color="primary">Tentar Novamente</Button>
      </Container>
    );
  }

  const hasAchievements = achievementsData && (
    achievementsData.recentPositiveMonths.length > 0 ||
    achievementsData.achievedGoals.length > 0 ||
    achievementsData.positiveAccounts.length > 0
  );

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          Minhas Conquistas Financeiras
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ bgcolor: theme.palette.grey[700], '&:hover': { bgcolor: theme.palette.grey[900] } }}
          >
            Voltar para o Dashboard
          </Button>
        </Box>

        {!hasAchievements && (
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: '12px' }}>
            <Typography variant="h6" color="text.secondary">
              Ainda não há conquistas para exibir. Continue gerenciando suas finanças!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Tente registrar mais transações, definir e atingir metas.
            </Typography>
          </Paper>
        )}

        {achievementsData && achievementsData.recentPositiveMonths.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
            <Typography variant="h5" fontWeight="bold" color="primary.dark" gutterBottom>
              Saldos Positivos no Mês
            </Typography>
            <List>
              {achievementsData.recentPositiveMonths.map((monthYear) => (
                <ListItem key={monthYear}>
                  <ListItemAvatar>
                    <AttachMoneyIcon sx={{ color: theme.palette.success.main }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight="bold">
                        Parabéns! Você fechou {format(parseISO(`${monthYear}-01`), 'MMMM/yyyy', { locale: ptBR })} com saldo positivo!
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Saldo Líquido: {currencyFormatter.format(achievementsData.monthlyBalances[monthYear].net)}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {achievementsData && achievementsData.achievedGoals.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
            <Typography variant="h5" fontWeight="bold" color="primary.dark" gutterBottom>
              Metas Atingidas!
            </Typography>
            <List>
              {achievementsData.achievedGoals.map((goal) => (
                <ListItem key={goal.id}>
                  <ListItemAvatar>
                    <CheckCircleOutlineIcon sx={{ color: theme.palette.success.main }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight="bold">
                        Excelente! Você atingiu sua meta: "{goal.titulo}"
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Valor Necessário: {currencyFormatter.format(goal.valor_necessario)}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {achievementsData && achievementsData.positiveAccounts.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
            <Typography variant="h5" fontWeight="bold" color="primary.dark" gutterBottom>
              Contas com Saldo Positivo
            </Typography>
            <List>
              {achievementsData.positiveAccounts.map((account) => (
                <ListItem key={account.id}>
                  <ListItemAvatar>
                    <AccountBalanceWalletIcon sx={{ color: theme.palette.info.main }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight="bold">
                        Sua conta "{account.nome}" está com saldo positivo!
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Saldo Atual: {currencyFormatter.format(account.saldo)}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Achievements;
