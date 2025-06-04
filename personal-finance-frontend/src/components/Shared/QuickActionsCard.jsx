// src/components/Shared/QuickActionsCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  useTheme,
} from '@mui/material';

// Ícones do Material UI
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CategoryIcon from '@mui/icons-material/Category';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import EventNoteIcon from '@mui/icons-material/EventNote'; // Ícone para Agenda Financeira
import TrackChangesIcon from '@mui/icons-material/TrackChanges'; // NOVO: Ícone para Metas e Objetivos (Alvo)
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'; // Ícone para Listas
import CalculateIcon from '@mui/icons-material/Calculate'; // Ícone para Calculadora Inteligente
import AnalyticsIcon from '@mui/icons-material/Analytics'; // Ícone para Analista
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Ícone para Minhas Conquistas (Mantido)

function QuickActionsCard({
  onNewTransactionClick,
  onNewAccountClick,
  onViewCategoriesClick,
  onViewTransactionsClick,
  onViewAccountsClick,
  onSheetsOptionsClick,
  onFinancialAgendaClick,
  onGoalsObjectivesClick,
  onListsClick,
  onSmartCalculatorClick, // <-- Esta prop é importante!
  onAnalystClick,
  onAchievementsClick,
}) {
  const theme = useTheme();

  return (
    <Paper
      elevation={6}
      sx={{
        p: 2,
        borderRadius: '12px',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: 1.5,
        boxShadow: theme.shadows[8],
        transition: 'background-color 0.3s ease-in-out',
        // height: 'fit-content', // Ajuste conforme necessário
        // minHeight: '150px' // Garante um tamanho mínimo se os botões forem pequenos
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5 }}>
        {/* Adicionar Transação */}
        <IconButton color="primary" aria-label="adicionar transacao" onClick={onNewTransactionClick} sx={{ display: 'flex', flexDirection: 'column', p: 1, flexShrink: 0 }}>
          <AttachMoneyIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>Nova Transação</Typography>
        </IconButton>

        {/* Adicionar Conta */}
        <IconButton color="primary" aria-label="adicionar conta" onClick={onNewAccountClick} sx={{ display: 'flex', flexDirection: 'column', p: 1, flexShrink: 0 }}>
          <AccountBalanceWalletIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>Nova Conta</Typography>
        </IconButton>

        {/* Ver Categorias */}
        <IconButton color="primary" aria-label="ver categorias" onClick={onViewCategoriesClick} sx={{ display: 'flex', flexDirection: 'column', p: 1, flexShrink: 0 }}>
          <CategoryIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>Categorias</Typography>
        </IconButton>

        {/* Ver Transações */}
        <IconButton color="primary" aria-label="ver transacoes" onClick={onViewTransactionsClick} sx={{ display: 'flex', flexDirection: 'column', p: 1, flexShrink: 0 }}>
          <VisibilityIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>Ver Transações</Typography>
        </IconButton>

        {/* Ver Contas */}
        <IconButton color="primary" aria-label="ver contas" onClick={onViewAccountsClick} sx={{ display: 'flex', flexDirection: 'column', p: 1, flexShrink: 0 }}>
          <AccountBalanceWalletIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>Ver Contas</Typography>
        </IconButton>

        {/* Opções de Planilhas (para o modal que abre a seleção de relatórios/planilhas) */}
        <IconButton color="primary" aria-label="opcoes planilhas" onClick={onSheetsOptionsClick} sx={{ display: 'flex', flexDirection: 'column', p: 1, flexShrink: 0 }}>
          <DescriptionIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>Planilhas</Typography>
        </IconButton>

        {/* Agenda Financeira */}
        <IconButton color="primary" aria-label="agenda financeira" onClick={onFinancialAgendaClick} sx={{ display: 'flex', flexDirection: 'column', p: 1, flexShrink: 0 }}>
          <EventNoteIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>Agenda Financeira</Typography>
        </IconButton>

        {/* Metas e Objetivos */}
        <IconButton color="primary" aria-label="metas e objetivos" onClick={onGoalsObjectivesClick} sx={{ display: 'flex', flexDirection: 'column', p: 1, flexShrink: 0 }}>
          <TrackChangesIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>Metas e Objetivos</Typography>
        </IconButton>

        {/* Listas */}
        <IconButton color="primary" aria-label="listas" onClick={onListsClick} sx={{ display: 'flex', flexDirection: 'column', p: 1, flexShrink: 0 }}>
          <FormatListBulletedIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>Listas</Typography>
        </IconButton>

        {/* Calculadora Inteligente */}
        <IconButton color="primary" aria-label="calculadora inteligente" onClick={onSmartCalculatorClick} sx={{ display: 'flex', flexDirection: 'column', p: 1, flexShrink: 0 }}>
          <CalculateIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>Calc. Inteligente</Typography>
        </IconButton>

        {/* Analista */}
        <IconButton color="primary" aria-label="analista" onClick={onAnalystClick} sx={{ display: 'flex', flexDirection: 'column', p: 1, flexShrink: 0 }}>
          <AnalyticsIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>Analista</Typography>
        </IconButton>

        {/* Minhas Conquistas */}
        <IconButton color="primary" aria-label="minhas conquistas" onClick={onAchievementsClick} sx={{ display: 'flex', flexDirection: 'column', p: 1, flexShrink: 0 }}>
          <EmojiEventsIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>Minhas Conquistas</Typography>
        </IconButton>

      </Box>
    </Paper>
  );
}

QuickActionsCard.propTypes = {
  onNewTransactionClick: PropTypes.func.isRequired,
  onNewAccountClick: PropTypes.func.isRequired,
  onViewCategoriesClick: PropTypes.func.isRequired,
  onViewTransactionsClick: PropTypes.func.isRequired,
  onViewAccountsClick: PropTypes.func.isRequired,
  onSheetsOptionsClick: PropTypes.func.isRequired,
  onFinancialAgendaClick: PropTypes.func.isRequired,
  onGoalsObjectivesClick: PropTypes.func.isRequired,
  onListsClick: PropTypes.func.isRequired,
  onSmartCalculatorClick: PropTypes.func.isRequired, // Certifique-se que está como isRequired
  onAnalystClick: PropTypes.func.isRequired,
  onAchievementsClick: PropTypes.func.isRequired,
};

export default QuickActionsCard;