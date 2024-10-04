import React, { useState, useContext } from 'react';
import { Paper, Typography, TextField, Box, Button } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { NotificationContext } from '../contexts/NotificationContext';

const InputPanel = ({ inputData, setInputData }) => {
  const [fileName, setFileName] = useState('');
  const showNotification = useContext(NotificationContext);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setInputData(e.target.result);
      };
      reader.onerror = (e) => {
        console.error('Error reading file:', e);
        showNotification('Failed to read the file.', 'error');
      };
      reader.readAsText(file);
    }
  };

  return (
    <Paper sx={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Input
      </Typography>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TextField
          multiline
          variant="outlined"
          fullWidth
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder="e.g., ATCG..."
          sx={{ flexGrow: 1, marginBottom: '10px' }}
          InputProps={{
            sx: { 
              height: '100%',
              alignItems: 'flex-start',
            },
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
          >
            Upload File
            <input
              type="file"
              hidden
              onChange={handleFileUpload}
            />
          </Button>
          {fileName && <Typography sx={{ marginLeft: '10px' }}>{fileName}</Typography>}
        </Box>
      </Box>
    </Paper>
  );
};

export default InputPanel;