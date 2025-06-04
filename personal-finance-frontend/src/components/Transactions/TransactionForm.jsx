// src/components/Transactions/TransactionForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';

function TransactionForm({ onTransactionAdded, onTransactionUpdated, editingTransaction, onClose }) {
  const theme = useTheme();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(''); // Manter como string para entrada do usuário
  const [type, setType] = useState('expense');
  const [date, setDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingDeps, setLoadingDeps] = useState(true); // Carregamento das dependências (contas e categorias)
  const [loadingSubmit, setLoadingSubmit] = useState(false); // Carregamento para o submit do formulário
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.descricao || '');
      // Formata o valor para vírgula na edição
      setAmount(editingTransaction.valor !== undefined && editingTransaction.valor !== null ? String(editingTransaction.valor).replace('.', ',') : '');
      setType(editingTransaction.tipo || 'expense');
      setDate(editingTransaction.data ? new Date(editingTransaction.data).toISOString().split('T')[0] : '');
      setAccountId(editingTransaction.conta_id || '');
      setCategoryId(editingTransaction.categoria_id || '');
    } else {
      setDescription('');
      setAmount('');
      setType('expense');
      const today = new Date();
      setDate(today.toISOString().split('T')[0]);
    }
    setFormError(null);
  }, [editingTransaction]);

  useEffect(() => {
    const fetchDependencies = async () => {
      setLoadingDeps(true);
      setFormError(null);
      try {
        const accountsRes = await api.get('/accounts');
        setAccounts(accountsRes.data);

        const categoriesRes = await api.get('/categories');
        setCategories(categoriesRes.data);

        if (!editingTransaction) {
          if (accountsRes.data.length > 0) {
            setAccountId(accountsRes.data[0].id);
          } else {
            setAccountId('');
          }
          if (categoriesRes.data.length > 0) {
            if (!categoryId) { // Define o primeiro categoryId apenas se for uma nova transação
              setCategoryId(categoriesRes.data[0].id);
            }
          } else {
            setCategoryId('');
          }
          const today = new Date();
          setDate(today.toISOString().split('T')[0]);
        }
      } catch (err) {
        console.error("Erro ao carregar dependências para transação:", err.response?.data || err.message);
        setFormError("Não foi possível carregar contas ou categorias. Verifique se você as possui.");
      } finally {
        setLoadingDeps(false);
      }
    };
    fetchDependencies();
  }, [editingTransaction, categoryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setLoadingSubmit(true); // Inicia o loading do submit

    // --- VALIDAÇÃO E CONVERSÃO DE VALOR ---
    if (!description.trim()) {
      setFormError('A descrição da transação é obrigatória.');
      setLoadingSubmit(false);
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.')); // Lida com vírgula como decimal e converte
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('O valor deve ser um número positivo.');
      setLoadingSubmit(false);
      return;
    }

    if (!type.trim()) {
      setFormError('O tipo da transação (despesa/receita) é obrigatório.');
      setLoadingSubmit(false);
      return;
    }
    if (!date) {
      setFormError('A data da transação é obrigatória.');
      setLoadingSubmit(false);
      return;
    }
    if (!accountId) {
      setFormError('Selecione uma conta para a transação.');
      setLoadingSubmit(false);
      return;
    }
    if (!categoryId) {
      setFormError('Selecione uma categoria para a transação.');
      setLoadingSubmit(false);
      return;
    }
    // --- FIM DA VALIDAÇÃO E CONVERSÃO ---

    try {
      const payload = {
        descricao: description,
        valor: parsedAmount, // Enviar como número
        tipo: type,
        data: date,
        conta_id: parseInt(accountId),
        categoria_id: parseInt(categoryId),
      };

      if (editingTransaction) {
        const response = await api.put(`/transactions/${editingTransaction.id}`, payload);
        alert('Transação atualizada com sucesso!');
        if (onTransactionUpdated) {
          onTransactionUpdated(response.data);
        }
      } else {
        const response = await api.post('/transactions', payload);
        alert('Transação adicionada com sucesso!');
        if (onTransactionAdded) {
          onTransactionAdded(response.data);
        }
      }

      setDescription('');
      setAmount('');
      setType('expense');
      const today = new Date();
      setDate(today.toISOString().split('T')[0]);
      if (onClose) onClose();

    } catch (err) {
      console.error("Erro ao salvar transação:", JSON.stringify(err.response?.data) || err.message);
      const backendMessage = err.response?.data?.detail || err.response?.data?.message || 'Falha ao salvar transação. Verifique os dados e tente novamente.';
      setFormError(backendMessage);
    } finally {
      setLoadingSubmit(false); // Finaliza o loading do submit
    }
  };

  const handleCancel = () => {
    setDescription('');
    setAmount('');
    setType('expense');
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);
    setFormError(null);
    if (onClose) onClose();
  };

  if (loadingDeps) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Carregando formulário de transação...</Typography>
      </Box>
    );
  }

  // Mensagem de erro/instrução se não houver contas ou categorias
  if (accounts.length === 0 || categories.length === 0) {
    return (
      <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>
        Por favor, crie pelo menos uma conta e uma categoria antes de adicionar transações.
      </Alert>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
      }}
    >
      {formError && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {formError}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Descrição"
        variant="outlined"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        disabled={loadingSubmit}
      />

      <TextField
        fullWidth
        label="Valor"
        variant="outlined"
        type="text" // Manter como 'text' para permitir vírgula
        value={amount}
        onChange={(e) => {
          // Permite apenas números, vírgulas e um ponto
          const value = e.target.value.replace(/[^0-9,.]/g, '');
          // Garante apenas um separador decimal (vírgula ou ponto)
          const parts = value.split(/[.,]/);
          if (parts.length > 2) {
              setAmount(parts[0] + ',' + parts.slice(1).join(''));
          } else {
              setAmount(value);
          }
        }}
        required
        disabled={loadingSubmit}
        inputProps={{ inputMode: 'decimal' }} // Sugere teclado numérico com decimal
      />

      <FormControl fullWidth variant="outlined">
        <InputLabel>Tipo</InputLabel>
        <Select
          value={type}
          onChange={(e) => setType(e.target.value)}
          label="Tipo"
          required
          disabled={loadingSubmit}
        >
          <MenuItem value="expense">Despesa</MenuItem>
          <MenuItem value="income">Receita</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Data"
        variant="outlined"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        InputLabelProps={{ shrink: true }}
        disabled={loadingSubmit}
      />

      <FormControl fullWidth variant="outlined">
        <InputLabel>Conta</InputLabel>
        <Select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          label="Conta"
          required
          disabled={loadingSubmit}
        >
          {accounts.map(account => (
            <MenuItem key={account.id} value={account.id}>
              {account.nome} (R$ {account.saldo_atual !== undefined && account.saldo_atual !== null ? parseFloat(account.saldo_atual).toFixed(2) : '0.00'}) {/* Garante float e duas casas */}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth variant="outlined">
        <InputLabel>Categoria</InputLabel>
        <Select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          label="Categoria"
          required
          disabled={loadingSubmit}
        >
          {categories.map(category => (
            <MenuItem key={category.id} value={category.id}>
              {category.nome}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          color="secondary"
          disabled={loadingSubmit}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          sx={{
            background: theme.palette.custom.purpleGradient,
            color: theme.palette.custom.light50,
            '&:hover': {
              opacity: 0.9,
            },
          }}
          disabled={loadingSubmit}
        >
          {loadingSubmit ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            editingTransaction ? 'Atualizar Transação' : 'Adicionar Transação'
          )}
        </Button>
      </Box>
    </Box>
  );
}

export default TransactionForm;