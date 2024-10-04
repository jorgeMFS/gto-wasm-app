import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { NotificationProvider } from './contexts/NotificationContext';
import { DataTypeProvider } from './contexts/DataTypeContext'; // Import DataTypeProvider

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Default MUI primary color
    },
    secondary: {
      main: '#dc004e', // Default MUI secondary color
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <NotificationProvider>
        <DataTypeProvider> {/* Wrap App with DataTypeProvider */}
          <CssBaseline />
          <App />
        </DataTypeProvider>
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>
);