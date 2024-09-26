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
              paddingTop: '10px', 
            },
          }}
          sx={{ flexGrow: 1 }}
        />
      </Box>
    </Paper>
  );
};

export default OutputPanel;