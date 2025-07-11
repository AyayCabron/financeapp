import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ColorModeContext } from '../main';
import { useNavigate } from 'react-router-dom';


import useQuickActionsLogic from '../hooks/useQuickActionsLogic';


import CategoryForm from './Categories/CategoryForm';
import AccountForm from './Accounts/AccountForm';
import TransactionForm from './Transactions/TransactionForm';


import AccountsListModal from './Accounts/AccountsListModal';
import TransactionsListModal from './Transactions/TransactionsListModal';
import CategoriesListModal from './Categories/CategoriesListModal';
import FinancialAgendaModal from './Financial/FinancialAgendaModal';
import FinancialAgenda from './Financial/FinancialAgenda';
import Goals from './Goals/Goals';
import Achievements from './Achievements/Achievements';
import Analyst from './Analyst/Analyst';

import QuickActionsCard from './Shared/QuickActionsCard';

import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  ListItemAvatar,
  Alert,
  Divider,
  Grid,
  Snackbar,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'; 
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'; 
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Tooltip } from '@mui/material';


function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { toggleColorMode } = useContext(ColorModeContext);
  const { logout, user } = useAuth();

  const handleGoToFunctionGuide = () => {
    navigate('/guide');
  };


  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 


  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);


  const [isTotalBalanceModalOpen, setIsTotalBalanceModalOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);

  const [isAccountsListModalOpen, setIsAccountsListModalOpen] = useState(false);
  const [isTransactionsListModalOpen, setIsTransactionsListModalOpen] = useState(false);
  const [isCategoriesListModalOpen, setIsCategoriesListModalOpen] = useState(false);


  const [isSheetsOptionsModalOpen, setIsSheetsOptionsModalOpen] = useState(false);
  const [selectedSheetOption, setSelectedSheetOption] = useState('transactions_table');


  const [editingCategory, setEditingCategory] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);


  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');


  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }, []);

  const handleNextAccount = useCallback(() => {
    setCurrentAccountIndex((prevIndex) =>
      (prevIndex + 1) % accounts.length
    );
  }, [accounts.length]);

  const handlePrevAccount = useCallback(() => {
    setCurrentAccountIndex((prevIndex) =>
      (prevIndex - 1 + accounts.length) % accounts.length
    );
  }, [accounts.length]);


  const handleOpenTotalBalanceModal = useCallback(() => {
    setIsTotalBalanceModalOpen(true);
  }, []);

  const handleCloseTotalBalanceModal = useCallback(() => {
    setIsTotalBalanceModalOpen(false);
  }, []);


  const handleOpenCategoryForm = useCallback(() => {
    setIsCategoryFormOpen(true);
    setEditingCategory(null);
  }, []);

  const handleCloseCategoryForm = useCallback(() => {
    setIsCategoryFormOpen(false);
    setEditingCategory(null);
  }, []);

  const handleEditCategory = useCallback((category) => {
    setEditingCategory(category);
    setIsCategoryFormOpen(true);
  }, []);

  // Account Form
  const handleOpenAccountForm = useCallback(() => {
    setIsAccountFormOpen(true);
    setEditingAccount(null);
  }, []);

  const handleCloseAccountForm = useCallback(() => {
    setIsAccountFormOpen(false);
    setEditingAccount(null);
  }, []);

  const handleEditAccount = useCallback((account) => {
    setEditingAccount(account);
    setIsAccountFormOpen(true);
  }, []);


  const handleOpenTransactionForm = useCallback(() => {
    setIsTransactionFormOpen(true);
    setEditingTransaction(null);
  }, []);

  const handleCloseTransactionForm = useCallback(() => {
    setIsTransactionFormOpen(false);
    setEditingTransaction(null);
  }, []);

  const handleEditTransaction = useCallback((transaction) => {
    setEditingTransaction(transaction);
    setIsTransactionFormOpen(true);
  }, []);


  const handleOpenAccountsListModal = useCallback(() => setIsAccountsListModalOpen(true), []);
  const handleCloseAccountsListModal = useCallback(() => setIsAccountsListModalOpen(false), []);

  const handleOpenTransactionsListModal = useCallback(() => setIsTransactionsListModalOpen(true), []);
  const handleCloseTransactionsListModal = useCallback(() => setIsTransactionsListModalOpen(false), []);

  const handleOpenCategoriesListModal = useCallback(() => {
    setIsCategoriesListModalOpen(true);

    console.log("Dashboard - Abrindo CategoriesListModal. Props passadas:", {
      categories: categories,
      loading: loading, 
      error: error 
    });
  }, [categories, loading, error]); 

  const handleCloseCategoriesListModal = useCallback(() => setIsCategoriesListModalOpen(false), []);


  const handleOpenSheetsOptionsModal = useCallback(() => {
    setIsSheetsOptionsModalOpen(true);
  }, []);

  const handleCloseSheetsOptionsModal = useCallback(() => {
    setIsSheetsOptionsModalOpen(false);
  }, []);

  const handleChangeSheetOption = useCallback((event) => {
    setSelectedSheetOption(event.target.value);
  }, []);


  const handleOpenSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleCloseSnackbar = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  }, []);

  const fetchAccounts = useCallback(async () => {
    console.log('>>> fetchAccounts: Função chamada! <<<');
    try {
      setLoading(true); 
      const response = await api.get('/accounts');
      setAccounts(response.data);
      const total = response.data.reduce((sum, account) => sum + parseFloat(account.saldo_atual), 0);
      setTotalBalance(total);
      
      if (currentAccountIndex >= response.data.length && response.data.length > 0) {
        setCurrentAccountIndex(0);
      } else if (response.data.length === 0) {
        setCurrentAccountIndex(0); 
      }
      setError(null); 
    } catch (err) {
      console.error("Erro ao buscar contas:", err);
      setError("Não foi possível carregar as contas.");
      handleOpenSnackbar("Erro ao carregar contas.", "error");
    } finally {
      setLoading(false); 
    }
  }, [handleOpenSnackbar, currentAccountIndex]); 

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true); 
      const response = await api.get('/transactions');
      setTransactions(response.data);
      setError(null); 
    } catch (err) {
      console.error("Erro ao buscar transações:", err);
      setError("Não foi possível carregar as transações.");
      handleOpenSnackbar("Erro ao carregar transações.", "error");
    } finally {
      setLoading(false); 
    }
  }, [handleOpenSnackbar]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
      setError(null); 
    } catch (err) {
      console.error("Erro ao buscar categorias:", err);
      setError("Não foi possível carregar as categorias.");
      handleOpenSnackbar("Erro ao carregar categorias.", "error");
    } finally {
      setLoading(false); 
    }
  }, [handleOpenSnackbar]);

  const handleAccountAdded = useCallback(async (newAccount) => {
    await fetchAccounts();
    handleCloseAccountForm();
    handleOpenSnackbar("Conta adicionada com sucesso!");
  }, [fetchAccounts, handleCloseAccountForm, handleOpenSnackbar]);

  const handleAccountUpdated = useCallback(async (updatedAccount) => {
    await fetchAccounts();
    handleCloseAccountForm();
    handleOpenSnackbar("Conta atualizada com sucesso!");
  }, [fetchAccounts, handleCloseAccountForm, handleOpenSnackbar]);

  const handleDeleteAccount = useCallback(async (accountId) => {
    try {
      await api.delete(`/accounts/${accountId}`);
      await fetchAccounts();
      handleOpenSnackbar("Conta excluída com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir conta:", err);
      handleOpenSnackbar("Erro ao excluir conta. Verifique se não há transações associadas.", "error");
    }
  }, [fetchAccounts, handleOpenSnackbar]);

  const handleCategoryAdded = useCallback(async (newCategory) => {
    await fetchCategories();
    handleCloseCategoryForm();
    handleOpenSnackbar("Categoria adicionada com sucesso!");
  }, [fetchCategories, handleCloseCategoryForm, handleOpenSnackbar]);

  const handleCategoryUpdated = useCallback(async (updatedCategory) => {
    await fetchCategories();
    handleCloseCategoryForm();
    handleOpenSnackbar("Categoria atualizada com sucesso!");
  }, [fetchCategories, handleCloseCategoryForm, handleOpenSnackbar]);

  const handleDeleteCategory = useCallback(async (categoryId) => {
    try {
      await api.delete(`/categories/${categoryId}`);
      await fetchCategories();
      handleOpenSnackbar("Categoria excluída com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir categoria:", err);
      handleOpenSnackbar("Erro ao excluir categoria. Verifique se não há transações associadas.", "error");
    }
  }, [fetchCategories, handleOpenSnackbar]);

  const handleTransactionAdded = useCallback(async (newTransaction) => {
    await fetchTransactions();
    await fetchAccounts();
    handleCloseTransactionForm();
    handleOpenSnackbar("Transação adicionada com sucesso!");
  }, [fetchTransactions, fetchAccounts, handleCloseTransactionForm, handleOpenSnackbar]);

  const handleTransactionUpdated = useCallback(async (updatedTransaction) => {
    await fetchTransactions();
    await fetchAccounts();
    handleCloseTransactionForm();
    handleOpenSnackbar("Transação atualizada com sucesso!");
  }, [fetchTransactions, fetchAccounts, handleCloseTransactionForm, handleOpenSnackbar]);

  const handleDeleteTransaction = useCallback(async (transactionId) => {
    try {
      await api.delete(`/transactions/${transactionId}`);
      await fetchTransactions();
      await fetchAccounts();
      handleOpenSnackbar("Transação excluída com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir transação:", err);
      handleOpenSnackbar("Erro ao excluir transação.", "error");
    }
  }, [fetchTransactions, fetchAccounts, handleOpenSnackbar]);

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchCategories();
  }, [fetchAccounts, fetchTransactions, fetchCategories]);

  const quickActions = useQuickActionsLogic({
    handleOpenTransactionForm,
    handleOpenAccountForm,
    handleOpenCategoryForm, 
    handleOpenTransactionsListModal,
    handleOpenAccountsListModal,
    handleOpenCategoriesListModal,
    handleOpenSheetsOptionsModal,
    handleOpenTotalBalanceModal, 
    handleCloseTotalBalanceModal, 
    navigate,
  });

  const currentAccount = accounts[currentAccountIndex];


 return (
    <Box sx={{ flexGrow: 1, backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="static" elevation={0} sx={{ backgroundColor: theme.palette.background.paper, borderBottom: '1px solid', borderColor: theme.palette.divider }}>
        <Toolbar>
          <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2, color: theme.palette.text.secondary }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: theme.palette.primary.main, fontWeight: 'bold' }}>
            Dashboard Financeiro
          </Typography>
          {user && (
            <Typography variant="body1" sx={{ mr: 2, color: theme.palette.text.secondary }}>
              Olá, {user.username || user.email}!
            </Typography>
          )}
          <Tooltip title="Guia de Funções">
            <IconButton
              size="large"
              edge="end"
              aria-label="guia de funções"
              color="inherit"
              onClick={handleGoToFunctionGuide}
              sx={{ color: theme.palette.text.secondary }}
            >
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={toggleColorMode} color="inherit" sx={{ color: theme.palette.text.secondary }}>
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />} sx={{ color: theme.palette.text.secondary }}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2, color: theme.palette.text.secondary }}>Carregando dados...</Typography>
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/*QuickActionsCard */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 'bold', mb: 2 }}>
            Ações Rápidas
          </Typography>
          <QuickActionsCard
            onNewTransactionClick={quickActions.onNewTransactionClick}
            onNewAccountClick={quickActions.onNewAccountClick}
            onNewCategoryClick={quickActions.onNewCategoryClick} 
            onViewCategoriesClick={quickActions.onViewCategoriesClick}
            onViewTransactionsClick={quickActions.onViewTransactionsClick}
            onViewAccountsClick={quickActions.onViewAccountsClick}
            onSheetsOptionsClick={quickActions.onSheetsOptionsClick}
            onFinancialAgendaClick={quickActions.onFinancialAgendaClick}
            onGoalsObjectivesClick={quickActions.onGoalsObjectivesClick}
            onListsClick={quickActions.onListsClick}
            onSmartCalculatorClick={quickActions.onSmartCalculatorClick}
            onAnalystClick={quickActions.onAnalystClick}
            onAchievementsClick={quickActions.onAchievementsClick}
          />
        </Box>

        <Grid container spacing={4}>
          {/* Card de Saldo Total */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={6}
              sx={{
                p: 3,
                borderRadius: '12px',
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: theme.shadows[10],
                },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onClick={handleOpenTotalBalanceModal}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 1 }} />
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Saldo Total Geral
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  color: totalBalance < 0 ? theme.palette.error.main : theme.palette.text.primary,
                  fontWeight: 'bold',
                }}
              >
                {currencyFormatter.format(totalBalance)}
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                sx={{ mt: 2, borderRadius: '8px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenTotalBalanceModal();
                }}
              >
                Ver Detalhes
              </Button>
            </Paper>
          </Grid>

          {/*Card de Contas com Carrossel */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={6}
              sx={{
                p: 3,
                borderRadius: '12px',
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
                Minhas Contas
              </Typography>
              {accounts.length === 0 ? (
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Nenhuma conta cadastrada.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={quickActions.onNewAccountClick}
                    sx={{ borderRadius: '8px' }}
                  >
                    Adicionar Conta
                  </Button>
                </Box>
              ) : (
                <Box sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexGrow: 1, 
                  textAlign: 'center',
                }}>
                  <IconButton onClick={handlePrevAccount} disabled={accounts.length <= 1} sx={{ color: theme.palette.text.secondary }}>
                    <ArrowBackIosNewIcon />
                  </IconButton>
                  <Box sx={{ flexGrow: 1, px: 2 }}> {/* ver se ficou bom */}
                    {currentAccount ? (
                      <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: theme.palette.primary.main }}>
                          {currentAccount.nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {currentAccount.tipo}
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{
                            color: parseFloat(currentAccount.saldo_atual) < 0 ? theme.palette.error.main : theme.palette.text.primary,
                            fontWeight: 'bold',
                            mt: 1
                          }}
                        >
                          {currencyFormatter.format(currentAccount.saldo_atual)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        Nenhuma conta selecionada.
                      </Typography>
                    )}
                  </Box>
                  <IconButton onClick={handleNextAccount} disabled={accounts.length <= 1} sx={{ color: theme.palette.text.secondary }}>
                    <ArrowForwardIosIcon />
                  </IconButton>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>


        {/* Diálogos de Formulário */}
        <Dialog open={isCategoryFormOpen} onClose={handleCloseCategoryForm} fullWidth maxWidth="sm">
          <DialogTitle sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, borderBottom: '1px solid', borderColor: theme.palette.divider }}>
            {editingCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
          </DialogTitle>
          <DialogContent dividers sx={{ borderBottom: 'none', borderColor: theme.palette.divider }}>
            <CategoryForm
              editingCategory={editingCategory}
              setEditingCategory={setEditingCategory}
              onCategoryAdded={handleCategoryAdded}
              onCategoryUpdated={handleCategoryUpdated}
              onClose={handleCloseCategoryForm}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isAccountFormOpen} onClose={handleCloseAccountForm} fullWidth maxWidth="sm">
          <DialogTitle sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, borderBottom: '1px solid', borderColor: theme.palette.divider }}>
            {editingAccount ? 'Editar Conta' : 'Adicionar Nova Conta'}
          </DialogTitle>
          <DialogContent dividers sx={{ borderBottom: 'none', borderColor: theme.palette.divider }}>
            <AccountForm
              editingAccount={editingAccount}
              setEditingAccount={setEditingAccount}
              onAccountAdded={handleAccountAdded}
              onAccountUpdated={handleAccountUpdated}
              onClose={handleCloseAccountForm}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isTransactionFormOpen} onClose={handleCloseTransactionForm} fullWidth maxWidth="md">
          <DialogTitle sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, borderBottom: '1px solid', borderColor: theme.palette.divider }}>
            {editingTransaction ? 'Editar Transação' : 'Adicionar Nova Transação'}
          </DialogTitle>
          <DialogContent dividers sx={{ borderBottom: 'none', borderColor: theme.palette.divider }}>
            <TransactionForm
              editingTransaction={editingTransaction}
              setEditingTransaction={setEditingTransaction}
              onTransactionAdded={handleTransactionAdded}
              onTransactionUpdated={handleTransactionUpdated}
              onClose={handleCloseTransactionForm}
            />
          </DialogContent>
        </Dialog>

        {/* Modais de Listagem Completa */}
        <AccountsListModal
          open={isAccountsListModalOpen}
          onClose={handleCloseAccountsListModal}
          onAccountAdded={handleAccountAdded}
          onAccountUpdated={handleAccountUpdated}
          onDeleteAccount={handleDeleteAccount}
          onEditAccount={handleEditAccount}
        />

        <TransactionsListModal
          open={isTransactionsListModalOpen}
          onClose={handleCloseTransactionsListModal}
          onTransactionAdded={handleTransactionAdded}
          onTransactionUpdated={handleTransactionUpdated}
          onDeleteTransaction={handleDeleteTransaction}
          onEditTransaction={handleEditTransaction}
        />

        <CategoriesListModal
          open={isCategoriesListModalOpen}
          onClose={handleCloseCategoriesListModal}
          categories={categories} 
          loadingCategories={loading}
          categoriesError={error} 
          onEditCategory={handleEditCategory}
          onCategoryAdded={fetchCategories} 
        />

        {/*SheetsOptionsModal */}
        <Dialog open={isSheetsOptionsModalOpen} onClose={handleCloseSheetsOptionsModal} fullWidth maxWidth="sm">
          <DialogTitle sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, borderBottom: '1px solid', borderColor: theme.palette.divider }}>
            Opções de Planilhas e Gráficos
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Escolha uma opção para visualizar ou gerenciar seus dados de forma avançada.
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="sheet-option-label">Visualizar</InputLabel>
              <Select
                labelId="sheet-option-label"
                id="sheet-option-select"
                value={selectedSheetOption}
                label="Visualizar"
                onChange={handleChangeSheetOption}
              >
                <MenuItem value="transactions_table">Tabela de Transações Detalhada</MenuItem>
                <MenuItem value="accounts_table">Tabela de Contas</MenuItem>
                <MenuItem value="categories_table">Tabela de Categorias</MenuItem>
                <MenuItem value="income_vs_expense_chart">Gráfico de Receita vs. Despesa</MenuItem>
                <MenuItem value="category_spending_chart">Gráfico de Gastos por Categoria</MenuItem>
                {/* Preciso validar as adições */}
              </Select>
            </FormControl>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  handleCloseSheetsOptionsModal();
                  navigate(`/sheets?view=${selectedSheetOption}`);
                }}
                sx={{ borderRadius: '8px', mr: 2 }}
              >
                Abrir Selecionado
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCloseSheetsOptionsModal}
                sx={{ borderRadius: '8px' }}
              >
                Cancelar
              </Button>
            </Box>

            {/*Pré-visualização */}
            <Box sx={{ mt: 4, p: 2, border: `1px dashed ${theme.palette.divider}`, borderRadius: '8px' }}>
              {selectedSheetOption === 'transactions_table' && (
                <Typography variant="body2" color="text.secondary">
                  Exibe todas as suas transações em uma tabela interativa com filtros e ordenação.
                </Typography>
              )}
              {selectedSheetOption === 'income_vs_expense_chart' && (
                <Typography variant="body2" color="text.secondary">
                  Mostra a comparação visual entre suas receitas e despesas ao longo do tempo.
                </Typography>
              )}
              {selectedSheetOption === 'accounts_table' && (
                <Typography variant="body2" color="text.secondary">
                  Visualiza todas as suas contas cadastradas com seus respectivos saldos e tipos.
                </Typography>
              )}
              {selectedSheetOption === 'categories_table' && (
                <Typography variant="body2" color="text.secondary">
                  Lista todas as categorias de transação, indicando se são de receita ou despesa.
                </Typography>
              )}
              {selectedSheetOption === 'category_spending_chart' && (
                <Typography variant="body2" color="text.secondary">
                  Apresenta um gráfico de pizza dos seus gastos divididos por categoria.
                </Typography>
              )}
            </Box>

          </DialogContent>
        </Dialog>


        {/* Snackbar para mensagens de feedback */}
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default Dashboard;
