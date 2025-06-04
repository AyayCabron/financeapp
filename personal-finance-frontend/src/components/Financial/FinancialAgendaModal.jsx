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
  Box,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event'; // Ícone para eventos
import api from '../../api/axios'; // Certifique-se de que o caminho está correto
import { useAuth } from '../../context/AuthContext'; // Para accessToken
import { format } from 'date-fns'; // Para formatação de datas (instale: npm install date-fns)
import { ptBR } from 'date-fns/locale'; // Para localização em português

function FinancialAgendaModal({ open, onClose }) {
  const theme = useTheme();
  const { accessToken } = useAuth();

  const [events, setEvents] = useState([]); // Estado para os eventos da agenda
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // currencyFormatter (certifique-se de que está definido aqui se precisar formatar valores)
  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }, []);

  // Função para buscar eventos da agenda (será implementada no backend depois)
  const fetchAgendaEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implementar esta rota no backend (ex: /agenda ou /transactions/scheduled)
      const response = await api.get('/accounts', { // <--- ROTA DE API A SER CRIADA
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setEvents(response.data);
      console.log('Eventos da agenda:', response.data);
    } catch (err) {
      console.error('Erro ao buscar eventos da agenda:', err);
      setError('Erro ao carregar agenda financeira.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (open) { // Busca eventos somente quando o modal é aberto
      fetchAgendaEvents();
    }
  }, [open, fetchAgendaEvents]);


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.palette.custom.backgroundLight, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon />
          <Typography variant="h6">Agenda Financeira</Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ backgroundColor: theme.palette.background.default, p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : events.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
            Nenhum evento futuro na agenda.
          </Typography>
        ) : (
          <List>
            {/* Exemplo de como você pode renderizar os eventos */}
            {events.map((event, index) => (
              <React.Fragment key={event.id || index}> {/* Use event.id se houver, ou index como fallback */}
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {event.descricao || 'Evento sem descrição'}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Data: {event.data ? format(new Date(event.data), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Valor: {event.valor ? currencyFormatter.format(parseFloat(String(event.valor || '0').replace(',', '.'))) : 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tipo: {event.tipo === 'income' ? 'Receita' : 'Despesa'}
                        </Typography>
                        {event.conta && (
                          <Typography variant="body2" color="text.secondary">
                            Conta: {event.conta.nome}
                          </Typography>
                        )}
                        {event.categoria && (
                          <Typography variant="body2" color="text.secondary">
                            Categoria: {event.categoria.nome}
                          </Typography>
                        )}
                        {/* Adicione mais detalhes conforme a estrutura dos seus dados de evento */}
                      </Box>
                    }
                  />
                </ListItem>
                {index < events.length - 1 && <Divider component="li" />}
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

FinancialAgendaModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FinancialAgendaModal;