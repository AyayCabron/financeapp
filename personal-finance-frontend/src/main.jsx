// src/main.jsx
import React, { useMemo, useState, createContext } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Define o tema padrão (light)
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7B61FF', // Um roxo vibrante
    },
    secondary: {
      main: '#F48C06', // Um laranja forte
    },
    error: {
      main: '#D32F2F', // Vermelho padrão
    },
    background: {
      default: '#f0f2f5', // Um cinza bem claro para o fundo
      paper: '#FFFFFF', // Branco puro para cards/superfícies
    },
    text: {
      primary: '#1A2027', // Texto escuro para contraste
      secondary: '#6B7280', // Texto secundário em cinza
    },
    custom: {
      purpleGradient: 'linear-gradient(45deg, #8A2BE2 30%, #4B0082 90%)', // Gradiente roxo
      light50: 'rgba(255, 255, 255, 0.5)',
      light80: 'rgba(255, 255, 255, 0.8)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontSize: '2.125rem',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontSize: '1.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    body1: {
      fontSize: '1rem',
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
  },
});

// Define o tema escuro
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9370DB', // Um roxo mais claro para o dark mode
    },
    secondary: {
      main: '#FFB74D', // Um laranja mais suave
    },
    error: {
      main: '#EF9A9A', // Vermelho mais claro
    },
    background: {
      default: '#121212', // Fundo bem escuro
      paper: '#1E1E1E', // Cinza escuro para cards/superfícies
    },
    text: {
      primary: '#E0E0E0', // Texto claro
      secondary: '#B0B0B0', // Texto secundário em cinza claro
    },
    custom: {
      purpleGradient: 'linear-gradient(45deg, #4B0082 30%, #8A2BE2 90%)', // Gradiente roxo invertido
      light50: 'rgba(255, 255, 255, 0.5)',
      light80: 'rgba(255, 255, 255, 0.8)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontSize: '2.125rem',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontSize: '1.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    body1: {
      fontSize: '1rem',
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
  },
});

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

function ThemeWrapper({ children }) {
  const [mode, setMode] = useState('light'); // Padrão 'light'

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(() => createTheme(mode === 'light' ? lightTheme : darkTheme), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

// O ponto de entrada da aplicação
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeWrapper>
          <App />
        </ThemeWrapper>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);