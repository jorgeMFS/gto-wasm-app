import React from 'react';
import { Paper, Typography, Button, TextField } from '@mui/material';

const OutputPanel = ({ outputData, setOutputData }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(outputData);
  };

  const handleExport = () => {
    const blob = new Blob([outputData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'output.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper style={{ padding: '20px' }}>
      <Typography variant="h6" gutterBottom>
        Output
      </Typography>
      <TextField
        label="Processed Data"
        multiline
        rows={10}
        variant="outlined"
        fullWidth
        value={outputData}
        InputProps={{
          readOnly: true,
        }}
      />
      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={handleCopy} style={{ marginRight: '10px' }}>
          Copy
        </Button>
        <Button variant="contained" color="secondary" onClick={handleExport}>
          Export
        </Button>
      </div>
    </Paper>
  );
};

export default OutputPanel;