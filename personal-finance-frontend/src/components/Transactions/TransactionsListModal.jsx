// src/components/Transactions/TransactionsListModal.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar, // <-- Adicionar esta importação
  Divider,
  Box,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme, // Adicionar useTheme para estilos MUI
} from '@mui/material';

// Ícones
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; // Ícone para transação
import CategoryIcon from '@mui/icons-material/Category'; // Ícone para categoria
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'; // Ícone para conta

import api from '../../api/axios'; // Certifique-se de que o caminho está correto

function TransactionsListModal({ open, onClose, onTransactionAdded, onTransactionUpdated, onDeleteTransaction, onEditTransaction }) {
  const theme = useTheme();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }), []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (err) {
      console.error("Erro ao buscar transações:", err);
      setError(err.response?.data || { message: "Erro ao carregar transações." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchTransactions();
    }
  }, [open, fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.tipo === filterType);
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        transaction =>
          transaction.descricao.toLowerCase().includes(lowerCaseSearchTerm) ||
          transaction.categoria?.nome.toLowerCase().includes(lowerCaseSearchTerm) ||
          transaction.conta?.nome.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    return filtered;
  }, [transactions, filterType, searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterTypeChange = (event) => {
    setFilterType(event.target.value);
  };

  const handleEdit = useCallback((transaction) => {
    onEditTransaction(transaction); // Chama a função passada pelo Dashboard
    onClose(); // Fecha o modal de lista
  }, [onEditTransaction, onClose]);

  const handleDelete = useCallback((transactionId) => {
    onDeleteTransaction(transactionId); // Chama a função passada pelo Dashboard
    // O Dashboard irá recarregar as transações após a exclusão
  }, [onDeleteTransaction]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
          p: { xs: 2, sm: 3 },
          boxShadow: theme.shadows[8],
          height: '90vh', // Para dar um scroll interno se necessário
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h5" component="span" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
          Todas as Transações
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: theme.palette.text.secondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ flexGrow: 1, pt: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            label="Buscar Transações"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            fullWidth
            size="small"
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: { xs: '100%', sm: 150 } }} size="small">
            <InputLabel id="filter-type-label">Tipo</InputLabel>
            <Select
              labelId="filter-type-label"
              value={filterType}
              label="Tipo"
              onChange={handleFilterTypeChange}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="income">Receita</MenuItem>
              <MenuItem value="expense">Despesa</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Carregando transações...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            Erro ao carregar transações: {error.message?.message || error.message || 'Erro desconhecido'}
          </Alert>
        ) : filteredTransactions.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Nenhuma transação encontrada.
          </Typography>
        ) : (
          <List>
            {filteredTransactions.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton edge="end" aria-label="editar transação" onClick={() => handleEdit(transaction)}>
                        <EditIcon sx={{ color: theme.palette.text.secondary }} />
                      </IconButton>
                      <IconButton edge="end" aria-label="excluir transação" onClick={() => handleDelete(transaction.id)}>
                        <DeleteIcon sx={{ color: theme.palette.error.main }} />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    {transaction.tipo === 'income' ? (
                      <AttachMoneyIcon sx={{ color: theme.palette.success.main }} />
                    ) : (
                      <AttachMoneyIcon sx={{ color: theme.palette.error.main }} />
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body1" fontWeight="bold">{transaction.descricao}</Typography>}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {currencyFormatter.format(transaction.valor)} - {transaction.data_transacao}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Conta: {transaction.conta?.nome || 'N/A'} | Categoria: {transaction.categoria?.nome || 'N/A'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, justifyContent: 'center' }}>
        <Button onClick={onClose} variant="outlined" sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.text.secondary }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

TransactionsListModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onTransactionAdded: PropTypes.func, // Para quando uma transação for adicionada/editada no modal
  onTransactionUpdated: PropTypes.func,
  onDeleteTransaction: PropTypes.func.isRequired, // Função para deletar
  onEditTransaction: PropTypes.func.isRequired,   // Função para editar
};

export default TransactionsListModal;