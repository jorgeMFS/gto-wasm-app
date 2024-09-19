import React from 'react';
import { Paper, Typography, TextField } from '@mui/material';

const InputPanel = ({ inputData, setInputData }) => {
  return (
    <Paper style={{ padding: '20px', marginBottom: '20px' }}>
      <Typography variant="h6" gutterBottom>
        Input
      </Typography>
      <TextField
        label="Input Data"
        multiline
        rows={10}
        variant="outlined"
        fullWidth
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
      />
    </Paper>
  );
};

export default InputPanel;