import React from 'react';
import { Paper, Typography, TextField } from '@mui/material';

const OutputPanel = ({ outputData, setOutputData }) => {
  return (
    <Paper style={{ padding: '20px', marginBottom: '20px' }}>
      <Typography variant="h6" gutterBottom>
        Output
      </Typography>
      <TextField
        label="Output Data"
        multiline
        rows={10}
        variant="outlined"
        fullWidth
        value={outputData}
        InputProps={{
          readOnly: true,
        }}
      />
    </Paper>
  );
};

export default OutputPanel;