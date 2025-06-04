// src/components/Dashboard/CategoryPieChart.jsx

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Box, Typography, useTheme, Paper } from '@mui/material'; // Import Paper here

// Cores mais robustas para o gráfico de pizza, com base no tema geral
const CHART_COLORS = [
  '#F59E0B', // Laranja
  '#2563EB', // Azul
  '#4ADE80', // Verde
  '#D946EF', // Roxo/Magenta
  '#EF4444', // Vermelho
  '#10B981', // Verde Esmeralda
  '#8B5CF6', // Roxo vibrante
  '#EC4899', // Rosa
  '#6B7280', // Cinza
  '#FCD34D', // Amarelo
];

function CategoryPieChart({ data }) {
  const theme = useTheme();

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }), []);

  // Crie uma versão segura dos dados e renomeie as chaves para corresponder ao que a API retorna
  const safeData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      category_name: item.nome_categoria, // 'nome_categoria' da API
      total_spent: parseFloat(item.total_gasto || 0), // 'total_gasto' da API
    }));
  }, [data]);


  if (safeData.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Nenhum gasto por categoria para exibir no momento.
        </Typography>
      </Box>
    );
  }

  // Função para renderizar o conteúdo personalizado do Tooltip
  const renderTooltipContent = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <Paper sx={{ p: 1, borderRadius: '8px', bgcolor: theme.palette.background.paper, boxShadow: theme.shadows[3] }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
            {entry.category_name}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            {currencyFormatter.format(entry.total_spent)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Função para renderizar os rótulos personalizados na pizza
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    const percentValue = (percent * 100).toFixed(0);

    // Evita rótulos para fatias muito pequenas
    if (percentValue < 5 && percentValue !== '0') return null; // Keep '0' to show very small slices if needed

    return (
      <text
        x={x}
        y={y}
        fill={theme.palette.text.primary} // Cor do texto do tema
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${safeData[index].category_name} (${percentValue}%)`} {/* Usar 'category_name' */}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={safeData}
          cx="50%"
          cy="50%"
          outerRadius={90}
          dataKey="total_spent"      // Acessar com 'total_spent'
          nameKey="category_name"    // Acessar com 'category_name'
          label={renderCustomizedLabel}
          labelLine={false}
        >
          {safeData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={renderTooltipContent} />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ color: theme.palette.text.primary }} // Cor do texto da legenda do tema
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

CategoryPieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      nome_categoria: PropTypes.string.isRequired, // Alterado para nome_categoria
      total_gasto: PropTypes.number.isRequired,    // Alterado para total_gasto
    })
  ).isRequired,
};

export default CategoryPieChart;