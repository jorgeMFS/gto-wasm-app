import React from 'react';
import { Typography } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <Typography color="error">Something went wrong: {this.state.error.message}</Typography>;
    }
    return this.props.children; 
  }
}

export default ErrorBoundary;