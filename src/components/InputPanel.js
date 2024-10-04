import React, { useState, useContext, useEffect } from 'react';
import { Paper, Typography, TextField, Box, Button } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { NotificationContext } from '../contexts/NotificationContext';
import { DataTypeContext } from '../contexts/DataTypeContext';
import { detectDataType } from '../utils/detectDataType';

const InputPanel = ({ inputData, setInputData }) => {
  const [fileName, setFileName] = useState('');
  const showNotification = useContext(NotificationContext);
  const { setDataType, validateData } = useContext(DataTypeContext);
  const [isValid, setIsValid] = useState(true);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setInputData(content);
        const detectedType = detectDataType(file.name, content);
        setDataType(detectedType);
        const valid = validateData(content);
        setIsValid(valid);
        if (!valid) {
          showNotification(`Invalid ${detectedType} data format.`, 'error');
        }
      };
      reader.onerror = (e) => {
        console.error('Error reading file:', e);
        showNotification('Failed to read the file.', 'error');
      };
      reader.readAsText(file);
    }
  };

  const handleTextChange = (e) => {
    const content = e.target.value;
    setInputData(content);
    // Assume filename is 'input.txt' for manual text input
    const detectedType = detectDataType('input.txt', content);
    setDataType(detectedType);
    const valid = validateData(content);
    setIsValid(valid);
    if (!valid) {
      showNotification(`Invalid ${detectedType} data format.`, 'error');
    }
  };

  useEffect(() => {
    // Initial validation when component mounts if there's pre-filled inputData
    if (inputData) {
      const detectedType = detectDataType(fileName || 'input.txt', inputData);
      setDataType(detectedType);
      const valid = validateData(inputData);
      setIsValid(valid);
      if (!valid) {
        showNotification(`Invalid ${detectedType} data format.`, 'error');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          onChange={handleTextChange}
          placeholder="e.g., >Sequence1\nATCG..."
          sx={{ flexGrow: 1, marginBottom: '10px' }}
          InputProps={{
            readOnly: false,
            sx: { 
              height: '100%',
              alignItems: 'flex-start',
            },
          }}
          error={!isValid}
          helperText={!isValid ? 'Invalid data format detected.' : ''}
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