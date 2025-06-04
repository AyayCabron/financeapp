// src/components/AuthForms.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';

function AuthForms() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, register, isAuthenticated, logout, user: authUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await register(username, email, password);
        alert('Registro bem-sucedido! Agora você pode fazer login.');
        setIsRegistering(false);
        setUsername('');
        setEmail('');
        setPassword('');
      } else {
        await login(email, password);
        // O redirecionamento é feito dentro do login do AuthContext
      }
    } catch (error) {
      console.error("Erro na autenticação:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Ocorreu um erro. Tente novamente.';
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <Paper
        elevation={6}
        sx={{
          padding: 4,
          borderRadius: '12px',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          textAlign: 'center',
          width: { xs: '90%', sm: '400px' },
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Você está logado!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Seja bem-vindo, {authUser?.username || authUser?.email || 'usuário'}!
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{
              background: theme.palette.custom.purpleGradient,
              color: theme.palette.custom.light50,
              '&:hover': { opacity: 0.9 },
            }}
          >
            Ir para o Dashboard
          </Button>
          <Button
            variant="outlined"
            onClick={logout}
            color="secondary"
          >
            Sair
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={6}
      sx={{
        padding: 4,
        borderRadius: '12px',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        width: { xs: '90%', sm: '400px' },
      }}
    >
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
        {isRegistering ? 'Registrar' : 'Login'}
      </Typography>

      {formError && (
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
          {formError}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {isRegistering && (
          <TextField
            fullWidth
            label="Usuário"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}

        <TextField
          fullWidth
          label="Email"
          variant="outlined"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <TextField
          fullWidth
          label="Senha"
          variant="outlined"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{
            mt: 2,
            background: theme.palette.custom.purpleGradient,
            color: theme.palette.custom.light50,
            '&:hover': { opacity: 0.9 },
            height: '48px',
          }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : (isRegistering ? 'Registrar' : 'Entrar')}
        </Button>
      </Box>

      <Button
        variant="text"
        fullWidth
        onClick={() => {
          setIsRegistering(!isRegistering);
          setFormError(null);
        }}
        sx={{ mt: 2, color: theme.palette.text.secondary }}
      >
        {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Registre-se'}
      </Button>
    </Paper>
  );
}

export default AuthForms;
