import React, { useState, useContext, useEffect } from 'react';
import { Paper, Typography, TextField, Box, Button } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { NotificationContext } from '../contexts/NotificationContext';
import { DataTypeContext } from '../contexts/DataTypeContext';
import { detectDataType } from '../utils/detectDataType';

const InputPanel = ({ inputData, setInputData }) => {
  const [fileName, setFileName] = useState('');
  const showNotification = useContext(NotificationContext);
  const { setDataType, validateData, dataType } = useContext(DataTypeContext);
  const [isValid, setIsValid] = useState(true);
  const [isAcceptable, setIsAcceptable] = useState(true);

  // Define acceptable file extensions
  const acceptableExtensions = ['.fasta', '.fa', '.fastq', '.fq', '.pos', '.svg', '.txt', '.num'];

  // Debounce state
  const [debounceTimer, setDebounceTimer] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const extension = `.${file.name.split('.').pop().toLowerCase()}`;
      if (!acceptableExtensions.includes(extension)) {
        showNotification(`Unsupported file type: ${extension}`, 'error');
        setIsAcceptable(false);
        setFileName('');
        setInputData('');
        setIsValid(false);
        setDataType('UNKNOWN'); // Reset data type
        return;
      }

      setFileName(file.name);
      setIsAcceptable(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setInputData(content);
        const detectedType = detectDataType(file.name, content);
        console.log(`Detected Type for uploaded file: ${detectedType}`); // Debugging
        setDataType(detectedType);
        const valid = validateData(content, detectedType); // Pass detectedType
        setIsValid(valid);
        if (!valid && detectedType !== 'UNKNOWN') {
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

    // Clear existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set a new debounce timer
    const timer = setTimeout(() => {
      if (content.trim() === '') {
        // If input is empty, reset data type and validation
        setDataType('UNKNOWN');
        setIsValid(true); // Treat empty input as valid. Adjust based on requirements
        return;
      }

      const detectedType = detectDataType('input.txt', content);
      console.log(`Detected Type for manual input: ${detectedType}`); // Debugging
      setDataType(detectedType);
      const valid = validateData(content, detectedType); // Pass detectedType
      setIsValid(valid);

      if (!valid && detectedType !== 'UNKNOWN') {
        showNotification(`Invalid ${detectedType} data format.`, 'error');
      }
    }, 1000); // 1000ms delay

    setDebounceTimer(timer);
  };

  // Cleanup the debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <Paper elevation={3} sx={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          placeholder="e.g., >Sequence1\nACGT..."
          sx={{ 
            flexGrow: 1, 
            marginBottom: '10px',
            fontSize: '0.875rem', // Reduced font size
            maxHeight: '300px', // Set maximum height
            overflowY: 'auto', // Enable vertical scrolling
          }}
          InputProps={{
            readOnly: false,
            sx: { 
              height: '100%',
              alignItems: 'flex-start',
              fontSize: '0.875rem', // Ensure font size inside input matches
            },
          }}
          error={!isValid && dataType !== 'UNKNOWN'}
          helperText={!isValid && dataType !== 'UNKNOWN' ? `The entered data does not conform to the expected ${dataType} format.` : ''}
        />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            sx={{
              backgroundColor: isAcceptable ? 'primary.main' : 'grey.500',
              '&:hover': {
                backgroundColor: isAcceptable ? 'primary.dark' : 'grey.500',
              },
              cursor: isAcceptable ? 'pointer' : 'not-allowed',
            }}
            disabled={!isAcceptable}
          >
            Upload File
            <input
              type="file"
              hidden
              accept={acceptableExtensions.join(',')}
              onChange={handleFileUpload}
            />
          </Button>
          {fileName && <Typography sx={{ marginLeft: '10px', fontSize: '0.875rem' }}>{fileName}</Typography>}
        </Box>
      </Box>
      <Box sx={{ marginTop: '10px' }}>
        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem' }}>
          Current Data Type: {dataType}
        </Typography>
        {!isValid && dataType !== 'UNKNOWN' && (
          <Typography variant="body2" color="error" sx={{ fontSize: '0.875rem' }}>
            The entered data does not conform to the expected {dataType} format.
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default InputPanel;