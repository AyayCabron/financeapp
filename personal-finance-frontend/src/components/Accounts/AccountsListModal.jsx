// src/components/Accounts/AccountsListModal.jsx
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
  useTheme, // Adicionar useTheme para estilos MUI
} from '@mui/material';

// Ícones
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'; // Ícone para conta

import api from '../../api/axios'; // Certifique-se de que o caminho está correto

function AccountsListModal({ open, onClose, onAccountAdded, onAccountUpdated, onDeleteAccount, onEditAccount }) {
  const theme = useTheme();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }), []);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (err) {
      console.error("Erro ao buscar contas:", err);
      setError(err.response?.data || { message: "Erro ao carregar contas." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchAccounts();
    }
  }, [open, fetchAccounts]);

  const filteredAccounts = useMemo(() => {
    if (!searchTerm) {
      return accounts;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return accounts.filter(account =>
      account.nome.toLowerCase().includes(lowerCaseSearchTerm) ||
      account.tipo.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [accounts, searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEdit = useCallback((account) => {
    onEditAccount(account); // Chama a função passada pelo Dashboard
    onClose(); // Fecha o modal de lista
  }, [onEditAccount, onClose]);

  const handleDelete = useCallback((accountId) => {
    onDeleteAccount(accountId); // Chama a função passada pelo Dashboard
    // O Dashboard irá recarregar as contas após a exclusão
  }, [onDeleteAccount]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
          p: { xs: 2, sm: 3 },
          boxShadow: theme.shadows[8],
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h5" component="span" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
          Todas as Contas
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
        <TextField
          label="Buscar Contas"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Carregando contas...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            Erro ao carregar contas: {error.message?.message || error.message || 'Erro desconhecido'}
          </Alert>
        ) : filteredAccounts.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Nenhuma conta encontrada.
          </Typography>
        ) : (
          <List>
            {filteredAccounts.map((account) => (
              <React.Fragment key={account.id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton edge="end" aria-label="editar conta" onClick={() => handleEdit(account)}>
                        <EditIcon sx={{ color: theme.palette.text.secondary }} />
                      </IconButton>
                      <IconButton edge="end" aria-label="excluir conta" onClick={() => handleDelete(account.id)}>
                        <DeleteIcon sx={{ color: theme.palette.error.main }} />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <AccountBalanceWalletIcon sx={{ color: theme.palette.primary.main }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body1" fontWeight="bold">{account.nome}</Typography>}
                    secondary={<Typography variant="body2" color="text.secondary">{currencyFormatter.format(account.saldo_atual)} ({account.tipo})</Typography>}
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

AccountsListModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAccountAdded: PropTypes.func,
  onAccountUpdated: PropTypes.func,
  onDeleteAccount: PropTypes.func.isRequired, // Função para deletar
  onEditAccount: PropTypes.func.isRequired,   // Função para editar
};

export default AccountsListModal;