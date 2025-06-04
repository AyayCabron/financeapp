// src/components/Lists/Lists.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  AppBar,
  Toolbar,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  InputAdornment,
  Paper,
  Divider,
  Tooltip,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBasketIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';

// Para o DatePicker
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'; // Importar DatePicker aqui
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs'; // Importar dayjs

import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const Lists = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Estados para o modal de adicionar/editar lista
  const [listFormOpen, setListFormOpen] = useState(false);
  const [currentList, setCurrentList] = useState(null);
  const [listName, setListName] = useState('');
  const [listType, setListType] = useState('');
  const [listGoalValue, setListGoalValue] = useState('');
  const [listObservations, setListObservations] = useState(''); // Novo estado

  // Estados para o modal de adicionar/editar item
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [selectedListId, setSelectedListId] = useState(null);
  const [shoppingListItems, setShoppingListItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState(''); // Estado para Categoria
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [itemPriority, setItemPriority] = useState('media');
  const [itemEstimatedCost, setItemEstimatedCost] = useState('');
  const [itemRealCost, setItemRealCost] = useState(''); // Estado para Preço Real
  const [itemPurchased, setItemPurchased] = useState(false);
  const [itemObservations, setItemObservations] = useState('');
  const [itemPurchaseDate, setItemPurchaseDate] = useState(null); // Estado para Data da Compra

  // Estados para o modal de modo compras
  const [shoppingModalOpen, setShoppingModalOpen] = useState(false);
  const [shoppingModeList, setShoppingModeList] = useState(null);

  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const fetchLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/shopping-list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setLists(response.data);
      openSnackbar('Listas carregadas com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao buscar listas de compras:', err);
      if (err.response && err.response.status === 401) {
        openSnackbar('Sessão expirada. Faça login novamente.', 'error');
        logout();
        navigate('/login');
      } else {
        openSnackbar('Erro ao carregar listas.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // --- Funções para Lista de Compras (Modal) ---

  const handleOpenListForm = (list = null) => {
    setCurrentList(list);
    setListName(list ? list.nome : '');
    setListType(list ? list.tipo_lista : '');
    setListGoalValue(list ? (list.meta_valor !== null ? list.meta_valor.toString() : '') : '');
    setListObservations(list ? list.observacoes || '' : ''); // Carrega observações
    setListFormOpen(true);
  };

  const handleCloseListForm = () => {
    setListFormOpen(false);
    setCurrentList(null);
    setListName('');
    setListType('');
    setListGoalValue('');
    setListObservations('');
  };

  const handleSubmitList = async () => {
    if (!listName) {
      openSnackbar('O nome da lista é obrigatório.', 'error');
      return;
    }

    const listData = {
      nome: listName,
      tipo_lista: listType,
      meta_valor: listGoalValue !== '' ? parseFloat(listGoalValue) : null,
      observacoes: listObservations, // Inclui observações
    };

    try {
      const token = localStorage.getItem('token');
      if (currentList) {
        await api.put(`/shopping-list/${currentList.id}`, listData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        openSnackbar('Lista atualizada com sucesso!', 'success');
      } else {
        await api.post('/shopping-list', listData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        openSnackbar('Lista adicionada com sucesso!', 'success');
      }
      fetchLists();
      handleCloseListForm();
    } catch (err) {
      console.error('Erro ao salvar lista:', err);
      openSnackbar('Erro ao salvar lista.', 'error');
    }
  };

  const handleDeleteList = async (listId) => {
    if (window.confirm('Tem certeza que deseja excluir esta lista e todos os seus itens?')) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/shopping-list/${listId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        openSnackbar('Lista excluída com sucesso!', 'success');
        fetchLists();
      } catch (err) {
        console.error('Erro ao excluir lista:', err);
        openSnackbar('Erro ao excluir lista.', 'error');
      }
    }
  };

  // --- Funções para Itens da Lista (Modal) ---

  const fetchItems = useCallback(async (listId) => {
    setIsLoadingItems(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/shopping-list/${listId}/items`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setShoppingListItems(response.data);
      // openSnackbar('Itens da lista carregados com sucesso!', 'success'); // Removido para evitar spam de snackbar
    } catch (error) {
      console.error('Erro ao buscar itens da lista:', error);
      openSnackbar('Erro ao carregar itens da lista.', 'error');
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  const handleOpenItemForm = (listId, item = null) => {
    setSelectedListId(listId);
    setCurrentItem(item);
    setItemName(item ? item.nome : '');
    setItemCategory(item ? item.categoria || '' : ''); // Carrega categoria
    setItemQuantity(item ? item.quantidade : '');
    setItemUnit(item ? item.unidade || '' : '');
    setItemPriority(item ? item.prioridade || 'media' : 'media');
    setItemEstimatedCost(item ? (item.preco_estimado !== null ? item.preco_estimado.toString() : '') : '');
    setItemRealCost(item ? (item.preco_real !== null ? item.preco_real.toString() : '') : ''); // Carrega preço real
    setItemPurchased(item ? item.comprado : false);
    setItemObservations(item ? item.observacoes || '' : '');
    setItemPurchaseDate(item && item.data_compra ? dayjs(item.data_compra) : null); // Carrega data da compra
    setItemFormOpen(true);
  };

  const handleCloseItemForm = () => {
    setItemFormOpen(false);
    setCurrentItem(null);
    setSelectedListId(null);
    setItemName('');
    setItemCategory('');
    setItemQuantity('');
    setItemUnit('');
    setItemPriority('media');
    setItemEstimatedCost('');
    setItemRealCost('');
    setItemPurchased(false);
    setItemObservations('');
    setItemPurchaseDate(null);
  };

  const handleSubmitItem = async () => {
    if (!itemName || !itemQuantity) {
      openSnackbar('Nome e Quantidade do item são obrigatórios.', 'error');
      return;
    }

    const itemData = {
      nome: itemName,
      categoria: itemCategory,
      quantidade: parseFloat(itemQuantity),
      unidade: itemUnit,
      prioridade: itemPriority,
      preco_estimado: itemEstimatedCost !== '' ? parseFloat(itemEstimatedCost) : null,
      preco_real: itemRealCost !== '' ? parseFloat(itemRealCost) : null,
      comprado: itemPurchased,
      observacoes: itemObservations,
      data_compra: itemPurchaseDate ? itemPurchaseDate.toISOString() : null, // Incluído e formatado
    };

    try {
      const token = localStorage.getItem('token');
      if (currentItem) {
        await api.put(`/shopping-list/items/${currentItem.id}`, itemData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        openSnackbar("Item atualizado com sucesso!", "success");
      } else {
        await api.post(`/shopping-list/${selectedListId}/items`, itemData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        openSnackbar("Item adicionado com sucesso!", "success");
      }
      fetchItems(selectedListId);
      handleCloseItemForm();
    } catch (err) {
      console.error("Erro ao salvar item:", err);
      openSnackbar("Erro ao salvar item.", "error");
    }
  };

  const handleDeleteItem = async (listId, itemId) => {
    if (window.confirm("Tem certeza que deseja excluir este item?")) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/shopping-list/items/${itemId}`, { // URL corrigida para DELETE de item
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        openSnackbar("Item excluído com sucesso!", "success");
        fetchItems(listId);
      } catch (err) {
        console.error("Erro ao excluir item:", err);
        openSnackbar("Erro ao excluir item.", "error");
      }
    }
  };

  const handleToggleItemPurchased = async (item) => {
    try {
      const token = localStorage.getItem('token');
      const updatedItemData = { ...item, comprado: !item.comprado };
      // Ajustar o formato de data_compra, preco_estimado, preco_real para o backend
      updatedItemData.data_compra = updatedItemData.data_compra ? dayjs(updatedItemData.data_compra).toISOString() : null;
      updatedItemData.preco_estimado = updatedItemData.preco_estimado !== null ? parseFloat(updatedItemData.preco_estimado) : null;
      updatedItemData.preco_real = updatedItemData.preco_real !== null ? parseFloat(updatedItemData.preco_real) : null;


      await api.put(`/shopping-list/items/${item.id}`, updatedItemData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      openSnackbar(`Item ${updatedItemData.comprado ? 'marcado como comprado' : 'marcado como pendente'}!`, 'success');
      fetchItems(item.lista_id); // Recarrega os itens da lista
    } catch (err) {
      console.error('Erro ao atualizar status do item:', err);
      openSnackbar('Erro ao atualizar status do item.', 'error');
    }
  };

  // --- Funções para Modo Compras ---

  const handleOpenShoppingModal = (list) => {
    setShoppingModeList(list);
    fetchItems(list.id);
    setShoppingModalOpen(true);
  };

  const handleCloseShoppingModal = () => {
    setShoppingModalOpen(false);
    setShoppingModeList(null);
    setShoppingListItems([]);
  };

  const totalEstimatedCost = useMemo(() => {
    if (!shoppingListItems) return '0.00';
    const total = shoppingListItems.reduce((acc, item) => {
      const cost = parseFloat(item.preco_estimado) || 0;
      return acc + (cost * item.quantidade);
    }, 0);
    return total.toFixed(2);
  }, [shoppingListItems]);

  const totalRealCost = useMemo(() => {
    if (!shoppingListItems) return '0.00';
    const total = shoppingListItems.reduce((acc, item) => {
      // Use item.comprado para verificar se o item foi comprado e se tem preco_real
      const cost = item.comprado && item.preco_real ? parseFloat(item.preco_real) : 0;
      return acc + (cost * item.quantidade);
    }, 0);
    return total.toFixed(2);
  }, [shoppingListItems]);

  return (
    <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 4 }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0, sm: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton edge="start" color="inherit" aria-label="back to dashboard" onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Minhas Listas de Compras
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenListForm()}
            sx={{ borderRadius: '8px', px: 3 }}
          >
            Nova Lista
          </Button>
        </Toolbar>
      </AppBar>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : lists.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8, p: 3, border: `2px dashed ${theme.palette.divider}`, borderRadius: '12px' }}>
          <ShoppingCartIcon sx={{ fontSize: 60, color: theme.palette.text.secondary, mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma lista de compras encontrada.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Comece organizando suas compras adicionando sua primeira lista!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenListForm()}
            sx={{ borderRadius: '8px', px: 3, py: 1.5 }}
          >
            Criar Minha Primeira Lista
          </Button>
        </Box>
      ) : (
        <List sx={{ width: '100%' }}>
          {lists.map((list) => (
            <Paper key={list.id} elevation={3} sx={{ mb: 2, borderRadius: '12px', overflow: 'hidden' }}>
              <Accordion
                expanded={selectedListId === list.id && itemFormOpen === false && shoppingModalOpen === false}
                onChange={() => setSelectedListId(selectedListId === list.id ? null : list.id)}
                sx={{
                  borderRadius: '12px',
                  '&.Mui-expanded': {
                    margin: 'auto',
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel-${list.id}-content`}
                  id={`panel-${list.id}-header`}
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.light, 0.1),
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    minHeight: 64,
                    '& .MuiAccordionSummary-content': {
                      my: 1.5,
                      alignItems: 'center',
                    },
                  }}
                >
                  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                      {list.nome}
                    </Typography>
                    {list.tipo_lista && (
                      <Typography variant="body2" color="text.secondary">
                        Tipo: {list.tipo_lista}
                      </Typography>
                    )}
                    {list.meta_valor !== null && (
                      <Typography variant="body2" color="text.secondary">
                        Meta de Valor: R$ {list.meta_valor.toFixed(2)}
                      </Typography>
                    )}
                    {list.observacoes && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Obs: {list.observacoes}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title="Editar Lista">
                      <IconButton edge="end" aria-label="edit list" onClick={(e) => { e.stopPropagation(); handleOpenListForm(list); }}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir Lista">
                      <IconButton edge="end" aria-label="delete list" onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Itens da Lista</Typography>
                    <Box>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenItemForm(list.id)}
                        sx={{ borderRadius: '8px', mr: 1 }}
                      >
                        Adicionar Item
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<ShoppingCartIcon />}
                        onClick={() => handleOpenShoppingModal(list)}
                        sx={{ borderRadius: '8px' }}
                      >
                        Modo Compras
                      </Button>
                    </Box>
                  </Box>
                  {isLoadingItems && selectedListId === list.id ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <CircularProgress />
                    </Box>
                  ) : shoppingListItems.length === 0 && selectedListId === list.id ? (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                      Nenhum item nesta lista.
                    </Typography>
                  ) : (
                    selectedListId === list.id && (
                      <List>
                        {shoppingListItems.map((item) => (
                          <ListItem
                            key={item.id}
                            sx={{
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: '8px',
                              mb: 1,
                              pr: 0,
                              backgroundColor: item.comprado ? alpha(theme.palette.success.light, 0.1) : 'inherit',
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <IconButton onClick={() => handleToggleItemPurchased(item)} sx={{ mr: 1, color: item.comprado ? theme.palette.success.main : theme.palette.text.secondary }}>
                                    {item.comprado ? <CheckCircleOutlineIcon /> : <ShoppingBasketIcon />}
                                  </IconButton>
                                  <Typography
                                    variant="subtitle1"
                                    sx={{
                                      fontWeight: 'medium',
                                      textDecoration: item.comprado ? 'line-through' : 'none',
                                      color: item.comprado ? theme.palette.text.secondary : 'inherit'
                                    }}
                                  >
                                    {item.nome}
                                  </Typography>
                                  {item.categoria && (
                                    <Tooltip title={`Categoria: ${item.categoria}`}>
                                      <CategoryIcon sx={{ ml: 1, fontSize: 18, color: theme.palette.text.secondary }} />
                                    </Tooltip>
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', flexDirection: 'column', ml: 5 }}>
                                  <Typography variant="body2" color="text.primary">
                                    {item.quantidade} {item.unidade}
                                  </Typography>
                                  {item.prioridade && (
                                    <Typography variant="body2" color="text.secondary">
                                      Prioridade: {item.prioridade}
                                    </Typography>
                                  )}
                                  {item.preco_estimado !== null && (
                                    <Typography variant="body2" color="text.secondary">
                                      Estimado: R$ {parseFloat(item.preco_estimado).toFixed(2)}
                                    </Typography>
                                  )}
                                  {item.preco_real !== null && (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                      Real: R$ {parseFloat(item.preco_real).toFixed(2)}
                                    </Typography>
                                  )}
                                  {item.data_compra && (
                                    <Typography variant="body2" color="text.secondary">
                                      Data da Compra: {dayjs(item.data_compra).format('DD/MM/YYYY')}
                                    </Typography>
                                  )}
                                  {item.observacoes && (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                      Obs: {item.observacoes}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pl: 2 }}>
                              <Tooltip title="Editar Item">
                                <IconButton edge="end" aria-label="edit item" onClick={() => handleOpenItemForm(list.id, item)}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Excluir Item">
                                <IconButton edge="end" aria-label="delete item" onClick={() => handleDeleteItem(list.id, item.id)}>
                                  <DeleteIcon color="error" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    )
                  )}
                </AccordionDetails>
              </Accordion>
            </Paper>
          ))}
        </List>
      )}

      {/* Modal para Adicionar/Editar Lista */}
      <Dialog open={listFormOpen} onClose={handleCloseListForm} fullWidth maxWidth="sm">
        <DialogTitle>{currentList ? 'Editar Lista de Compras' : 'Adicionar Nova Lista de Compras'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            label="Nome da Lista"
            type="text"
            fullWidth
            variant="outlined"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Tipo da Lista (Ex: Mensal, Festa, Viagem)"
            type="text"
            fullWidth
            variant="outlined"
            value={listType}
            onChange={(e) => setListType(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Meta de Valor (Opcional)"
            type="number"
            fullWidth
            variant="outlined"
            value={listGoalValue}
            onChange={(e) => setListGoalValue(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />
          <TextField
            margin="dense"
            label="Observações (Opcional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={listObservations}
            onChange={(e) => setListObservations(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseListForm} variant="outlined" color="error" sx={{ borderRadius: '8px' }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmitList} variant="contained" color="primary" sx={{ borderRadius: '8px' }}>
            {currentList ? 'Salvar Alterações' : 'Adicionar Lista'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para Adicionar/Editar Item da Lista */}
      <Dialog open={itemFormOpen} onClose={handleCloseItemForm} fullWidth maxWidth="sm">
        <DialogTitle>{currentItem ? 'Editar Item' : 'Adicionar Novo Item'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Campo Nome do Item */}
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                label="Nome do Item"
                type="text"
                fullWidth
                variant="outlined"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </Grid>

            {/* Campo Categoria - NOVO */}
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Categoria"
                type="text"
                fullWidth
                variant="outlined"
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CategoryIcon /></InputAdornment>,
                }}
              />
            </Grid>

            {/* Campos de Quantidade e Unidade */}
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Quantidade"
                type="number"
                fullWidth
                variant="outlined"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Unidade (Ex: kg, un, l)"
                type="text"
                fullWidth
                variant="outlined"
                value={itemUnit}
                onChange={(e) => setItemUnit(e.target.value)}
              />
            </Grid>

            {/* Campo Prioridade e Preço Estimado */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense" variant="outlined">
                <InputLabel>Prioridade</InputLabel>
                <Select
                  value={itemPriority}
                  onChange={(e) => setItemPriority(e.target.value)}
                  label="Prioridade"
                >
                  <MenuItem value="baixa">Baixa</MenuItem>
                  <MenuItem value="media">Média</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                  <MenuItem value="urgente">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Preço Estimado"
                type="number"
                fullWidth
                variant="outlined"
                value={itemEstimatedCost}
                onChange={(e) => setItemEstimatedCost(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            {/* Campo Preço Real - NOVO */}
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Preço Real"
                type="number"
                fullWidth
                variant="outlined"
                value={itemRealCost}
                onChange={(e) => setItemRealCost(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><AttachMoneyIcon /></InputAdornment>,
                }}
              />
            </Grid>

            {/* Campo Data da Compra - NOVO */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Data da Compra"
                  value={itemPurchaseDate}
                  onChange={(newValue) => setItemPurchaseDate(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      margin="dense"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><CalendarTodayIcon /></InputAdornment>,
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            {/* Checkbox "Item Comprado?" */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={itemPurchased}
                    onChange={(e) => setItemPurchased(e.target.checked)}
                    color="primary"
                  />
                }
                label="Item Comprado?"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Observações"
                type="text"
                fullWidth
                variant="outlined"
                multiline
                rows={2}
                value={itemObservations}
                onChange={(e) => setItemObservations(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseItemForm} variant="outlined" color="error" sx={{ borderRadius: '8px' }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmitItem} variant="contained" color="primary" sx={{ borderRadius: '8px' }}>
            {currentItem ? 'Salvar Alterações' : 'Adicionar Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para Modo Compras */}
      <Dialog open={shoppingModalOpen} onClose={handleCloseShoppingModal} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <ShoppingCartIcon sx={{ mr: 1 }} />
          Modo Compras: {shoppingModeList?.nome}
          {shoppingModeList?.meta_valor && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ ml: 2 }}>
              (Meta: R$ {shoppingModeList.meta_valor.toFixed(2)})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {isLoadingItems ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : shoppingListItems.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
              Nenhum item nesta lista para o modo compras.
            </Typography>
          ) : (
            <List>
              {shoppingListItems
                .sort((a, b) => a.comprado - b.comprado) // Itens não comprados primeiro
                .map((item) => (
                  <ListItem
                    key={item.id}
                    secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {item.preco_real !== null && (
                          <Typography variant="body2" color="text.primary" sx={{ mr: 1, fontWeight: 'bold' }}>
                            R$ {parseFloat(item.preco_real).toFixed(2)}
                          </Typography>
                        )}
                        <IconButton edge="end" aria-label="toggle purchased" onClick={() => handleToggleItemPurchased(item)}>
                          {item.comprado ? <CancelOutlinedIcon color="error" /> : <CheckCircleOutlineIcon color="primary" />}
                        </IconButton>
                      </Box>
                    }
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '8px',
                      mb: 1,
                      backgroundColor: item.comprado ? alpha(theme.palette.success.light, 0.1) : 'inherit',
                      textDecoration: item.comprado ? 'line-through' : 'none',
                      color: item.comprado ? theme.palette.text.secondary : 'inherit',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {item.nome}
                          </Typography>
                          {item.categoria && (
                            <Tooltip title={`Categoria: ${item.categoria}`}>
                              <CategoryIcon sx={{ ml: 1, fontSize: 18, color: theme.palette.text.secondary }} />
                            </Tooltip>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" color="text.primary">
                            {item.quantidade} {item.unidade}
                          </Typography>
                          {item.prioridade && (
                            <Typography variant="body2" color="text.secondary">
                              Prioridade: {item.prioridade}
                            </Typography>
                          )}
                          {item.preco_estimado !== null && (
                            <Typography variant="body2" color="text.secondary">
                              Estimado: R$ {parseFloat(item.preco_estimado).toFixed(2)}
                            </Typography>
                          )}
                          {item.data_compra && (
                            <Typography variant="body2" color="text.secondary">
                              Data da Compra: {dayjs(item.data_compra).format('DD/MM/YYYY')}
                            </Typography>
                          )}
                          {item.observacoes && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Obs: {item.observacoes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1">
              Total Estimado: <Typography component="span" variant="subtitle1" color="primary.main">R$ {totalEstimatedCost}</Typography>
            </Typography>
            <Typography variant="subtitle1">
              Total Real: <Typography component="span" variant="subtitle1" color="success.main">R$ {totalRealCost}</Typography>
            </Typography>
          </Box>
          <Button onClick={handleCloseShoppingModal} variant="contained" color="primary" sx={{ borderRadius: '8px' }}>
            Fechar Modo Compras
          </Button>
        </DialogActions>
      </Dialog>


      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Lists;