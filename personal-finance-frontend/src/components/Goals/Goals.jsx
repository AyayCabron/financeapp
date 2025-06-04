import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Container,
  Grid,
  useTheme,
  Paper,
  LinearProgress, // Para a barra de progresso da meta
  InputAdornment, // Para o R$ nos campos de valor
  Switch, // Já estava aqui, mas é bom verificar
  FormControlLabel, // <--- ADICIONADO: Importação do FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Ícone para metas
import DashboardIcon from '@mui/icons-material/Dashboard'; // Ícone para Dashboard
import { useNavigate } from 'react-router-dom';

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import api from '../../api/axios'; // Certifique-se de que o caminho está correto
import { useAuth } from '../../context/AuthContext'; // Importar o hook useAuth

const Goals = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth(); // Obter o objeto user do contexto de autenticação

  // Adicionado para depuração: Verifique o objeto 'user'
  useEffect(() => {
    console.log("Goals Component - User object:", user);
  }, [user]);

  // --- Estados para os dados ---
  const [goals, setGoals] = useState([]);

  // --- Estados para Modal e Formulário ---
  const [openGoalModal, setOpenGoalModal] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);

  // --- Estados do Formulário de Meta ---
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorNecessario, setValorNecessario] = useState('');
  const [valorReservado, setValorReservado] = useState('');
  const [contaDestino, setContaDestino] = useState('');
  const [dataMeta, setDataMeta] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [atingido, setAtingido] = useState(false);

  // --- Estados de Feedback e Carregamento ---
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  // Formatter para moeda
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }), []);

  // --- Funções de Snackbar ---
  const showSnackbar = useCallback((message, severity) => {
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

  // --- Funções de Abertura/Fechamento de Modal ---
  const handleOpenGoalModal = useCallback((goal = null) => {
    setCurrentGoal(goal);
    if (goal) {
      setTitulo(goal.titulo || '');
      setDescricao(goal.descricao || '');
      setValorNecessario(String(goal.valor_necessario || '').replace('.', ','));
      setValorReservado(String(goal.valor_reservado || '').replace('.', ','));
      setContaDestino(goal.conta_destino || '');
      setDataMeta(goal.data_meta ? format(parseISO(goal.data_meta), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
      setAtingido(goal.atingido || false);
    } else {
      setTitulo('');
      setDescricao('');
      setValorNecessario('');
      setValorReservado('');
      setContaDestino('');
      setDataMeta(format(new Date(), 'yyyy-MM-dd'));
      setAtingido(false);
    }
    setOpenGoalModal(true);
  }, []);

  const handleCloseGoalModal = useCallback(() => {
    setOpenGoalModal(false);
    setCurrentGoal(null);
  }, []);

  // --- Funções de Manipulação de Dados (Chamadas de API) ---

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/goals');
      setGoals(response.data);
      showSnackbar("Metas carregadas com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao carregar metas:", err);
      if (err.response) {
        if (err.response.status === 401) {
          setError("Sessão expirada ou não autenticado. Por favor, faça login novamente.");
          showSnackbar("Sessão expirada. Redirecionando para login...", "error");
          // navigate('/login'); // O ProtectedRoute deve lidar com isso
        } else {
          setError(`Erro ao carregar metas: ${err.response.data.message || err.response.statusText}`);
          showSnackbar(`Erro: ${err.response.data.message || 'Erro ao carregar metas.'}`, "error");
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
  }, [showSnackbar]);

  useEffect(() => {
    // Chamar fetchGoals apenas quando o objeto 'user' estiver disponível e não for null
    if (user) {
      fetchGoals();
    } else {
      // Se user for null (e não estiver carregando), significa que o ProtectedRoute
      // já deve ter redirecionado ou está prestes a fazê-lo.
      // Definimos loading como false para evitar um spinner infinito.
      setLoading(false);
    }
  }, [fetchGoals, user]); // 'user' é a dependência principal aqui

  const handleSubmitGoal = useCallback(async () => {
    setSubmitting(true);
    try {
      const goalData = {
        titulo: titulo,
        descricao: descricao,
        valor_necessario: parseFloat(valorNecessario.replace(',', '.')),
        valor_reservado: parseFloat(valorReservado.replace(',', '.')),
        conta_destino: contaDestino,
        data_meta: dataMeta,
        atingido: atingido,
      };

      if (currentGoal) {
        await api.put(`/goals/${currentGoal.id}`, goalData);
        showSnackbar('Meta atualizada com sucesso!', 'success');
      } else {
        await api.post('/goals', goalData);
        showSnackbar('Meta adicionada com sucesso!', 'success');
      }
      handleCloseGoalModal();
      fetchGoals();
    } catch (error) {
      console.error("Erro ao salvar meta:", error.response?.data || error.message);
      showSnackbar(`Erro ao salvar meta: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [titulo, descricao, valorNecessario, valorReservado, contaDestino, dataMeta, atingido, currentGoal, handleCloseGoalModal, fetchGoals, showSnackbar]);

  const handleDeleteGoal = useCallback(async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta meta?")) {
      try {
        await api.delete(`/goals/${id}`);
        showSnackbar('Meta excluída com sucesso!', 'success');
        fetchGoals();
      } catch (error) {
        console.error("Erro ao excluir meta:", error.response?.data || error.message);
        showSnackbar(`Erro ao excluir meta: ${error.response?.data?.message || error.message}`, 'error');
      }
    }
  }, [fetchGoals, showSnackbar]);

  // --- Renderização Condicional ---
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">Carregando Metas Financeiras...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>
        <Button onClick={fetchGoals} variant="contained" color="primary">Tentar Novamente</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          Minhas Metas Financeiras
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')} // Navega para /dashboard
            sx={{ bgcolor: theme.palette.grey[700], '&:hover': { bgcolor: theme.palette.grey[900] } }}
          >
            Voltar para o Dashboard
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenGoalModal()}
            color="primary"
          >
            Nova Meta
          </Button>
        </Box>

        {goals.length === 0 ? (
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: '12px' }}>
            <Typography variant="h6" color="text.secondary">
              Nenhuma meta financeira cadastrada. Comece a planejar seus objetivos!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenGoalModal()}
              sx={{ mt: 2 }}
            >
              Adicionar Primeira Meta
            </Button>
          </Paper>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '12px', boxShadow: theme.shadows[3] }}>
            {goals.map((goal) => {
              const progress = goal.valor_necessario > 0
                ? (parseFloat(goal.valor_reservado) / parseFloat(goal.valor_necessario)) * 100
                : 0;
              const isComplete = progress >= 100;

              return (
                <Paper key={goal.id} elevation={2} sx={{ mb: 2, mx: 2, borderRadius: '8px', overflow: 'hidden' }}>
                  <ListItem
                    secondaryAction={
                      <Box>
                        <IconButton edge="end" aria-label="editar" onClick={() => handleOpenGoalModal(goal)}>
                          <EditIcon sx={{ color: theme.palette.text.secondary }} />
                        </IconButton>
                        <IconButton edge="end" aria-label="excluir" onClick={() => handleDeleteGoal(goal.id)}>
                          <DeleteIcon sx={{ color: theme.palette.error.main }} />
                        </IconButton>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start', py: 2 }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark }}>
                          {goal.titulo}
                          {isComplete && (
                            <CheckCircleOutlineIcon color="success" sx={{ ml: 1, verticalAlign: 'middle' }} />
                          )}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {goal.descricao}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Valor Necessário: {currencyFormatter.format(goal.valor_necessario)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Valor Reservado: {currencyFormatter.format(goal.valor_reservado)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Conta Destino: {goal.conta_destino || 'Não especificada'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Data Meta: {goal.data_meta ? format(parseISO(goal.data_meta), 'dd/MM/yyyy', { locale: ptBR }) : 'Não definida'}
                          </Typography>
                          <Box sx={{ width: '100%', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">{`${progress.toFixed(2)}% Concluído`}</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={progress > 100 ? 100 : progress}
                              sx={{
                                height: 8,
                                borderRadius: 5,
                                bgcolor: theme.palette.grey[300],
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: isComplete ? theme.palette.success.main : theme.palette.info.main,
                                },
                              }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </Paper>
              );
            })}
          </List>
        )}
      </Box>

      {/* --- Modal de Adição/Edição de Meta --- */}
      <Dialog open={openGoalModal} onClose={handleCloseGoalModal} PaperProps={{
        sx: {
          borderRadius: '12px',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
          width: { xs: '95%', sm: '500px' },
          maxWidth: 'unset',
          p: { xs: 1, sm: 2 },
        },
      }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Typography variant="h5" component="span" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
            {currentGoal ? 'Editar Meta Financeira' : 'Adicionar Nova Meta Financeira'}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseGoalModal}
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderBottom: 'none', borderColor: theme.palette.divider }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Título da Meta"
                fullWidth
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                fullWidth
                multiline
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Valor Necessário"
                fullWidth
                value={valorNecessario}
                onChange={(e) => {
                  const value = e.target.value.replace('.', ',');
                  if (/^\d*([,]?\d{0,2})?$/.test(value)) {
                    setValorNecessario(value);
                  }
                }}
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  inputMode: 'decimal',
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Valor Reservado"
                fullWidth
                value={valorReservado}
                onChange={(e) => {
                  const value = e.target.value.replace('.', ',');
                  if (/^\d*([,]?\d{0,2})?$/.test(value)) {
                    setValorReservado(value);
                  }
                }}
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  inputMode: 'decimal',
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Conta Destino"
                fullWidth
                value={contaDestino}
                onChange={(e) => setContaDestino(e.target.value)}
                margin="normal"
                helperText="Ex: Poupança, Investimento, Nome da Conta"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data da Meta"
                type="date"
                fullWidth
                value={dataMeta}
                onChange={(e) => setDataMeta(e.target.value)}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={atingido}
                    onChange={(e) => setAtingido(e.target.checked)}
                    color="primary"
                  />
                }
                label="Meta Atingida"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseGoalModal} color="secondary" disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmitGoal} variant="contained" color="primary" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : (currentGoal ? 'Salvar Alterações' : 'Adicionar')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Goals;
