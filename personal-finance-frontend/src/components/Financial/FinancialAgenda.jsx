import React, { useState, useEffect, useCallback } from 'react';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  InputAdornment,
  useTheme,
  Paper, // Para o visual de "planilha"
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DashboardIcon from '@mui/icons-material/Dashboard'; // Ícone para Dashboard
import { useNavigate } from 'react-router-dom'; // Para navegar de volta ao Dashboard

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Importa DataGrid e componentes da Toolbar do MUI X
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridActionsCellItem, // Para botões de ação na célula
} from '@mui/x-data-grid';

import api from '../../api/axios'; // Certifique-se de que o caminho está correto

const FinancialAgenda = () => {
  const theme = useTheme();
  const navigate = useNavigate(); // Hook para navegação

  // --- Estados para os dados ---
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]); // Transações da Agenda

  // --- Estados para Modais e Formulários ---
  const [openTransactionModal, setOpenTransactionModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  const [openAccountModal, setOpenAccountModal] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);

  // --- Estados do Formulário de Transação ---
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState(''); // 'receita' ou 'despesa'
  const [dataVencimento, setDataVencimento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [contaId, setContaId] = useState('');
  const [entidade, setEntidade] = useState('');
  const [status, setStatus] = useState('pendente'); // 'pendente', 'pago', 'recebido', 'cancelado'
  const [categoriaId, setCategoriaId] = useState('');
  const [parcelado, setParcelado] = useState(false);
  const [numeroParcela, setNumeroParcela] = useState(''); // Corrigido para numero_parcela
  const [totalParcelas, setTotalParcelas] = useState('');
  const [idTransacaoPai, setIdTransacaoPai] = useState('');
  const [observacoesTransacao, setObservacoesTransacao] = useState('');
  const [dataPagamentoRecebimento, setDataPagamentoRecebimento] = useState(''); // Novo campo

  // --- Estados do Formulário de Conta ---
  const [nomeConta, setNomeConta] = useState('');
  const [saldoInicialConta, setSaldoInicialConta] = useState('');
  const [tipoConta, setTipoConta] = useState('checking'); // Padrão
  const [instituicao, setInstituicao] = useState('');
  const [observacoesConta, setObservacoesConta] = useState('');

  // --- Estados de Feedback e Carregamento ---
  const [loading, setLoading] = useState(true); // Estado de carregamento inicial
  const [submitting, setSubmitting] = useState(false); // Para carregamento de submit de formulário
  const [error, setError] = useState(null);   // Estado de erro para a carga inicial
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

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

  // --- Funções de Abertura/Fechamento de Modais ---
  const handleOpenTransactionModal = useCallback((transaction = null) => {
    setCurrentTransaction(transaction);
    if (transaction) {
      setDescricao(transaction.descricao || '');
      setValor(String(transaction.valor || '').replace('.', ','));
      setTipo(transaction.tipo || '');
      setDataVencimento(transaction.data_vencimento ? format(new Date(transaction.data_vencimento), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
      setContaId(transaction.conta_id || '');
      setEntidade(transaction.entidade || '');
      setStatus(transaction.status || 'pendente');
      setCategoriaId(transaction.categoria_id || '');
      setParcelado(transaction.parcelado || false);
      setNumeroParcela(transaction.numero_parcela || '');
      setTotalParcelas(transaction.total_parcelas || '');
      setIdTransacaoPai(transaction.id_transacao_pai || '');
      setObservacoesTransacao(transaction.observacoes || '');
      setDataPagamentoRecebimento(transaction.data_pagamento_recebimento ? format(new Date(transaction.data_pagamento_recebimento), 'yyyy-MM-dd') : '');
    } else {
      setDescricao('');
      setValor('');
      setTipo('');
      setDataVencimento(format(new Date(), 'yyyy-MM-dd'));
      setContaId('');
      setEntidade('');
      setStatus('pendente');
      setCategoriaId('');
      setParcelado(false);
      setNumeroParcela('');
      setTotalParcelas('');
      setIdTransacaoPai('');
      setObservacoesTransacao('');
      setDataPagamentoRecebimento('');
    }
    setOpenTransactionModal(true);
  }, []);

  const handleCloseTransactionModal = useCallback(() => {
    setOpenTransactionModal(false);
    setCurrentTransaction(null);
  }, []);

  const handleOpenAccountModal = useCallback((account = null) => {
    setCurrentAccount(account);
    if (account) {
      setNomeConta(account.nome || '');
      setSaldoInicialConta(String(account.saldo_inicial || '').replace('.', ','));
      setTipoConta(account.tipo || 'checking');
      setInstituicao(account.instituicao || '');
      setObservacoesConta(account.observacoes || '');
    } else {
      setNomeConta('');
      setSaldoInicialConta('');
      setTipoConta('checking');
      setInstituicao('');
      setObservacoesConta('');
    }
    setOpenAccountModal(true);
  }, []);

  const handleCloseAccountModal = useCallback(() => {
    setOpenAccountModal(false);
    setCurrentAccount(null);
  }, []);

  // --- Funções de Formatação ---
  const formatCurrency = useCallback((value) => {
    if (value === null || value === undefined || value === '' || isNaN(value)) return 'R$ 0,00';
    return `R$ ${parseFloat(value).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }, []);

  // --- Funções de Manipulação de Dados (Chamadas de API) ---

  // Função para buscar todos os dados (Contas, Categorias, Transações da Agenda)
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const accountsResponse = await api.get('/accounts'); // Usando /accounts para rotas gerais
      setAccounts(accountsResponse.data);
      showSnackbar("Contas da agenda carregadas!", "success");

      const categoriesResponse = await api.get('/categories'); // Usando /categories para rotas gerais
      setCategories(categoriesResponse.data);
      showSnackbar("Categorias carregadas!", "success");

      const transactionsResponse = await api.get('/transactions'); // Usando /transactions para rotas gerais
      // FILTRAGEM E GARANTIA DE ID e VALOR NUMÉRICO:
      setTransactions(transactionsResponse.data.filter(t => t && t.id !== undefined && t.id !== null).map(t => ({
        ...t,
        valor: parseFloat(t.valor) // Garante que o valor seja um número
      })));
      showSnackbar("Transações carregadas!", "success");

    } catch (err) {
      console.error("Erro ao carregar dados iniciais para Financial Agenda:", err);
      if (err.response) {
        if (err.response.status === 401) {
          setError("Sessão expirada ou não autenticado. Por favor, faça login novamente.");
          showSnackbar("Sessão expirada. Redirecionando para login...", "error");
          // navigate('/login'); // Se estiver usando useNavigate, descomente aqui
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
  }, [showSnackbar]);

  // --- useEffect para carregar dados na montagem do componente ---
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- Funções de CRUD de Contas ---
  const handleSubmitAccount = useCallback(async () => {
    setSubmitting(true);
    try {
      const accountData = {
        nome: nomeConta,
        saldo: parseFloat(saldoInicialConta.replace(',', '.')), // Usar 'saldo' conforme o modelo
        tipo: tipoConta,
        instituicao: instituicao,
        observacoes: observacoesConta,
      };

      if (currentAccount) {
        await api.put(`/accounts/${currentAccount.id}`, accountData); // Usando /accounts para rotas gerais
        showSnackbar('Conta atualizada com sucesso!', 'success');
      } else {
        await api.post('/accounts', accountData); // Usando /accounts para rotas gerais
        showSnackbar('Conta adicionada com sucesso!', 'success');
      }
      handleCloseAccountModal();
      fetchInitialData(); // Recarrega os dados após a operação
    } catch (error) {
      console.error("Erro ao salvar conta:", error.response?.data || error.message);
      showSnackbar(`Erro ao salvar conta: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [nomeConta, saldoInicialConta, tipoConta, instituicao, observacoesConta, currentAccount, handleCloseAccountModal, fetchInitialData, showSnackbar]);

  const handleDeleteAccount = useCallback(async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta conta?")) {
      try {
        await api.delete(`/accounts/${id}`); // Usando /accounts para rotas gerais
        showSnackbar('Conta excluída com sucesso!', 'success');
        fetchInitialData(); // Recarrega os dados após a exclusão
      } catch (error) {
        console.error("Erro ao excluir conta:", error.response?.data || error.message);
        showSnackbar(`Erro ao excluir conta: ${error.response?.data?.message || error.message}`, 'error');
      }
    }
  }, [fetchInitialData, showSnackbar]);

  const handleEditAccount = useCallback((account) => {
    handleOpenAccountModal(account);
  }, [handleOpenAccountModal]);


  // --- Funções de CRUD de Transações ---
  const handleSubmitTransaction = useCallback(async () => {
    setSubmitting(true);
    try {
      const transactionData = {
        descricao: descricao,
        valor: parseFloat(valor.replace(',', '.')),
        tipo: tipo,
        data: dataVencimento, // Usar 'data' conforme o modelo
        conta_id: contaId,
        entidade: entidade,
        status: status, // Este campo não existe no modelo Transacao, mas pode ser um campo de agenda
        categoria_id: categoriaId,
        parcelado: parcelado, // Este campo não existe no modelo Transacao, mas pode ser um campo de agenda
        numero_parcela: parcelado ? parseInt(numeroParcela, 10) : null, // Campo de agenda
        total_parcelas: parcelado ? parseInt(totalParcelas, 10) : null, // Campo de agenda
        id_transacao_pai: parcelado && idTransacaoPai ? parseInt(idTransacaoPai, 10) : null, // Campo de agenda
        observacoes: observacoesTransacao, // Este campo não existe no modelo Transacao, mas pode ser um campo de agenda
        data_pagamento_recebimento: dataPagamentoRecebimento || null, // Campo de agenda
      };

      if (currentTransaction) {
        await api.put(`/transactions/${currentTransaction.id}`, transactionData); // Usando /transactions
        showSnackbar('Transação atualizada com sucesso!', 'success');
      } else {
        await api.post('/transactions', transactionData); // Usando /transactions
        showSnackbar('Transação adicionada com sucesso!', 'success');
      }
      handleCloseTransactionModal();
      fetchInitialData(); // Recarrega os dados após a operação
    } catch (error) {
      console.error("Erro ao salvar transação:", error.response?.data || error.message);
      showSnackbar(`Erro ao salvar transação: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [descricao, valor, tipo, dataVencimento, contaId, entidade, status, categoriaId, parcelado, numeroParcela, totalParcelas, idTransacaoPai, observacoesTransacao, dataPagamentoRecebimento, currentTransaction, handleCloseTransactionModal, fetchInitialData, showSnackbar]);

  const handleDeleteTransaction = useCallback(async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      try {
        await api.delete(`/transactions/${id}`); // Usando /transactions
        showSnackbar('Transação excluída com sucesso!', 'success');
        fetchInitialData(); // Recarrega os dados após a exclusão
      } catch (error) {
        console.error("Erro ao excluir transação:", error.response?.data || error.message);
        showSnackbar(`Erro ao excluir transação: ${error.response?.data?.message || error.message}`, 'error');
      }
    }
  }, [fetchInitialData, showSnackbar]);

  const handleEditTransaction = useCallback((transaction) => {
    handleOpenTransactionModal(transaction);
  }, [handleOpenTransactionModal]);

  // --- Função para lidar com a edição inline do DataGrid ---
  const processRowUpdate = useCallback(async (newRow, oldRow) => {
    try {
      const updatedFields = {};
      // Comparar newRow com oldRow para enviar apenas os campos modificados
      for (const key in newRow) {
        // Ignorar campos que não são para edição direta ou que são complexos
        if (key !== 'id' && key !== 'conta' && key !== 'categoria' && key !== 'nome_conta' && key !== 'nome_categoria' && key !== 'data_criacao' && key !== 'data_atualizacao' && key !== 'user_id' && key !== 'parcelas' && key !== 'parent_transaction' && key !== 'child_installments') {
          if (newRow[key] !== oldRow[key]) {
            // Converter valor e datas para o formato esperado pelo backend
            if (key === 'valor') {
              updatedFields[key] = parseFloat(String(newRow[key]).replace(',', '.'));
            } else if (key === 'data_vencimento' || key === 'data_pagamento_recebimento') { // 'data_vencimento' não existe no modelo Transacao
              updatedFields['data'] = newRow[key] ? format(new Date(newRow[key]), 'yyyy-MM-dd') : null; // Usar 'data'
            } else {
              updatedFields[key] = newRow[key];
            }
          }
        }
      }

      if (Object.keys(updatedFields).length === 0) {
        showSnackbar('Nenhuma alteração detectada.', 'info');
        return oldRow; // Retorna a linha antiga se nada mudou
      }

      const response = await api.put(`/transactions/${newRow.id}`, updatedFields);
      showSnackbar('Transação atualizada com sucesso!', 'success');
      // Atualiza o estado local com a linha completa retornada pelo backend
      const updatedTransaction = response.data;
      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
      );
      return updatedTransaction; // Retorna a linha atualizada para o DataGrid
    } catch (error) {
      console.error("Erro ao atualizar transação inline:", error.response?.data || error.message);
      showSnackbar(`Erro ao atualizar: ${error.response?.data?.message || error.message}`, 'error');
      return oldRow; // Retorna a linha antiga em caso de erro
    }
  }, [showSnackbar]);

  const handleProcessRowUpdateError = useCallback((error) => {
    console.error("Erro no processRowUpdate:", error);
    showSnackbar("Erro ao salvar alterações na linha.", "error");
  }, [showSnackbar]);


  // Mapeamento para exibir os labels corretos para o tipo de transação
  const tipoDisplayMap = {
    'income': 'Receita',
    'expense': 'Despesa'
  };

  // --- Definição das Colunas para o DataGrid ---
  const columns = React.useMemo(() => [
    // Removido o campo 'id' conforme solicitado
    { field: 'descricao', headerName: 'Descrição', width: 200, editable: true },
    {
      field: 'valor',
      headerName: 'Valor',
      width: 120,
      editable: true,
      type: 'number',
      valueFormatter: (params) => {
        const value = params?.value;
        if (value === null || value === undefined || value === '' || isNaN(value)) {
          return 'R$ 0,00';
        }
        return formatCurrency(value);
      },
      valueParser: (value) => {
        const parsed = parseFloat(String(value).replace(',', '.'));
        return isNaN(parsed) ? null : parsed;
      },
    },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 100,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: 'income', label: 'Receita' }, // Usar 'income' e 'expense' para o backend
        { value: 'expense', label: 'Despesa' }
      ],
      valueFormatter: (params) => { // Usar o mapa de exibição
        return tipoDisplayMap[params.value] || params.value;
      },
    },
    {
      field: 'data', // Usar 'data' conforme o modelo
      headerName: 'Data', // Alterado de Vencimento para Data
      width: 150,
      editable: true,
      type: 'date',
      valueFormatter: (params) => {
        const value = params?.value;
        return value ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }) : '';
      },
      valueParser: (value) => value ? format(new Date(value), 'yyyy-MM-dd') : null, // Para enviar ao backend
    },
    {
      field: 'nome_conta',
      headerName: 'Conta',
      width: 150,
      editable: false,
      // Usar params.row.conta?.nome para acessar a propriedade aninhada
      valueGetter: (params) => accounts.find(acc => acc.id === params?.row?.conta_id)?.nome || 'N/A',
    },
    {
      field: 'nome_categoria',
      headerName: 'Categoria',
      width: 150,
      editable: false,
      // Usar params.row.categoria?.nome para acessar a propriedade aninhada
      valueGetter: (params) => categories.find(cat => cat.id === params?.row?.categoria_id)?.nome || 'N/A',
    },
    {
      field: 'status', // Manter se este campo for de agenda, mas não existe em Transacao do models.py
      headerName: 'Status',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: 'pendente', label: 'Pendente' },
        { value: 'pago', label: 'Pago' },
        { value: 'recebido', label: 'Recebido' },
        { value: 'cancelado', label: 'Cancelado' }
      ],
    },
    {
      field: 'data_pagamento_recebimento', // Manter se este campo for de agenda
      headerName: 'Data Pgto/Rec',
      width: 150,
      editable: true,
      type: 'date',
      valueFormatter: (params) => {
        const value = params?.value;
        return value ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }) : '';
      },
      valueParser: (value) => value ? format(new Date(value), 'yyyy-MM-dd') : null,
    },
    { field: 'entidade', headerName: 'Entidade', width: 150, editable: true },
    { field: 'observacoes', headerName: 'Observações', width: 200, editable: true },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 100,
      cellClassName: 'actions',
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Editar"
          onClick={() => handleEditTransaction(params.row)}
          color="inherit"
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Excluir"
          onClick={() => handleDeleteTransaction(params.row.id)}
          color="inherit"
        />,
      ],
    },
  ], [formatCurrency, handleEditTransaction, handleDeleteTransaction, accounts, categories]);

  // --- Componente da Toolbar Personalizada para o DataGrid ---
  const CustomToolbar = useCallback(() => {
    return (
      <GridToolbarContainer sx={{ justifyContent: 'space-between', p: 1 }}>
        <Box>
          <GridToolbarQuickFilter sx={{ mr: 1 }} />
          <GridToolbarFilterButton sx={{ mr: 1 }} />
          <GridToolbarDensitySelector sx={{ mr: 1 }} />
          <GridToolbarExport />
        </Box>
        <Box>
          {/* Botão "Voltar para o Dashboard" já existente */}
          <Button
            variant="contained"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/')}
            sx={{ mr: 1, bgcolor: theme.palette.grey[700], '&:hover': { bgcolor: theme.palette.grey[900] } }}
          >
            Voltar para o Dashboard
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenTransactionModal()}
            sx={{ mr: 1 }}
          >
            Nova Transação
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenAccountModal()}
          >
            Nova Conta
          </Button>
        </Box>
      </GridToolbarContainer>
    );
  }, [navigate, handleOpenTransactionModal, handleOpenAccountModal, theme]);


  // --- Renderização Condicional ---
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">Carregando Agenda Financeira...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>
        <Button onClick={fetchInitialData} variant="contained" color="primary">Tentar Novamente</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}> {/* Usar maxWidth="xl" para mais espaço */}
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Agenda Financeira
        </Typography>

        <Paper elevation={3} sx={{ height: 600, width: '100%', mb: 4 }}>
          <DataGrid
            rows={transactions}
            columns={columns}
            pageSizeOptions={[5, 10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
              sorting: {
                sortModel: [{ field: 'data', sort: 'asc' }], // Ordenar por 'data'
              },
            }}
            checkboxSelection
            disableRowSelectionOnClick
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={handleProcessRowUpdateError}
            slots={{
              toolbar: CustomToolbar,
            }}
            localeText={{
              // Tradução para o português do Brasil
              toolbarColumns: 'Colunas',
              toolbarFilters: 'Filtros',
              toolbarDensity: 'Densidade',
              toolbarExport: 'Exportar',
              toolbarQuickFilterPlaceholder: 'Buscar...',
              toolbarQuickFilterLabel: 'Buscar',
              toolbarQuickFilterDeleteIconLabel: 'Limpar',
              filterPanelColumns: 'Colunas',
              filterPanelOperators: 'Operadores',
              filterPanelInputLabel: 'Valor',
              filterPanelInputPlaceholder: 'Valor do filtro',
              filterOperatorContains: 'contém',
              filterOperatorEquals: 'igual a',
              filterOperatorStartsWith: 'começa com',
              filterOperatorEndsWith: 'termina com',
              filterOperatorIsEmpty: 'está vazio',
              filterOperatorIsNotEmpty: 'não está vazio',
              filterOperatorIsAnyOf: 'é um de',
              filterOperatorGreaterThan: 'maior que',
              filterOperatorGreaterThanOrEqual: 'maior ou igual a',
              filterOperatorLessThan: 'menor que',
              filterOperatorLessThanOrEqual: 'menor ou igual a',
              columnMenuLabel: 'Menu',
              columnMenuShowColumns: 'Mostrar colunas',
              columnMenuFilter: 'Filtrar',
              columnMenuHideColumn: 'Ocultar coluna',
              columnMenuUnsort: 'Desfazer ordenação',
              columnMenuSortAsc: 'Ordenar ASC',
              columnMenuSortDesc: 'Ordenar DESC',
              columnsPanelTextFieldLabel: 'Encontrar coluna',
              columnsPanelTextFieldPlaceholder: 'Título da coluna',
              columnsPanelShowAllButton: 'Mostrar todos',
              columnsPanelHideAllButton: 'Ocultar todos',
              footerTotalRows: 'Total de Linhas:',
              footerPaginationRowsPerPage: 'Linhas por página:',
              // Adicione mais traduções conforme necessário
            }}
            sx={{
              '& .MuiDataGrid-cell--textLeft': {
                alignItems: 'flex-start',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 'bold',
              },
            }}
          />
        </Paper>

        {/* --- Modal de Adição/Edição de Conta (mantido para edição completa) --- */}
        <Dialog open={openAccountModal} onClose={handleCloseAccountModal}>
          <DialogTitle>{currentAccount ? 'Editar Conta' : 'Adicionar Nova Conta'}</DialogTitle>
          <DialogContent>
            <TextField
              label="Nome da Conta"
              fullWidth
              value={nomeConta}
              onChange={(e) => setNomeConta(e.target.value)}
              margin="normal"
            />
            <TextField
              label="Saldo Inicial"
              fullWidth
              value={saldoInicialConta}
              onChange={(e) => {
                const value = e.target.value.replace('.', ',');
                if (/^-?\d*([,]?\d{0,2})?$/.test(value)) {
                  setSaldoInicialConta(value);
                }
              }}
              margin="normal"
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                inputMode: 'decimal',
              }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo da Conta</InputLabel>
              <Select
                value={tipoConta}
                label="Tipo da Conta"
                onChange={(e) => setTipoConta(e.target.value)}
              >
                <MenuItem value="checking">Conta Corrente</MenuItem>
                <MenuItem value="savings">Poupança</MenuItem>
                <MenuItem value="credit_card">Cartão de Crédito</MenuItem>
                <MenuItem value="investment">Investimento</MenuItem>
                <MenuItem value="cash">Dinheiro</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Instituição Financeira"
              fullWidth
              value={instituicao}
              onChange={(e) => setInstituicao(e.target.value)}
              margin="normal"
            />
            <TextField
              label="Observações da Conta"
              fullWidth
              multiline
              rows={3}
              value={observacoesConta}
              onChange={(e) => setObservacoesConta(e.target.value)}
              margin="normal"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseAccountModal} color="secondary" disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitAccount} variant="contained" color="primary" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : (currentAccount ? 'Salvar Alterações' : 'Adicionar')}
            </Button>
          </DialogActions>
        </Dialog>


        {/* --- Modal de Adição/Edição de Transação (mantido para edição completa) --- */}
        <Dialog open={openTransactionModal} onClose={handleCloseTransactionModal}>
          <DialogTitle>{currentTransaction ? 'Editar Transação' : 'Adicionar Nova Transação'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Descrição"
                  fullWidth
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Valor"
                  fullWidth
                  value={valor}
                  onChange={(e) => {
                    const value = e.target.value.replace('.', ',');
                    if (/^-?\d*([,]?\d{0,2})?$/.test(value)) {
                      setValor(value);
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
                <FormControl fullWidth margin="normal">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={tipo}
                    label="Tipo"
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    <MenuItem value="income">Receita</MenuItem>
                    <MenuItem value="expense">Despesa</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data"
                  type="date"
                  fullWidth
                  value={dataVencimento} // Usando dataVencimento para o campo 'data'
                  onChange={(e) => setDataVencimento(e.target.value)}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Conta</InputLabel>
                  <Select
                    value={contaId}
                    label="Conta"
                    onChange={(e) => setContaId(e.target.value)}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.nome} ({account.tipo})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Entidade (De/Para)"
                  fullWidth
                  value={entidade}
                  onChange={(e) => setEntidade(e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    label="Status"
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <MenuItem value="pendente">Pendente</MenuItem>
                    <MenuItem value="pago">Pago</MenuItem>
                    <MenuItem value="recebido">Recebido</MenuItem>
                    <MenuItem value="cancelado">Cancelado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={categoriaId}
                    label="Categoria"
                    onChange={(e) => setCategoriaId(e.target.value)}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.nome} ({category.tipo})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Observações da Transação"
                  fullWidth
                  multiline
                  rows={3}
                  value={observacoesTransacao}
                  onChange={(e) => setObservacoesTransacao(e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Data de Pagamento/Recebimento"
                  type="date"
                  fullWidth
                  value={dataPagamentoRecebimento}
                  onChange={(e) => setDataPagamentoRecebimento(e.target.value)}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={parcelado}
                      onChange={(e) => setParcelado(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Parcelado"
                />
              </Grid>
              {parcelado && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Número da Parcela"
                      fullWidth
                      value={numeroParcela}
                      onChange={(e) => setNumeroParcela(e.target.value)}
                      margin="normal"
                      type="number"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Total de Parcelas"
                      fullWidth
                      value={totalParcelas}
                      onChange={(e) => setTotalParcelas(e.target.value)}
                      margin="normal"
                      type="number"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="ID da Transação Pai (para parcelas)"
                      fullWidth
                      value={idTransacaoPai}
                      onChange={(e) => setIdTransacaoPai(e.target.value)}
                      margin="normal"
                      type="number"
                      helperText="Preencher apenas se for uma parcela de uma transação maior."
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseTransactionModal} color="secondary" disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitTransaction} variant="contained" color="primary" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : (currentTransaction ? 'Salvar Alterações' : 'Adicionar')}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default FinancialAgenda;
