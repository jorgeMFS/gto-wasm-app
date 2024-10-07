import React from 'react';
import { Paper, Typography, TextField, Box, IconButton, Tooltip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

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
    <Paper elevation={3} sx={{ padding: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Output
      </Typography>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <TextField
          label="Output Data"
          multiline
          variant="outlined"
          fullWidth
          value={outputData}
          InputProps={{
            readOnly: true,
            sx: {
              alignItems: 'flex-start',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
            },
          }}
          sx={{
            flexGrow: 1,
            fontSize: '0.875rem',
            overflowY: 'auto',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
          placeholder="Processed output will appear here..."
        />
        <Box sx={{ marginTop: 1, textAlign: 'right' }}>
          <Tooltip title="Save Output">
            <IconButton color="primary" onClick={handleSaveOutput}>
              <SaveIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

export default OutputPanel;
