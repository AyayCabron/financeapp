// src/hooks/useQuickActionsLogic.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom'; // Certifique-se que useNavigate está importado

// Este hook centralizará a lógica de estado e as funções de manipulação
// relacionadas aos formulários e modais acionados pelo QuickActionsCard.

// O Dashboard agora passará as funções para este hook
const useQuickActionsLogic = ({
  handleOpenTransactionForm,
  handleOpenAccountForm,
  handleOpenCategoryForm, // ✅ Adicionado: Função para abrir o formulário de categoria
  handleOpenTransactionsListModal,
  handleOpenAccountsListModal,
  handleOpenCategoriesListModal,
  handleOpenSheetsOptionsModal,
  handleOpenTotalBalanceModal, // Passando para o useQuickActionsLogic se ele for usar
  handleCloseTotalBalanceModal, // Passando para o useQuickActionsLogic se ele for usar
  // Não precisamos mais passar 'navigate' como prop aqui, pois o hook já o usa internamente.
  // navigate, // <-- REMOVA ESTA LINHA SE VOCÊ ESTIVER PASSANDO DE Dashboard
}) => {
  const navigate = useNavigate(); // <-- Garanta que useNavigate está sendo usado AQUI

  // Não precisamos mais de estados de `isOpen` aqui, pois o Dashboard os gerencia
  // e passa as funções de abertura/fechamento.

  // --- Estados para SnackBar (ainda gerenciados aqui, se desejar feedback global) ---
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info'); // 'success', 'error', 'warning', 'info'

  const showSnackbar = useCallback((message, severity = 'info') => {
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

  // --- Funções para Fetch de Dados (expostas para Dashboard) ---
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
      showSnackbar("Erro ao carregar contas.", "error");
    }
  }, [showSnackbar]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      showSnackbar("Erro ao carregar categorias.", "error");
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, [fetchAccounts, fetchCategories]);


  // Funções de Ação Rápida (encapsuladas para serem passadas como props)
  const onNewTransactionClick = useCallback(() => {
    handleOpenTransactionForm();
  }, [handleOpenTransactionForm]);

  const onNewAccountClick = useCallback(() => {
    handleOpenAccountForm();
  }, [handleOpenAccountForm]);

  const onNewCategoryClick = useCallback(() => { // NOVO: Função para abrir o formulário de nova categoria
    handleOpenCategoryForm();
  }, [handleOpenCategoryForm]);

  const onViewCategoriesClick = useCallback(() => {
    handleOpenCategoriesListModal();
  }, [handleOpenCategoriesListModal]);

  const onViewTransactionsClick = useCallback(() => {
    handleOpenTransactionsListModal();
  }, [handleOpenTransactionsListModal]);

  const onViewAccountsClick = useCallback(() => {
    handleOpenAccountsListModal();
  }, [handleOpenAccountsListModal]);

  const onSheetsOptionsClick = useCallback(() => {
    handleOpenSheetsOptionsModal();
  }, [handleOpenSheetsOptionsModal]);

  // Funções para outros botões do QuickActionsCard, se você quiser que eles naveguem
  // ou abram outros modais/lógicas.
  const onFinancialAgendaClick = useCallback(() => {
    navigate('/financial-agenda'); // ✅ Corrigido: Navega para a rota
    showSnackbar("Redirecionando para Agenda Financeira...", "info");
  }, [navigate, showSnackbar]);

  const onGoalsObjectivesClick = useCallback(() => {
    navigate('/goals-objectives'); 
    showSnackbar("Redirecionando para Metas e Objetivos...", "info");
  }, [navigate, showSnackbar]);

  const onListsClick = useCallback(() => {
    navigate('/lists'); 
    showSnackbar("Redirecionando para Listas...", "info");
  }, [navigate, showSnackbar]);

  const onSmartCalculatorClick = useCallback(() => {
    navigate('/smart-calculator'); 
    showSnackbar("Redirecionando para Calculadora Inteligente...", "info");
  }, [navigate, showSnackbar]);

  const onAnalystClick = useCallback(() => {
    navigate('/analyst'); 
    showSnackbar("Redirecionando para Analista...", "info");
  }, [navigate, showSnackbar]);

  const onAchievementsClick = useCallback(() => {
    navigate('/achievements'); 
    showSnackbar("Redirecionando para Minhas Conquistas...", "info");
  }, [navigate, showSnackbar]);

  // Função para navegar para Sheets (se SheetsOptionsModal tiver um botão específico)
  const handleNavigateToSheets = useCallback(() => {
    navigate('/sheets');
    showSnackbar("Redirecionando para Planilhas...", "info");
  }, [navigate, showSnackbar]);


  // Retorna as funções que o QuickActionsCard precisa e outras variáveis de estado/funções
  return {
    // Estados do Snackbar
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    handleCloseSnackbar,
    showSnackbar,

    // Dados (contas e categorias)
    accounts,
    categories,
    fetchAccounts,
    fetchCategories,

    // Funções de Ações Rápidas (QuickActionsCard)
    onNewTransactionClick,
    onNewAccountClick,
    onNewCategoryClick, // NOVO: Retorna a função para o Dashboard
    onViewCategoriesClick,
    onViewTransactionsClick,
    onViewAccountsClick,
    onSheetsOptionsClick,
    onFinancialAgendaClick,
    onGoalsObjectivesClick,
    onListsClick,
    onSmartCalculatorClick, 
    onAnalystClick,
    onAchievementsClick,
    handleNavigateToSheets,
  };
};

export default useQuickActionsLogic;
