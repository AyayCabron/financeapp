// src/theme.js
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

const rawColors = {
  light50: '#f8fafc',
  dark50: '#797984',
  dark100: '#312d37',
  dark900: '#000',
  purple50: '#002397',
  purple100: '#007da6',
  purple200: '#00e09a',
};

// Tipografia base
const baseTypography = {
  fontFamily: '"Poppins", "Noto Sans", sans-serif',
  h1: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '40px',
    position: 'relative',
    fontWeight: '700',
    lineHeight: '1.2',
    margin: 0,
    padding: 0,
    '&::before': {
      content: '""',
      position: 'absolute',
      width: '40%',
      backgroundColor: rawColors.purple50,
      height: '3px',
      bottom: '10px',
      borderRadius: '5px',
      left: '0',
    },
  },
  body1: {
    fontWeight: '400',
    lineHeight: '1.5',
  },
  allVariants: {
    fontFamily: '"Poppins", "Noto Sans", sans-serif',
  },
};

// Estilos compartilhados entre os temas
const baseComponents = (isDark = false) => ({
  MuiCssBaseline: {
    styleOverrides: {
      '*': {
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        fontWeight: 'bold',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.05)',
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiInputBase-root': {
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          padding: '3px 0',
          borderBottom: `1px solid ${rawColors.purple50}`,
          '&::before': { display: 'none' },
          '&::after': { display: 'none' },
        },
        '& .MuiInputBase-input': {
          border: 'none',
          backgroundColor: 'transparent',
          width: '260px',
          fontSize: '18px',
          padding: '0px 5px',
          color: isDark ? rawColors.light50 : rawColors.dark900,
          '&:focus': {
            outline: 'none',
          },
        },
        '& .MuiInputLabel-root': {
          fontSize: '14px',
          color: isDark ? rawColors.light50 : rawColors.dark50,
          marginBottom: '5px',
          position: 'relative',
          transform: 'none',
          top: 'auto',
          left: 'auto',
          pointerEvents: 'none',
        },
        '& .MuiInputLabel-shrink': {
          transform: 'none',
          fontSize: '14px',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '& .MuiFilledInput-underline': {
          '&:before': { borderBottom: 'none' },
          '&:after': { borderBottom: 'none' },
        },
      },
    },
  },
});

// Tema claro
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: rawColors.purple50 },
    secondary: { main: rawColors.purple100 },
    error: { main: red.A400 },
    background: {
      default: rawColors.light50,
      paper: rawColors.light50,
    },
    text: {
      primary: rawColors.dark900,
      secondary: rawColors.dark50,
    },
    custom: {
      ...rawColors,
      purpleGradient: `linear-gradient(90deg, ${rawColors.purple50}, ${rawColors.purple100}, ${rawColors.purple200})`,
    },
  },
  typography: baseTypography,
  components: baseComponents(false),
});

// Tema escuro
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: rawColors.purple50 },
    secondary: { main: rawColors.purple100 },
    error: { main: red.A400 },
    background: {
      default: rawColors.dark100,
      paper: rawColors.dark100,
    },
    text: {
      primary: rawColors.light50,
      secondary: rawColors.light50,
    },
    custom: {
      ...rawColors,
      purpleGradient: `linear-gradient(90deg, ${rawColors.purple50}, ${rawColors.purple100}, ${rawColors.purple200})`,
    },
  },
  typography: baseTypography,
  components: baseComponents(true),
});

export { lightTheme, darkTheme };
