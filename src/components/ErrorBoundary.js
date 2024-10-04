import React, { useContext } from 'react';
import { Typography } from '@mui/material';
import { NotificationContext } from '../contexts/NotificationContext';

class ErrorBoundary extends React.Component {
  static contextType = NotificationContext;
  
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('ErrorBoundary caught an error', error, errorInfo);
    // Trigger notification
    if (this.context) {
      this.context(`Something went wrong: ${error.message}`, 'error');
    }
  }

  render() {
    if (this.state.hasError) {
      return <Typography color="error">Something went wrong: {this.state.error.message}</Typography>;
    }
    return this.props.children; 
  }
}

export default ErrorBoundary;