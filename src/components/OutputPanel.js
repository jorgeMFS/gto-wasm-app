import React from 'react';
import { Paper, Typography, TextField, Box } from '@mui/material';

const OutputPanel = ({ outputData, setOutputData }) => {
  return (
    <Paper sx={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Output
      </Typography>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
              fontSize: '0.875rem', // Reduced font size
              whiteSpace: 'pre-wrap', // Ensure text wraps correctly
              overflowWrap: 'break-word', // Additional word wrapping
            },
          }}
          sx={{ 
            flexGrow: 1,
            fontSize: '0.875rem', // Reduced font size
            maxHeight: '300px', // Set maximum height
            overflowY: 'auto', // Enable vertical scrolling
            wordBreak: 'break-word', // Prevent text overflow
            whiteSpace: 'pre-wrap', // Ensure text wraps correctly
          }}
          placeholder="Processed output will appear here..."
        />
      </Box>
    </Paper>
  );
};

export default OutputPanel;