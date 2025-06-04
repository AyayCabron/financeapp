// src/components/Auth/Login.jsx
import React, { useState, useContext, useCallback } from 'react'; // Adicionado useCallback
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ColorModeContext } from '../../main';

import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  useTheme,
  Snackbar, // Importado Snackbar
  Alert,    // Importado Alert
} from '@mui/material';

import Lock from '@mui/icons-material/Lock';
import Email from '@mui/icons-material/Email';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import FacebookLogo from '../../assets/img/facebook-logo.png';
import GoogleLogo from '../../assets/img/google-logo.png';
import GitHubLogo from '../../assets/img/github-logo.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  // --- Estados para Snackbar (mensagens de feedback) ---
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success', 'error', 'warning', 'info'

  // Função para exibir o Snackbar
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // Função para fechar o Snackbar
  const handleCloseSnackbar = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await login(email, password);
    if (success) {
      showSnackbar('Login bem-sucedido!', 'success'); // Substituído alert por showSnackbar
      navigate('/dashboard');
    } else {
      showSnackbar('Falha no login. Verifique o e-mail e senha.', 'error'); // Substituído alert por showSnackbar
      console.error('Falha no login.');
    }
  };

  return (
    <Container
      component="main"
      maxWidth={false}
      sx={{
        height: '100vh',
        width: '100vw',
        background: theme.palette.custom?.purpleGradient || 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', // Adicionado fallback
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 0,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          padding: { xs: '20px', sm: '30px 40px' },
          borderRadius: '8px',
          gap: '30px',
          width: { xs: '90%', sm: '400px' },
          height: 'fit-content',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h2" component="h2">
            Login
          </Typography>
          <IconButton onClick={colorMode.toggleColorMode} color="inherit" sx={{ fontSize: '20px' }}>
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
          <Box
            component="a"
            href="https://www.linkedin.com/in/viniciuseduardolima/" 
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& img': {
                width: '35px',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.2)',
                },
              },
            }}
          >
            <img src={FacebookLogo} alt="Facebook Logo" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/35x35/cccccc/white?text=FB'; }} />
          </Box>
          <Box
            component="a"
            href="mailto:vinicius.cloudfy@gmail.com" 
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& img': {
                width: '35px',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.2)',
                },
              },
            }}
          >
            <img src={GoogleLogo} alt="Google Logo" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/35x35/cccccc/white?text=G'; }} />
          </Box>
          <Box
            component="a"
            href="https://github.com/AyayCabron"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& img': {
                width: '35px',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.2)',
                },
              },
            }}
          >
            <img src={GitHubLogo} alt="GitHub Logo" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/35x35/cccccc/white?text=GH'; }} />
          </Box>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
          }}
        >
          <TextField
            fullWidth
            label="Email"
            variant="standard"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: theme.palette.text.primary }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiInputBase-input': {
                width: '100% !important',
              },
            }}
          />

          <TextField
            fullWidth
            label="Senha"
            variant="standard"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: theme.palette.text.primary }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiInputBase-input': {
                width: '100% !important',
              },
            }}
          />

          <Box id="register" sx={{ width: '100%', textAlign: 'right' }}>
            <RouterLink to="/register" style={{ textDecoration: 'none', fontSize: '12px', color: theme.palette.text.secondary }}>
              Não tem uma conta? Registre-se aqui.
            </RouterLink>
          </Box>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              background: theme.palette.custom?.purpleGradient || 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', // Adicionado fallback
              color: theme.palette.custom?.light50 || 'white', // Adicionado fallback
              padding: '7px',
              fontSize: '18px',
              borderRadius: '3px',
              width: '100%',
            }}
          >
            {loading ? 'Entrando...' : 'Login'}
          </Button>
        </Box>
      </Paper>

      {/* Snackbar para mensagens de feedback */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Login;
