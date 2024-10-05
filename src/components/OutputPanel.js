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
              height: '100%',
              alignItems: 'flex-start',
              fontSize: '0.875rem', // Reduced font size
            },
          }}
          sx={{ 
            flexGrow: 1,
            fontSize: '0.875rem', // Reduced font size
            maxHeight: '300px', // Set maximum height
            overflowY: 'auto', // Enable vertical scrolling
          }}
        />
      </Box>
    </Paper>
  );
};

export default OutputPanel;