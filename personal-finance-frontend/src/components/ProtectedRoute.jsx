// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material'; // Para um loader mais bonito

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Exibir um spinner enquanto o status de autenticacao esta sendo verificado
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 2,
        backgroundColor: (theme) => theme.palette.background.default,
        color: (theme) => theme.palette.text.primary
      }}>
        <CircularProgress />
        <Typography variant="h6">Carregando...</Typography>
      </Box>
    );
  }

  // Se nao estiver autenticado, redireciona para a pagina inicial (login)
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Se estiver autenticado, renderiza o componente filho (a rota protegida)
  return <Outlet />;
};

export default ProtectedRoute;