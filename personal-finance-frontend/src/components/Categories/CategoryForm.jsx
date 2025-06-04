// src/components/Categories/CategoryForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

import {
  TextField,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  CircularProgress, // Importe CircularProgress
  Alert,            // Importe Alert
  useTheme,         // Importe useTheme
} from '@mui/material';

// Adicione a prop 'onClose' se o formulário for usado em um Dialog
function CategoryForm({ editingCategory, setEditingCategory, onCategoryAdded, onCategoryUpdated, onClose }) {
  const theme = useTheme(); // Para acessar o tema e suas cores
  const [name, setName] = useState('');
  const [type, setType] = useState('expense'); // 'expense' ou 'income'
  const [loading, setLoading] = useState(false); // Novo estado para controle de loading
  const [formError, setFormError] = useState(null); // Novo estado para mensagens de erro do formulário

  useEffect(() => {
    if (editingCategory) {
      // ATENÇÃO: Nomes das propriedades do objeto 'editingCategory' devem vir do backend
      // Se seu backend retorna 'nome' e 'tipo', ajuste aqui:
      setName(editingCategory.nome || ''); // Ajustado para 'nome' se for o caso do backend
      setType(editingCategory.tipo || 'expense'); // Ajustado para 'tipo' se for o caso do backend
    } else {
      setName('');
      setType('expense');
    }
    setFormError(null); // Limpa erros ao mudar de modo (edição/criação)
  }, [editingCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null); // Limpa erros anteriores
    setLoading(true); // Inicia o loading

    // --- VALIDAÇÃO BÁSICA NO CLIENTE ---
    if (!name.trim()) {
      setFormError('O nome da categoria é obrigatório.');
      setLoading(false);
      return;
    }
    if (!type.trim()) {
      setFormError('O tipo da categoria (despesa/receita) é obrigatório.');
      setLoading(false);
      return;
    }
    // --- FIM DA VALIDAÇÃO BÁSICA ---

    try {
      // ATENÇÃO: Verifique se as chaves 'nome' e 'tipo' correspondem ao seu backend Flask
      const payload = { nome: name, tipo: type };
      let response;

      if (editingCategory) {
        response = await api.put(`/categories/${editingCategory.id}`, payload);
        alert('Categoria atualizada com sucesso!'); // Manter alert ou remover?
        if (onCategoryUpdated) onCategoryUpdated(response.data);
      } else {
        response = await api.post('/categories', payload);
        alert('Categoria adicionada com sucesso!'); // Manter alert ou remover?
        if (onCategoryAdded) onCategoryAdded(response.data);
      }

      setName('');
      setType('expense');
      setEditingCategory(null);
      if (onClose) onClose(); // Fecha o formulário/dialog após sucesso

    } catch (err) {
      console.error("Erro ao salvar categoria:", err.response?.data || err.message);
      const backendMessage = err.response?.data?.detail || err.response?.data?.message || 'Falha ao salvar categoria. Verifique os dados e tente novamente.';
      setFormError(backendMessage); // Exibe o erro no Alert do Material UI
    } finally {
      setLoading(false); // Finaliza o loading
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setType('expense');
    setFormError(null); // Limpa erros ao cancelar
    if (onClose) onClose(); // Fecha o formulário/dialog ao cancelar, se houver
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 400,
        mx: 'auto',
        p: 3,
        boxShadow: 3,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        // Adicionando um minHeight para o loading não fazer o formulário "saltar"
        minHeight: editingCategory ? 'auto' : '350px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h5" component="h3" mb={3} color="primary">
        {editingCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
      </Typography>

      {/* Mensagens de erro */}
      {formError && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {formError}
        </Alert>
      )}

      <TextField
        label="Nome da Categoria"
        variant="outlined"
        fullWidth
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        margin="normal"
        disabled={loading} // Desabilita o campo durante o loading
      />

      <FormControl fullWidth margin="normal">
        <InputLabel id="type-label">Tipo</InputLabel>
        <Select
          labelId="type-label"
          value={type}
          label="Tipo"
          onChange={(e) => setType(e.target.value)}
          required
          disabled={loading} // Desabilita o campo durante o loading
        >
          <MenuItem value="expense">Despesa</MenuItem>
          <MenuItem value="income">Receita</MenuItem>
        </Select>
      </FormControl>

      <Box mt={3} display="flex" justifyContent={editingCategory ? 'space-between' : 'flex-end'} gap={2}>
        {editingCategory && (
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            onClick={handleCancelEdit}
            disabled={loading} // Desabilita o botão durante o loading
          >
            Cancelar Edição
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          size="large"
          sx={{
            background: theme.palette.custom.purpleGradient,
            color: theme.palette.custom.light50,
            '&:hover': {
              opacity: 0.9,
            },
            minWidth: editingCategory ? 'auto' : '150px', // Ajuste para o botão de adicionar
          }}
          disabled={loading} // Desabilita o botão durante o loading
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            editingCategory ? 'Atualizar Categoria' : 'Adicionar Categoria'
          )}
        </Button>
      </Box>
    </Box>
  );
}

export default CategoryForm;