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
  Dialog,           // Importe Dialog
  DialogTitle,      // Importe DialogTitle
  DialogContent,    // Importe DialogContent
  DialogActions,    // Importe DialogActions
  IconButton,       // Importe IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close'; // Ícone de fechar

// Adicione a prop 'open' e 'onSuccess' para uso como modal autônomo
function CategoryForm({ editingCategory, setEditingCategory, onCategoryAdded, onCategoryUpdated, onClose, open, onSuccess }) {
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
        // alert('Categoria atualizada com sucesso!'); // REMOVIDO: Usar Snackbar no pai
        if (onCategoryUpdated) onCategoryUpdated(response.data);
      } else {
        response = await api.post('/categories', payload);
        // alert('Categoria adicionada com sucesso!'); // REMOVIDO: Usar Snackbar no pai
        if (onCategoryAdded) onCategoryAdded(response.data);
      }

      setName('');
      setType('expense');
      setEditingCategory(null);
      if (onClose) onClose(); // Fecha o formulário/dialog após sucesso
      if (onSuccess) onSuccess(); // Notifica o componente pai que a operação foi bem-sucedida

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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{
      sx: {
        borderRadius: '12px',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
        p: { xs: 1, sm: 2 },
      },
    }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
        <Typography variant="h5" component="span" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
          {editingCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: theme.palette.text.secondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ borderBottom: 'none', borderColor: theme.palette.divider }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            // Removido maxWidth e mx: 'auto' pois o Dialog já centraliza e controla o tamanho
            p: 1, // Pequeno padding interno para o formulário no dialog
            // Removido boxShadow e borderRadius pois o Paper do Dialog já tem
            backgroundColor: 'background.paper', // Garante que o fundo seja o do tema
            minHeight: '200px', // Ajuste para o loading não fazer o formulário "saltar"
          }}
        >
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
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: editingCategory ? 'space-between' : 'flex-end' }}>
        {editingCategory && (
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            onClick={handleCancelEdit}
            disabled={loading} // Desabilita o botão durante o loading
            sx={{ borderRadius: '8px' }}
          >
            Cancelar Edição
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          size="large"
          onClick={handleSubmit} // Adicionado onClick para garantir que o submit é chamado
          sx={{
            background: theme.palette.custom.purpleGradient,
            color: theme.palette.custom.light50,
            '&:hover': {
              opacity: 0.9,
            },
            minWidth: editingCategory ? 'auto' : '150px', // Ajuste para o botão de adicionar
            borderRadius: '8px',
          }}
          disabled={loading} // Desabilita o botão durante o loading
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            editingCategory ? 'Atualizar Categoria' : 'Adicionar Categoria'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

CategoryForm.propTypes = {
  editingCategory: PropTypes.object,
  setEditingCategory: PropTypes.func,
  onCategoryAdded: PropTypes.func,
  onCategoryUpdated: PropTypes.func,
  onClose: PropTypes.func.isRequired, // Mantido como required
  open: PropTypes.bool.isRequired, // Adicionado prop 'open'
  onSuccess: PropTypes.func, // Adicionado prop 'onSuccess'
};

export default CategoryForm;
