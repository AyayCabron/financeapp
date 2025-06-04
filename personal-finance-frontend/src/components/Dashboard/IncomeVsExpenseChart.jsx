// src/components/Dashboard/IncomeVsExpenseChart.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, useTheme, Paper } from '@mui/material'; // Importar useTheme e Paper

function IncomeVsExpenseChart({ data }) {
  const theme = useTheme(); // Obter o tema

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }), []);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Nenhum dado de receita vs. despesa para exibir no momento.
        </Typography>
      </Box>
    );
  }

  const renderCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const income = payload.find(item => item.dataKey === 'income')?.value || 0;
      const expense = payload.find(item => item.dataKey === 'expense')?.value || 0;

      return (
        <Paper
          sx={{
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: theme.shadows[3],
            fontSize: '0.9rem',
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {label}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
            Receita: {currencyFormatter.format(income)}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.error.main }}>
            Despesa: {currencyFormatter.format(expense)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} /> {/* Cor da grade */}
        <XAxis dataKey="period" stroke={theme.palette.text.secondary} /> {/* Cor do texto do eixo X */}
        <YAxis stroke={theme.palette.text.secondary} /> {/* Cor do texto do eixo Y */}
        <Tooltip content={renderCustomTooltip} />
        <Legend wrapperStyle={{ color: theme.palette.text.primary }} /> {/* Cor do texto da legenda */}
        <Bar dataKey="income" fill={theme.palette.success.main} name="Receita" /> {/* Cor da barra de receita */}
        <Bar dataKey="expense" fill={theme.palette.error.main} name="Despesa" /> {/* Cor da barra de despesa */}
      </BarChart>
    </ResponsiveContainer>
  );
}

IncomeVsExpenseChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    period: PropTypes.string.isRequired,
    income: PropTypes.number.isRequired,
    expense: PropTypes.number.isRequired,
  })),
};

export default IncomeVsExpenseChart;