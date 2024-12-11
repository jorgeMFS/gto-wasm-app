import SaveIcon from '@mui/icons-material/Save';
import { Box, IconButton, Paper, TextField, Tooltip, Typography } from '@mui/material';
import React from 'react';

const OutputPanel = ({ outputData }) => {
  const handleSaveOutput = () => {
    const blob = new Blob([outputData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'output.txt';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2 }}>
        <Typography variant="h6">Output</Typography>
      </Box>
      {/* TextField with dynamic height */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 2 }}>
        <TextField
          variant="outlined"
          value={outputData}
          placeholder="Output Data"
          InputProps={{
            multiline: true,
            inputComponent: 'textarea',
            readOnly: true,
          }}
          rows={9}
          sx={{
            flexGrow: 1,
            flexShrink: 1,
            overflow: 'auto',
            minHeight: '100px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '0.875rem',
          }}
        />
      </Box>
      {/* Save button always visible */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: 1,
          flexShrink: 0,
          backgroundColor: 'white',
        }}
      >
        <Tooltip title="Save Output">
          <IconButton color="primary" onClick={handleSaveOutput}>
            <SaveIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default OutputPanel;
