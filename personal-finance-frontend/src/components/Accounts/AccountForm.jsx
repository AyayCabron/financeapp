// src/components/Accounts/AccountForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Alert, // Importar Alert para exibir mensagens de erro
  CircularProgress, // Para indicar carregamento
  InputAdornment, // Para o ícone R$ no saldo
} from '@mui/material';

function AccountForm({ editingAccount, onAccountAdded, onAccountUpdated, onClose }) {
  const theme = useTheme();
  const [name, setName] = useState('');
  // Alterado para 'saldoInicial' para refletir a mudança no backend
  const [saldoInicial, setSaldoInicial] = useState(''); // Manter como string para o input
  const [type, setType] = useState('checking'); // Padrão
  const [formError, setFormError] = useState(null); // Estado para erros do formulário
  const [loading, setLoading] = useState(false); // Estado de carregamento para o botão de submit

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.nome || '');
      // Agora, usa editingAccount.saldo_inicial
      setSaldoInicial(
        editingAccount.saldo_inicial !== undefined && editingAccount.saldo_inicial !== null
          ? String(editingAccount.saldo_inicial).replace('.', ',') // Formata para vírgula
          : ''
      );
      setType(editingAccount.tipo || 'checking');
    } else {
      setName('');
      setSaldoInicial('');
      setType('checking');
    }
    setFormError(null); // Limpa erros ao abrir/fechar o formulário
  }, [editingAccount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null); // Limpa erros anteriores
    setLoading(true); // Inicia o carregamento

    // --- VALIDAÇÃO BÁSICA NO CLIENTE ---
    if (!name.trim()) {
      setFormError('O nome da conta é obrigatório.');
      setLoading(false);
      return;
    }

    // Garante que a vírgula seja tratada como ponto decimal para o parseFloat
    const parsedSaldoInicial = parseFloat(saldoInicial.replace(',', '.'));
    if (isNaN(parsedSaldoInicial)) {
      setFormError('O saldo inicial deve ser um número válido.');
      setLoading(false);
      return;
    }
    // Ao criar uma conta, o saldo inicial não pode ser negativo.
    // Na edição, se o saldo_inicial for alterado, o backend deve ter sua própria validação mais sofisticada.
    // Por simplicidade, mantemos a validação de negativo apenas na criação.
    if (parsedSaldoInicial < 0 && !editingAccount) {
      setFormError('O saldo inicial não pode ser negativo ao criar uma conta.');
      setLoading(false);
      return;
    }
    if (!type.trim()) {
      setFormError('O tipo da conta é obrigatório.');
      setLoading(false);
      return;
    }
    // --- FIM DA VALIDAÇÃO BÁSICA ---

    try {
      const payload = {
        nome: name,
        saldo_inicial: parsedSaldoInicial, // Enviamos como saldo_inicial para o backend
        tipo: type
        // Se houver campos de instituição e observações no seu modelo Conta, adicione-os aqui
        // instituicao: data.instituicao,
        // observacoes: data.observacoes,
      };
      let response;

      if (editingAccount) {
        response = await api.put(`/accounts/${editingAccount.id}`, payload);
        alert('Conta atualizada com sucesso!');
        // O `response.data` agora deve conter `saldo_inicial` e `saldo_atual`
        if (onAccountUpdated) onAccountUpdated(response.data);
      } else {
        response = await api.post('/accounts', payload);
        alert('Conta adicionada com sucesso!');
        // O `response.data` agora deve conter `saldo_inicial` e `saldo_atual`
        if (onAccountAdded) onAccountAdded(response.data);
      }

      // Limpa o formulário e fecha
      setName('');
      setSaldoInicial('');
      setType('checking');
      if (onClose) onClose();
    } catch (err) {
      console.error("Erro ao salvar conta:", JSON.stringify(err.response?.data) || err.message);
      const backendMessage = err.response?.data?.detail || err.response?.data?.message || 'Falha ao salvar a conta. Verifique os dados e tente novamente.';
      setFormError(backendMessage); // Exibe a mensagem de erro do backend no formulário
    } finally {
      setLoading(false); // Finaliza o carregamento
    }
  };

  const handleCancel = () => {
    setName('');
    setSaldoInicial('');
    setType('checking');
    setFormError(null); // Limpa erros ao cancelar
    if (onClose) onClose();
  };

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
      {formError && ( // Exibe erro geral do formulário usando Alert
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {formError}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Nome da Conta"
        variant="outlined"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={loading} // Desabilita o campo durante o carregamento
      />

      <TextField
        fullWidth
        label="Saldo Inicial"
        variant="outlined"
        type="text" // Mantemos type="text" para facilitar o controle da vírgula
        value={saldoInicial}
        onChange={(e) => {
          const value = e.target.value;
          // Permite apenas números, vírgulas e um ponto.
          // Remove caracteres não permitidos.
          const cleanedValue = value.replace(/[^0-9,.]/g, '');

          // Garante que haja apenas um separador decimal (o primeiro que aparecer)
          const parts = cleanedValue.split(/([.,])/); // Divide mantendo o separador

          let formattedValue = parts[0]; // Primeira parte antes do separador
          if (parts.length > 1) { // Se houver um separador
            formattedValue += parts[1]; // Adiciona o separador (vírgula ou ponto)
            // Adiciona o resto, removendo qualquer outro separador que possa existir
            formattedValue += parts.slice(2).join('').replace(/[.,]/g, '');
          }
          setSaldoInicial(formattedValue);
        }}
        required
        disabled={loading}
        inputProps={{
          inputMode: 'decimal', // Sugere teclado numérico com decimal em mobile
          // pattern: "[0-9]+([,.][0-9]+)?" // Opcional: regex para validação básica de números com , ou .
        }}
        InputProps={{ // Propriedades para o componente Material-UI Input
          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
        }}
      />

      <FormControl fullWidth variant="outlined">
        <InputLabel>Tipo</InputLabel>
        <Select
          value={type}
          onChange={(e) => setType(e.target.value)}
          label="Tipo"
          required
          disabled={loading} // Desabilita o campo durante o carregamento
        >
          {/* As opções de tipo devem corresponder aos ENUMs definidos no seu backend (se houver) */}
          <MenuItem value="checking">Conta Corrente</MenuItem>
          <MenuItem value="savings">Poupança</MenuItem>
          <MenuItem value="credit_card">Cartão de Crédito</MenuItem>
          <MenuItem value="investment">Investimento</MenuItem>
          <MenuItem value="cash">Dinheiro</MenuItem>
          {/* Adicione outras opções se você tiver outros tipos de ENUM no backend */}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          color="secondary"
          disabled={loading} // Desabilita o botão durante o carregamento
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
          disabled={loading} // Desabilita o botão durante o carregamento
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            editingAccount ? 'Atualizar Conta' : 'Adicionar Conta'
          )}
        </Button>
      </Box>
    </Box>
  );
}

export default AccountForm;