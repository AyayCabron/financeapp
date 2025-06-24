import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Grid,
  CssBaseline,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popover,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Ícones do Material UI
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import FilterListIcon from '@mui/icons-material/FilterList';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile'; 
import DownloadIcon from '@mui/icons-material/Download'; 

import { ColorModeContext } from '../../main';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios'; 


import QuickActionsCard from '../Shared/QuickActionsCard';

function Sheets() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { toggleColorMode } = useContext(ColorModeContext);
  const { logout } = useAuth();
  const { user } = useAuth();


  const [transactionsData, setTransactionsData] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionsError, setTransactionsError] = useState(null);


  const [accountsList, setAccountsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loadingRelatedData, setLoadingRelatedData] = useState(true);
  const [relatedDataError, setRelatedDataError] = useState(null);


  const columns = useMemo(() => [
    { id: 'descricao', name: 'Descrição', type: 'text' },
    { id: 'valor', name: 'Valor', type: 'number' },
    { id: 'data', name: 'Data', type: 'date' },
    { id: 'tipo', name: 'Tipo', type: 'select', options: [{ value: 'income', label: 'Receita' }, { value: 'expense', label: 'Despesa' }] },
    { id: 'conta_id', name: 'Conta', type: 'select', options: accountsList, optionValue: 'id', optionLabel: 'nome' },
    { id: 'categoria_id', name: 'Categoria', type: 'select', options: categoriesList, optionValue: 'id', optionLabel: 'nome' },
    { id: 'observacoes', name: 'Observações', type: 'text' },
    { id: 'data_vencimento', name: 'Data Vencimento', type: 'date' },
    { id: 'entidade', name: 'Entidade', type: 'text' },
    { id: 'data_pagamento_recebimento', name: 'Data Pagamento/Recebimento', type: 'date' },
    { id: 'parcelado', name: 'Parcelado', type: 'boolean' },
    { id: 'numero_parcela', name: 'Número Parcela', type: 'number' },
    { id: 'total_parcelas', name: 'Total Parcelas', type: 'number' },
    { id: 'id_transacao_pai', name: 'ID Transação Pai', type: 'number' },
    { id: 'status', name: 'Status', type: 'text' },
  ], [accountsList, categoriesList]);

  const [editingCell, setEditingCell] = useState({ rowIndex: null, colId: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [filterMonth, setFilterMonth] = useState('Todos');

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState(null);
  const [confirmDialogMessage, setConfirmDialogMessage] = useState('');
  const [confirmDialogData, setConfirmDialogData] = useState(null);

  const [columnFilterAnchorEl, setColumnFilterAnchorEl] = useState(null);
  const [currentFilteringColumnId, setCurrentFilteringColumnId] = useState(null);
  const [selectedColumnFilters, setSelectedColumnFilters] = useState({});

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

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

  const uniqueMonths = useMemo(() => {
    const months = new Set();
    transactionsData.forEach(row => {
      if (row.data) {
        const date = new Date(row.data);
        months.add(date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }));
      }
    });
    return ['Todos', ...Array.from(months).sort()];
  }, [transactionsData]);

  const uniqueValuesForCurrentColumn = useMemo(() => {
    if (!currentFilteringColumnId) return [];
    const values = new Set();
    const colDef = columns.find(col => col.id === currentFilteringColumnId);

    transactionsData.forEach(row => {
      if (colDef) {
        if (colDef.type === 'select') {
          const option = colDef.options.find(opt => {
            const optionMatchValue = colDef.optionValue ? opt[colDef.optionValue] : opt.value;
            return optionMatchValue === row[currentFilteringColumnId];
          });
          if (option) {
            values.add(colDef.optionLabel ? option[colDef.optionLabel] : option.label);
          }
        } else if (colDef.id === 'data' && row.data) {
          values.add(new Date(row.data).toLocaleDateString());
        } else if (colDef.type === 'boolean') {
          values.add(String(row[currentFilteringColumnId])); 
        }
        else {
          values.add(row[currentFilteringColumnId]);
        }
      }
    });
    return Array.from(values).sort();
  }, [transactionsData, currentFilteringColumnId, columns]);

  const fetchRelatedData = useCallback(async () => {
    setLoadingRelatedData(true);
    setRelatedDataError(null);
    try {
      const [accountsRes, categoriesRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/categories')
      ]);
      setAccountsList(accountsRes.data);
      setCategoriesList(categoriesRes.data);
    } catch (err) {
      console.error("Erro ao buscar dados relacionados (contas/categorias):", err);
      setRelatedDataError(err.response?.data || { message: "Erro ao carregar dados relacionados." });
      showSnackbar('Erro ao carregar contas e categorias.', 'error');
    } finally {
      setLoadingRelatedData(false);
    }
  }, [showSnackbar]);

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    setTransactionsError(null);
    try {
      const response = await api.get('/transactions');
      setTransactionsData(response.data.map(t => ({ ...t, isNew: false, isModified: false })));
    } catch (err) {
      console.error("Erro ao buscar transações:", err);
      setTransactionsError(err.response?.data || { message: "Erro ao carregar transações." });
      showSnackbar('Erro ao carregar transações.', 'error');
    } finally {
      setLoadingTransactions(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchRelatedData();
    fetchTransactions();
  }, [fetchRelatedData, fetchTransactions]);

  const filteredTransactionsData = useMemo(() => {
    let filteredData = transactionsData;

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filteredData = filteredData.filter(row =>
        columns.some(col => {
          const value = row[col.id];
          if (col.type === 'select') {
            const option = col.options.find(opt => {
              const optionMatchValue = col.optionValue ? opt[col.optionValue] : opt.value;
              return optionMatchValue === value;
            });
            return option && String(col.optionLabel ? option[col.optionLabel] : option.label).toLowerCase().includes(lowerCaseSearchTerm);
          } else if (col.id === 'data' && row.data) {
            return new Date(row.data).toLocaleDateString().toLowerCase().includes(lowerCaseSearchTerm);
          } else if (col.type === 'boolean') {
            return String(value).toLowerCase().includes(lowerCaseSearchTerm);
          }
          return String(value || '').toLowerCase().includes(lowerCaseSearchTerm);
        })
      );
    }

    if (filterType !== 'Todos') {
      filteredData = filteredData.filter(row => row.tipo === filterType);
    }

    if (filterMonth !== 'Todos') {
      filteredData = filteredData.filter(row => {
        if (!row.data) return false;
        const date = new Date(row.data);
        return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }) === filterMonth;
      });
    }

    Object.entries(selectedColumnFilters).forEach(([colId, selectedValues]) => {
      if (selectedValues && selectedValues.length > 0) {
        const colDef = columns.find(col => col.id === colId);
        if (colDef && colDef.type === 'select') {
          filteredData = filteredData.filter(row => {
            const option = colDef.options.find(opt => {
              const optionMatchValue = colDef.optionValue ? opt[colDef.optionValue] : opt.value;
              return optionMatchValue === row[colId];
            });
            return option && selectedValues.includes(colDef.optionLabel ? option[colDef.optionLabel] : option.label);
          });
        } else if (colDef.id === 'data') {
          filteredData = filteredData.filter(row => {
            if (!row.data) return false;
            return selectedValues.includes(new Date(row.data).toLocaleDateString());
          });
        } else if (colDef.type === 'boolean') {
          filteredData = filteredData.filter(row => selectedValues.includes(String(row[colId])));
        }
        else {
          filteredData = filteredData.filter(row => selectedValues.includes(row[colId]));
        }
      }
    });

    return filteredData;
  }, [transactionsData, searchTerm, filterType, filterMonth, selectedColumnFilters, columns]);



  const handleCellClick = (rowIndex, colId) => {
    setEditingCell({ rowIndex, colId });
  };

  const handleCellChange = (e, rowIndex, colId) => {
    let newValue = e.target.value;
    const colDef = columns.find(col => col.id === colId);

    setTransactionsData(prevData =>
      prevData.map((row, rIdx) => {
        if (rIdx === rowIndex) {
          const updatedRow = { ...row, isModified: true };

          if (colId === 'valor' || colId === 'preco_estimado' || colId === 'preco_real' || colId === 'meta_valor') {
            updatedRow[colId] = newValue.replace(',', '.');
            if (isNaN(parseFloat(updatedRow[colId]))) {
                updatedRow[colId] = '0.00';
            }
          } else if (colDef.type === 'number') {
            updatedRow[colId] = parseInt(newValue, 10) || 0;
          }
          else if (colDef.type === 'boolean') {
            updatedRow[colId] = e.target.checked;
          }
          else if (colDef.type === 'select') {
            let parsedValue = newValue;
            if (colDef.optionValue === 'id') { // Se for um ID, tenta converter para int
                parsedValue = parseInt(newValue, 10);
                if (isNaN(parsedValue)) {
                    // Fallback para o primeiro ID válido se o valor for inválido
                    if (colDef.options.length > 0) {
                        parsedValue = colDef.options[0][colDef.optionValue];
                    } else {
                        parsedValue = null;
                    }
                }
            }
            updatedRow[colId] = parsedValue;
          }
          else {
            updatedRow[colId] = newValue;
          }
          return updatedRow;
        }
        return row;
      })
    );
  };

  const handleCellBlur = () => {
    setEditingCell({ rowIndex: null, colId: null });
  };

  const confirmAddTransaction = () => {
    // NOVO: Verifica se há contas e categorias antes de adicionar uma transação
    if (accountsList.length === 0) {
      showSnackbar('Você precisa ter pelo menos uma conta cadastrada para adicionar transações.', 'warning');
      return;
    }
    if (categoriesList.length === 0) {
      showSnackbar('Você precisa ter pelo menos uma categoria cadastrada para adicionar transações.', 'warning');
      return;
    }

    setConfirmDialogAction('addTransaction');
    setConfirmDialogMessage('Tem certeza que deseja adicionar uma nova transação?');
    setConfirmDialogData(null);
    setIsConfirmDialogOpen(true);
  };

  const confirmDeleteTransaction = (transactionId) => {
    setConfirmDialogAction('deleteTransaction');
    setConfirmDialogMessage('Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.');
    setConfirmDialogData(transactionId);
    setIsConfirmDialogOpen(true);
  };

  const confirmSaveChanges = () => {
    setConfirmDialogAction('saveChanges');
    setConfirmDialogMessage('Tem certeza que deseja salvar as alterações nas transações?');
    setConfirmDialogData(null);
    setIsConfirmDialogOpen(true);
  };

  const executeConfirmedAction = async () => {
    setIsConfirmDialogOpen(false);

    switch (confirmDialogAction) {
      case 'addTransaction':
        const newTempId = `new_${Date.now()}`;
        const emptyTransaction = {
          id: newTempId,
          descricao: '',
          valor: '0.00',
          data: new Date().toISOString().split('T')[0],
          tipo: 'expense',
          conta_id: accountsList.length > 0 ? accountsList[0].id : null,
          categoria_id: categoriesList.length > 0 ? categoriesList[0].id : null,
          observacoes: '',
          data_vencimento: null,
          entidade: '',
          data_pagamento_recebimento: null,
          parcelado: false,
          numero_parcela: null,
          total_parcelas: null,
          id_transacao_pai: null,
          status: '',
          isNew: true,
          isModified: true,
        };
        setTransactionsData(prevData => [...prevData, emptyTransaction]);
        showSnackbar('Nova transação adicionada à planilha. Lembre-se de salvar!', 'info');
        break;

      case 'deleteTransaction':
        const idToDelete = confirmDialogData;
        try {
          if (typeof idToDelete === 'number') { // Se for um ID numérico, é uma transação existente
            await api.delete(`/transactions/${idToDelete}`);
            showSnackbar('Transação excluída com sucesso do banco de dados!', 'success');
          } else { // Se for um ID temporário (string), é uma nova transação não salva
            showSnackbar('Nova transação removida da planilha.', 'info');
          }
          setTransactionsData(prevData => prevData.filter(t => t.id !== idToDelete));
        } catch (err) {
          console.error("Erro ao excluir transação:", err);
          showSnackbar(`Erro ao excluir transação: ${err.response?.data?.message || 'Erro desconhecido'}`, 'error');
        }
        break;

      case 'saveChanges':
        const transactionsToSave = transactionsData.filter(t => t.isModified);
        if (transactionsToSave.length === 0) {
          showSnackbar('Nenhuma alteração para salvar.', 'info');
          return;
        }

        setLoadingTransactions(true);
        let successCount = 0;
        let errorCount = 0;

        for (const transaction of transactionsToSave) {
          const payload = {
            descricao: transaction.descricao,
            valor: String(transaction.valor),
            data: transaction.data,
            tipo: transaction.tipo,
            conta_id: transaction.conta_id,
            categoria_id: transaction.categoria_id,
            observacoes: transaction.observacoes,
            data_vencimento: transaction.data_vencimento,
            entidade: transaction.entidade,
            data_pagamento_recebimento: transaction.data_pagamento_recebimento,
            parcelado: transaction.parcelado,
            numero_parcela: transaction.numero_parcela,
            total_parcelas: transaction.total_parcelas,
            id_transacao_pai: transaction.id_transacao_pai,
            status: transaction.status,
          };

          if (!payload.conta_id || !payload.categoria_id) {
            showSnackbar(`Erro: Transação "${payload.descricao}" não pode ser salva. Conta ou Categoria não selecionada.`, 'error');
            errorCount++;
            continue;
          }

          try {
            if (transaction.isNew) {
              await api.post('/transactions', payload);
              successCount++;
            } else {
              await api.put(`/transactions/${transaction.id}`, payload);
              successCount++;
            }
          } catch (err) {
            console.error(`Erro ao salvar transação ${transaction.id || transaction.descricao}:`, err);
            const errorMessage = err.response?.data?.message || err.message || 'Erro desconhecido';
            showSnackbar(`Erro ao salvar transação ${transaction.descricao}: ${errorMessage}`, 'error');
            errorCount++;
          }
        }

        if (successCount > 0) {
          showSnackbar(`${successCount} transação(ões) salva(s) com sucesso!`, 'success');
        }
        if (errorCount > 0) {
          showSnackbar(`${errorCount} transação(ões) falhou(ram) ao salvar.`, 'error');
        }

        fetchTransactions(); // Recarrega todas as transações para atualizar o estado
        break;

      case 'importTransactions':
        // Lógica de importação (chamará handleImportTransactions)
        handleImportTransactions(confirmDialogData);
        break;

      default:
        console.warn('Nenhuma ação de confirmação definida.');
    }
    setConfirmDialogAction(null);
    setConfirmDialogData(null);
  };

  const handleCancelConfirmation = () => {
    setIsConfirmDialogOpen(false);
    setConfirmDialogAction(null);
    setConfirmDialogData(null);
  };

  // --- Funções para o Filtro de Coluna ---
  const handleColumnFilterClick = (event, columnId) => {
    setColumnFilterAnchorEl(event.currentTarget);
    setCurrentFilteringColumnId(columnId);
    if (!selectedColumnFilters[columnId]) {
      const colDef = columns.find(col => col.id === columnId);
      let allUniqueValues = [];
      if (colDef && colDef.type === 'select') {
        allUniqueValues = colDef.options.map(opt => colDef.optionLabel ? opt[colDef.optionLabel] : opt.label);
      } else if (colDef.id === 'data') {
        allUniqueValues = Array.from(new Set(transactionsData.map(row => row.data ? new Date(row.data).toLocaleDateString() : '')));
      } else if (colDef.type === 'boolean') {
        allUniqueValues = ['true', 'false'];
      }
      else {
        allUniqueValues = Array.from(new Set(transactionsData.map(row => row[columnId])));
      }
      setSelectedColumnFilters(prev => ({
        ...prev,
        [columnId]: allUniqueValues,
      }));
    }
  };

  const handleCloseColumnFilter = () => {
    setColumnFilterAnchorEl(null);
    setCurrentFilteringColumnId(null);
  };

  const handleColumnFilterChange = (event, value) => {
    setSelectedColumnFilters(prev => {
      const currentSelected = prev[currentFilteringColumnId] || [];
      let newSelected;
      if (event.target.checked) {
        newSelected = [...currentSelected, value];
      } else {
        newSelected = currentSelected.filter(item => item !== value);
      }
      return {
        ...prev,
        [currentFilteringColumnId]: newSelected,
      };
    });
  };

  const handleSelectAllColumnFilter = () => {
    const colDef = columns.find(col => col.id === currentFilteringColumnId);
    let allUnique = [];
    if (colDef && colDef.type === 'select') {
      allUnique = colDef.options.map(opt => colDef.optionLabel ? opt[colDef.optionLabel] : opt.label);
    } else if (colDef.id === 'data') {
      allUnique = Array.from(new Set(transactionsData.map(row => row.data ? new Date(row.data).toLocaleDateString() : '')));
    } else if (colDef.type === 'boolean') {
      allUnique = ['true', 'false'];
    }
    else {
      allUnique = Array.from(new Set(transactionsData.map(row => row[currentFilteringColumnId])));
    }
    setSelectedColumnFilters(prev => ({
      ...prev,
      [currentFilteringColumnId]: allUnique,
    }));
  };

  const handleClearAllColumnFilter = () => {
    setSelectedColumnFilters(prev => ({
      ...prev,
      [currentFilteringColumnId]: [],
    }));
  };

  // --- Funções de Importação ---
  const handleOpenImportModal = () => {
    setSelectedFile(null);
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setSelectedFile(null);
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleImportSubmit = () => {
    if (!selectedFile) {
      showSnackbar('Por favor, selecione um arquivo CSV para importar.', 'warning');
      return;
    }

    setImportLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target.result;
      try {
        // Usando PapaParse para analisar o CSV
        const { data, errors } = Papa.parse(text, {
          header: true, // Assume que a primeira linha é o cabeçalho
          skipEmptyLines: true,
          dynamicTyping: false, // Manter como string para manipulação
        });

        if (errors.length > 0) {
          console.error("Erros ao analisar CSV:", errors);
          showSnackbar('Erro ao analisar o arquivo CSV. Verifique o formato.', 'error');
          setImportLoading(false);
          return;
        }

        let importedCount = 0;
        let importErrors = 0;

        for (const row of data) {
          // Mapeamento dos nomes das colunas do CSV para os nomes do backend
          const transactionPayload = {
            descricao: row['Descrição'] || '',
            valor: String(row['Valor'] || '0').replace(',', '.'), // Garante formato de ponto
            data: row['Data (YYYY-MM-DD)'] || new Date().toISOString().split('T')[0],
            tipo: row['Tipo (income/expense)'] || 'expense', // Default para despesa
            observacoes: row['Observações'] || '',
            data_vencimento: row['Data de Vencimento (YYYY-MM-DD)'] || null,
            entidade: row['Entidade'] || '',
            data_pagamento_recebimento: row['Data de Pagamento/Recebimento (YYYY-MM-DD)'] || null,
            parcelado: (row['Parcelado (TRUE/FALSE)'] || 'FALSE').toUpperCase() === 'TRUE',
            numero_parcela: parseInt(row['Número da Parcela'], 10) || null,
            total_parcelas: parseInt(row['Total de Parcelas'], 10) || null,
            id_transacao_pai: parseInt(row['ID Transação Pai'], 10) || null,
            status: row['Status'] || '',
          };

          // Mapear nome da conta/categoria para ID
          const accountName = row['Nome da Conta'];
          const categoryName = row['Nome da Categoria'];

          const account = accountsList.find(acc => acc.nome === accountName);
          const category = categoriesList.find(cat => cat.nome === categoryName);

          if (account) {
            transactionPayload.conta_id = account.id;
          } else {
            showSnackbar(`Erro de importação: Conta "${accountName}" não encontrada para a transação "${transactionPayload.descricao}".`, 'error');
            importErrors++;
            continue;
          }

          if (category) {
            transactionPayload.categoria_id = category.id;
          } else {
            showSnackbar(`Erro de importação: Categoria "${categoryName}" não encontrada para a transação "${transactionPayload.descricao}".`, 'error');
            importErrors++;
            continue;
          }

          try {
            await api.post('/transactions', transactionPayload);
            importedCount++;
          } catch (apiErr) {
            console.error(`Erro ao importar transação: ${transactionPayload.descricao}`, apiErr);
            showSnackbar(`Falha ao importar "${transactionPayload.descricao}": ${apiErr.response?.data?.message || 'Erro desconhecido'}`, 'error');
            importErrors++;
          }
        }

        if (importedCount > 0) {
          showSnackbar(`Importação concluída: ${importedCount} transações adicionadas.`, 'success');
          fetchTransactions(); // Recarrega as transações após a importação
        }
        if (importErrors > 0) {
          showSnackbar(`Atenção: ${importErrors} transações tiveram erros durante a importação.`, 'warning');
        }
        if (importedCount === 0 && importErrors === 0) {
          showSnackbar('Nenhuma transação válida encontrada no arquivo para importação.', 'info');
        }

      } catch (parseError) {
        console.error("Erro ao processar o arquivo CSV:", parseError);
        showSnackbar('Erro ao processar o arquivo CSV. Verifique o console para detalhes.', 'error');
      } finally {
        setImportLoading(false);
        handleCloseImportModal();
      }
    };

    reader.readAsText(selectedFile);
  };

  // --- Funções de Exportação ---
  const handleExportTransactions = useCallback(() => {
    if (transactionsData.length === 0) {
      showSnackbar('Não há transações para exportar.', 'info');
      return;
    }

    const headers = [
      'ID', 'Descrição', 'Valor', 'Data', 'Tipo', 'Conta', 'Categoria', 'Observações',
      'Data Vencimento', 'Entidade', 'Data Pagamento/Recebimento', 'Parcelado',
      'Número Parcela', 'Total Parcelas', 'ID Transação Pai', 'Status', 'Criado Em', 'Atualizado Em'
    ];

    const dataToExport = transactionsData.map(t => {
      const accountName = accountsList.find(acc => acc.id === t.conta_id)?.nome || 'N/A';
      const categoryName = categoriesList.find(cat => cat.id === t.categoria_id)?.nome || 'N/A';

      return {
        ID: t.id,
        Descrição: t.descricao,
        Valor: currencyFormatter.format(t.valor).replace('R$', '').trim(), // Remove R$ para facilitar re-import
        Data: t.data ? new Date(t.data).toLocaleDateString('pt-BR') : '',
        Tipo: t.tipo,
        Conta: accountName,
        Categoria: categoryName,
        Observações: t.observacoes || '',
        'Data Vencimento': t.data_vencimento ? new Date(t.data_vencimento).toLocaleDateString('pt-BR') : '',
        Entidade: t.entidade || '',
        'Data Pagamento/Recebimento': t.data_pagamento_recebimento ? new Date(t.data_pagamento_recebimento).toLocaleDateString('pt-BR') : '',
        Parcelado: t.parcelado ? 'TRUE' : 'FALSE',
        'Número Parcela': t.numero_parcela || '',
        'Total Parcelas': t.total_parcelas || '',
        'ID Transação Pai': t.id_transacao_pai || '',
        Status: t.status || '',
        'Criado Em': t.created_at ? new Date(t.created_at).toLocaleString('pt-BR') : '',
        'Atualizado Em': t.updated_at ? new Date(t.updated_at).toLocaleString('pt-BR') : '',
      };
    });

    // Usando PapaParse para converter JSON para CSV
    const csv = Papa.unparse({
      fields: headers,
      data: dataToExport,
    }, {
      quotes: true, // Adiciona aspas em torno dos campos, útil para campos com vírgulas
      delimiter: ',',
      header: true,
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `transacoes_exportadas_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSnackbar('Transações exportadas com sucesso!', 'success');
    } else {
      showSnackbar('Seu navegador não suporta download de arquivos diretamente.', 'warning');
    }
  }, [transactionsData, accountsList, categoriesList, currencyFormatter, showSnackbar]);

  // --- Função para Download de Modelo de Transação ---
  const handleDownloadTemplate = useCallback(() => {
    const templateHeaders = [
      'Descrição', 'Valor', 'Data (YYYY-MM-DD)', 'Tipo (income/expense)', 'Nome da Conta', 'Nome da Categoria', 'Observações',
      'Data de Vencimento (YYYY-MM-DD)', 'Entidade', 'Data de Pagamento/Recebimento (YYYY-MM-DD)', 'Parcelado (TRUE/FALSE)',
      'Número da Parcela', 'Total de Parcelas', 'ID Transação Pai', 'Status'
    ];

    const csv = Papa.unparse({
      fields: templateHeaders,
      data: [{}], // Linha vazia para o modelo
    }, {
      quotes: true,
      delimiter: ',',
      header: true,
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `modelo_transacao_${format(new Date(), 'yyyyMMdd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSnackbar('Modelo de transação baixado com sucesso!', 'success');
    } else {
      showSnackbar('Seu navegador não suporta download de arquivos diretamente.', 'warning');
    }
  }, [showSnackbar]);


  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        color: theme.palette.text.primary,
        transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CssBaseline />
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="voltar" onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBackIcon sx={{ color: theme.palette.text.secondary }} />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: theme.palette.primary.main, fontWeight: 'bold' }}>
            Minhas Planilhas
          </Typography>
          <IconButton onClick={toggleColorMode} color="inherit" sx={{ color: theme.palette.text.secondary }}>
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />} sx={{ color: theme.palette.text.secondary }}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {/* NOVO: Componente QuickActionsCard (ajustado para o contexto da planilha) */}
        <Grid item xs={12} sx={{ mb: theme.spacing(3) }}>
          <QuickActionsCard
            onNewTransactionClick={confirmAddTransaction}
            onNewAccountClick={() => showSnackbar('Funcionalidade "Nova Conta" na Planilha em desenvolvimento!', 'info')}
            onViewCategoriesClick={() => showSnackbar('Funcionalidade "Ver Categorias" na Planilha em desenvolvimento!', 'info')}
            onViewTransactionsClick={() => showSnackbar('Funcionalidade "Ver Transações" na Planilha em desenvolvimento!', 'info')}
            onViewAccountsClick={() => showSnackbar('Funcionalidade "Ver Contas" na Planilha em desenvolvimento!', 'info')}
            onSheetsOptionsClick={() => showSnackbar('Você já está na página de Planilhas!', 'info')}
          />
        </Grid>

        {/* Seção da Planilha */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
            Minha Planilha de Transações
          </Typography>

          {/* Controles de Busca e Filtro */}
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Buscar na Planilha"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: '200px' }}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="filter-type-label" size="small">Tipo</InputLabel>
              <Select
                labelId="filter-type-label"
                id="filter-type-select"
                value={filterType}
                label="Tipo"
                onChange={(e) => setFilterType(e.target.value)}
                size="small"
              >
                <MenuItem value="Todos">Todos</MenuItem>
                <MenuItem value="income">Receita</MenuItem>
                <MenuItem value="expense">Despesa</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="filter-month-label" size="small">Mês</InputLabel>
              <Select
                labelId="filter-month-label"
                id="filter-month-select"
                value={filterMonth}
                label="Mês"
                onChange={(e) => setFilterMonth(e.target.value)}
                size="small"
              >
                {uniqueMonths.map(month => (
                  <MenuItem key={month} value={month}>{month}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {loadingTransactions || loadingRelatedData ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <CircularProgress size={40} />
              <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                Carregando dados da planilha...
              </Typography>
            </Box>
          ) : transactionsError || relatedDataError ? (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              Erro ao carregar dados: {transactionsError?.message || relatedDataError?.message || 'Erro desconhecido'}
            </Alert>
          ) : (
            <Paper elevation={6} sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: theme.shadows[8] }}>
              <TableContainer sx={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
                <Table stickyHeader aria-label="planilha de dados" sx={{ minWidth: 700 }}>
                  <TableHead>
                    <TableRow>
                      {/* Coluna para ações de linha */}
                      <TableCell sx={{ backgroundColor: theme.palette.primary.dark, color: 'white', fontWeight: 'bold', minWidth: '80px' }}>Ações</TableCell>
                      {columns.map((column) => (
                        <TableCell
                          key={column.id}
                          sx={{
                            backgroundColor: theme.palette.primary.dark,
                            color: 'white',
                            fontWeight: 'bold',
                            minWidth: '120px',
                            borderLeft: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {column.name}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(event) => handleColumnFilterClick(event, column.id)}
                              sx={{ color: 'white' }}
                            >
                              <FilterListIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTransactionsData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1} sx={{ textAlign: 'center', py: 3 }}>
                          <Typography variant="body1" color="text.secondary">
                            Nenhum dado encontrado com os filtros aplicados.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactionsData.map((row, rowIndex) => (
                        <TableRow key={row.id || `new-${rowIndex}`} hover>
                          {/* Célula de ações da linha */}
                          <TableCell sx={{ borderRight: `1px solid ${theme.palette.divider}` }}>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => confirmDeleteTransaction(row.id)}
                              sx={{ borderColor: theme.palette.error.main, color: theme.palette.error.main }}
                            >
                              Excluir
                            </Button>
                          </TableCell>
                          {columns.map((colDef) => (
                            <TableCell
                              key={colDef.id}
                              onClick={() => handleCellClick(rowIndex, colDef.id)}
                              sx={{
                                borderLeft: `1px solid ${theme.palette.divider}`,
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: theme.palette.action.hover,
                                },
                              }}
                            >
                              {editingCell.rowIndex === rowIndex && editingCell.colId === colDef.id ? (
                                colDef.type === 'select' ? (
                                  <FormControl fullWidth size="small" variant="standard">
                                    <Select
                                      value={row[colDef.id] === null && colDef.options.length > 0
                                        ? colDef.options[0][colDef.optionValue]
                                        : row[colDef.id] || ''}
                                      onChange={(e) => handleCellChange(e, rowIndex, colDef.id)}
                                      onBlur={handleCellBlur}
                                      autoFocus
                                      sx={{
                                        '& .MuiSelect-select': {
                                          padding: '4px 0',
                                        },
                                      }}
                                    >
                                      {colDef.options.map(option => (
                                        <MenuItem key={option.value || option[colDef.optionValue]} value={option.value || option[colDef.optionValue]}>
                                          {option.label || option[colDef.optionLabel]}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                ) : colDef.type === 'boolean' ? (
                                  <Checkbox
                                    checked={Boolean(row[colDef.id])}
                                    onChange={(e) => handleCellChange(e, rowIndex, colDef.id)}
                                    onBlur={handleCellBlur}
                                    autoFocus
                                    size="small"
                                  />
                                ) : (
                                  <TextField
                                    value={row[colDef.id] === null ? '' : row[colDef.id]}
                                    onChange={(e) => handleCellChange(e, rowIndex, colDef.id)}
                                    onBlur={handleCellBlur}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.target.blur();
                                      }
                                    }}
                                    autoFocus
                                    variant="standard"
                                    fullWidth
                                    size="small"
                                    type={colDef.type}
                                    inputProps={colDef.type === 'number' ? { step: "0.01" } : {}}
                                    sx={{
                                      '& .MuiInputBase-input': {
                                        padding: '4px 0',
                                      },
                                    }}
                                  />
                                )
                              ) : (
                                <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                                  {colDef.id === 'valor' || colDef.id === 'preco_estimado' || colDef.id === 'preco_real' || colDef.id === 'meta_valor'
                                    ? currencyFormatter.format(row[colDef.id])
                                    : colDef.type === 'date'
                                      ? row[colDef.id] ? new Date(row[colDef.id]).toLocaleDateString() : ''
                                      : colDef.type === 'select'
                                        ? (() => {
                                            const selectedOption = colDef.options.find(opt => {
                                              const optionMatchValue = colDef.optionValue ? opt[colDef.optionValue] : opt.value;
                                              return optionMatchValue === row[colDef.id];
                                            });
                                            return selectedOption ? (colDef.optionLabel ? selectedOption[colDef.optionLabel] : selectedOption.label) : 'N/A';
                                          })()
                                        : colDef.type === 'boolean'
                                          ? (row[colDef.id] ? 'Sim' : 'Não')
                                          : row[colDef.id]}
                                </Typography>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={confirmAddTransaction}
              startIcon={<AddIcon />}
              sx={{ borderRadius: '8px', boxShadow: theme.shadows[4] }}
            >
              Adicionar Transação
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={confirmSaveChanges}
              startIcon={<SaveIcon />}
              sx={{ borderRadius: '8px', boxShadow: theme.shadows[4]} }
            >
              Salvar Alterações
            </Button>
            <Button
              variant="outlined"
              color="info"
              onClick={handleOpenImportModal}
              startIcon={<UploadFileIcon />}
              sx={{ borderRadius: '8px', boxShadow: theme.shadows[4]} }
            >
              Importar CSV
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleExportTransactions}
              startIcon={<DownloadIcon />}
              sx={{ borderRadius: '8px', boxShadow: theme.shadows[4]} }
            >
              Exportar CSV
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleDownloadTemplate}
              startIcon={<DownloadIcon />}
              sx={{ borderRadius: '8px', boxShadow: theme.shadows[4]} }
            >
              Baixar Modelo CSV
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Modal de Confirmação Estilizado */}
      <Dialog
        open={isConfirmDialogOpen}
        onClose={handleCancelConfirmation}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
            width: { xs: '95%', sm: '400px' },
            maxWidth: 'unset',
            p: { xs: 1, sm: 2 },
          },
        }}
      >
        <DialogTitle sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
          Confirmação
        </DialogTitle>
        <DialogContent>
          <Typography>{confirmDialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelConfirmation}
            color="error"
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={executeConfirmedAction}
            color="primary"
            variant="contained"
            autoFocus
            sx={{ borderRadius: '8px' }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Popover de Filtro de Coluna */}
      <Popover
        open={Boolean(columnFilterAnchorEl)}
        anchorEl={columnFilterAnchorEl}
        onClose={handleCloseColumnFilter}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: '8px',
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[4],
            p: 2,
            minWidth: '150px',
            maxHeight: '300px',
            overflowY: 'auto',
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
          Filtrar por {columns.find(col => col.id === currentFilteringColumnId)?.name}
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedColumnFilters[currentFilteringColumnId]?.length === uniqueValuesForCurrentColumn.length}
                indeterminate={
                  selectedColumnFilters[currentFilteringColumnId]?.length > 0 &&
                  selectedColumnFilters[currentFilteringColumnId]?.length < uniqueValuesForCurrentColumn.length
                }
                onChange={handleSelectAllColumnFilter}
                sx={{ color: theme.palette.primary.main }}
              />
            }
            label={<Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>Selecionar Tudo</Typography>}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedColumnFilters[currentFilteringColumnId]?.length === 0}
                onChange={handleClearAllColumnFilter}
                sx={{ color: theme.palette.primary.main }}
              />
            }
            label={<Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>Limpar Tudo</Typography>}
          />
          <Divider sx={{ my: 1 }} />

          {uniqueValuesForCurrentColumn.map(value => (
            <FormControlLabel
              key={value}
              control={
                <Checkbox
                  checked={selectedColumnFilters[currentFilteringColumnId]?.includes(value)}
                  onChange={(e) => handleColumnFilterChange(e, value)}
                  sx={{ color: theme.palette.primary.main }}
                />
              }
              label={<Typography variant="body2" sx={{ color: theme.palette.text.primary }}>{value}</Typography>}
            />
          ))}
        </FormGroup>
      </Popover>

      {/* NOVO: Modal de Importação de CSV */}
      <Dialog
        open={isImportModalOpen}
        onClose={handleCloseImportModal}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
            width: { xs: '95%', sm: '450px' },
            maxWidth: 'unset',
            p: { xs: 1, sm: 2 },
          },
        }}
      >
        <DialogTitle sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
          Importar Transações CSV
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Selecione um arquivo CSV para importar suas transações.
            Certifique-se de que o arquivo segue o modelo fornecido.
          </Typography>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'block', marginBottom: theme.spacing(2) }}
          />
          {importLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">Importando...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseImportModal}
            color="error"
            variant="outlined"
            sx={{ borderRadius: '8px' }}
            disabled={importLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImportSubmit}
            color="primary"
            variant="contained"
            autoFocus
            sx={{ borderRadius: '8px' }}
            disabled={!selectedFile || importLoading}
          >
            Importar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensagens de feedback */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Sheets;
