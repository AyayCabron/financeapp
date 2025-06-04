// src/components/Auth/Register.jsx
import React, { useState, useContext, useCallback } from 'react';
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
  Snackbar,
  Alert,
} from '@mui/material';

import AccountCircle from '@mui/icons-material/AccountCircle';
import Lock from '@mui/icons-material/Lock';
import Email from '@mui/icons-material/Email';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import FacebookLogo from '../../assets/img/facebook-logo.png';
import GoogleLogo from '../../assets/img/google-logo.png';
import GitHubLogo from '../../assets/img/github-logo.png';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleCloseSnackbar = useCallback((event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(username, email, password);
    if (success) {
      showSnackbar('Registro bem-sucedido! Agora você pode fazer login.', 'success');
      navigate('/login');
    } else {
      showSnackbar('Falha no registro. Verifique os dados.', 'error');
    }
  };

  return (
    <Container
      component="main"
      maxWidth={false}
      sx={{
        height: '100vh',
        width: '100vw',
        background: theme.palette.custom?.purpleGradient || 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
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
            Registro
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
            label="Usuário"
            variant="standard"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle sx={{ color: theme.palette.text.primary }} />
                </InputAdornment>
              ),
            }}
          />

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
          />

          <Box id="login" sx={{ width: '100%', textAlign: 'right' }}>
            <RouterLink to="/login" style={{ textDecoration: 'none', fontSize: '12px', color: theme.palette.text.secondary }}>
              Já tem uma conta? Faça login aqui.
            </RouterLink>
          </Box>

          <Button
            type="submit"
            variant="contained"
            sx={{
              background: theme.palette.custom?.purpleGradient || 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              color: theme.palette.custom?.light50 || 'white',
              padding: '7px',
              fontSize: '18px',
              borderRadius: '3px',
              width: '100%',
            }}
          >
            Registrar
          </Button>
        </Box>
      </Paper>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Register;
