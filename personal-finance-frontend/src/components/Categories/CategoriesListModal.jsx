// src/components/Categories/CategoriesListModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Alert,
  Box,
  Divider,
  useTheme,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CategoryIcon from '@mui/icons-material/Category';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function CategoriesListModal({ open, onClose, categories, loadingCategories, categoriesError, onEditCategory }) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  // Adicionado para depuração: Verifique as categorias recebidas
  useEffect(() => {
    console.log("CategoriesListModal - Categories prop received:", categories);
    console.log("CategoriesListModal - Loading categories:", loadingCategories);
    console.log("CategoriesListModal - Categories error:", categoriesError);
  }, [categories, loadingCategories, categoriesError]);

  const filteredCategories = useMemo(() => {
    if (!categories) {
      console.log("CategoriesListModal - 'categories' prop is null or undefined.");
      return [];
    }
    if (!searchTerm) {
      console.log("CategoriesListModal - No search term, returning all categories:", categories);
      return categories;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = categories.filter(category =>
      category.nome.toLowerCase().includes(lowerCaseSearchTerm) ||
      category.tipo.toLowerCase().includes(lowerCaseSearchTerm)
    );
    console.log("CategoriesListModal - Filtered categories:", filtered);
    return filtered;
  }, [categories, searchTerm]);

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
          p: { xs: 1, sm: 2 },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
        <Typography variant="h5" component="span" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
          Todas as Categorias
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
        <TextField
          label="Buscar Categoria"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />
        {loadingCategories ? (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Carregando categorias...
            </Typography>
          </Box>
        ) : categoriesError ? (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            Erro ao carregar categorias: {categoriesError.message?.message || categoriesError.message || 'Erro desconhecido'}
          </Alert>
        ) : filteredCategories.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Nenhuma categoria encontrada. Verifique se há categorias cadastradas ou se os filtros estão muito restritivos.
          </Typography>
        ) : (
          <List>
            {filteredCategories.map((category) => (
              <React.Fragment key={category.id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton edge="end" aria-label="editar categoria" onClick={() => onEditCategory(category)}>
                        <EditIcon sx={{ color: theme.palette.text.secondary }} />
                      </IconButton>
                      {/* Implementar onDeleteCategory se necessário */}
                      {/* <IconButton edge="end" aria-label="excluir categoria" onClick={() => onDeleteCategory(category.id)}>
                        <DeleteIcon sx={{ color: theme.palette.error.main }} />
                      </IconButton> */}
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <CategoryIcon sx={{ color: theme.palette.secondary.main }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body1" fontWeight="bold">{category.nome}</Typography>}
                    secondary={<Typography variant="body2" color="text.secondary">{category.tipo === 'income' ? 'Receita' : 'Despesa'}</Typography>}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained" sx={{ borderRadius: '8px' }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

CategoriesListModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  categories: PropTypes.array.isRequired,
  loadingCategories: PropTypes.bool.isRequired,
  categoriesError: PropTypes.object,
  onEditCategory: PropTypes.func.isRequired,
};

export default CategoriesListModal;
