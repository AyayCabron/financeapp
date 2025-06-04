// src/components/Accounts/AccountList.jsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const AccountList = forwardRef(({ onEditAccount }, ref) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const theme = useTheme();

  // Função para traduzir o tipo da conta
  const traduzirTipoConta = (tipo) => {
    switch (tipo) {
      case 'Savings':
        return 'Poupança';
      case 'Checking':
        return 'Corrente';
      default:
        return tipo;
    }
  };

  const fetchAccounts = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (err) {
      console.error("Erro ao buscar contas:", err.response?.data || err.message);
      setError("Falha ao carregar contas. Verifique sua conexão ou tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchAccounts
  }));

  useEffect(() => {
    fetchAccounts();
  }, [isAuthenticated]);

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm("Tem certeza que deseja excluir esta conta? Esta ação é irreversível.")) {
      try {
        await api.delete(`/accounts/${accountId}`);
        fetchAccounts();
      } catch (err) {
        console.error("Erro ao excluir conta:", err.response?.data || err.message);
        if (err.response && err.response.status === 409) {
          setError('Não foi possível excluir a conta: Existem transações associadas a ela. Exclua as transações primeiro.');
        } else {
          setError('Falha ao excluir conta. Tente novamente.');
        }
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100px' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Carregando contas...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {accounts.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Você ainda não tem contas cadastradas. Adicione uma!
        </Typography>
      ) : (
        <List>
          {accounts.map(account => (
            <ListItem
              key={account.id}
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderRadius: 1,
                mb: 1.5,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 1,
                transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  boxShadow: 3,
                },
              }}
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => onEditAccount(account)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteAccount(account.id)}
                    sx={{ color: theme.palette.error.main }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={<Typography variant="h6" component="span" fontWeight="medium" color="text.primary">{account.name}</Typography>}
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    R$ {account.balance.toFixed(2)} ({traduzirTipoConta(account.type)})
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
});

export default AccountList;
