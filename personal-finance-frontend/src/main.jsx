import React, { useMemo, useState, createContext } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7B61FF',
    },
    secondary: {
      main: '#F48C06',
    },
    error: {
      main: '#D32F2F',
    },
    background: {
      default: '#f0f2f5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2027',
      secondary: '#6B7280',
    },
    custom: {
      purpleGradient: 'linear-gradient(45deg, #8A2BE2 30%, #4B0082 90%)',
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

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9370DB',
    },
    secondary: {
      main: '#FFB74D',
    },
    error: {
      main: '#EF9A9A',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#E0E0E0',
      secondary: '#B0B0B0',
    },
    custom: {
      purpleGradient: 'linear-gradient(45deg, #4B0082 30%, #8A2BE2 90%)',
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
  const [mode, setMode] = useState('light');

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
