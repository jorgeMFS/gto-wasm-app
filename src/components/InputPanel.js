import UploadIcon from '@mui/icons-material/Upload';
import { Box, IconButton, Paper, TextField, Tooltip, Typography } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { DataTypeContext } from '../contexts/DataTypeContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { detectDataType } from '../utils/detectDataType';

const InputPanel = ({ inputData, setInputData }) => {
  const [fileName, setFileName] = useState('');
  const showNotification = useContext(NotificationContext);
  const { setInputDataType, validateData, inputDataType } = useContext(DataTypeContext);
  const [isValid, setIsValid] = useState(true);
  const [isAcceptable, setIsAcceptable] = useState(true);

  // Define acceptable file extensions
  const acceptableExtensions = ['.fasta', '.fa', '.fastq', '.fq', '.pos', '.svg', '.txt', '.num'];

  // Debounce state
  const [debounceTimer, setDebounceTimer] = useState(null);

  const processFileContent = (file, content, isPartial) => {
    const lines = isPartial ? content.split('\n').slice(0, 100).join('\n') : content;
    setInputData(lines);

    const detectedType = detectDataType(file.name, lines);
    setInputDataType(detectedType);
    const valid = validateData(lines, detectedType);
    setIsValid(valid);

    if (!valid && detectedType !== 'UNKNOWN') {
      showNotification(`Invalid ${detectedType} data format.`, 'error');
    } else if (isPartial) {
      showNotification("Processing the first 100 lines of the file.", 'success');
    }
  };

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
        setInputDataType('UNKNOWN'); // Reset data type
        return;
      }

      const fileSizeLimit = 100 * 1024 * 1024; // 100 MB in bytes
      const isPartial = file.size > fileSizeLimit;
      if (isPartial) {
        showNotification("Uploaded file is too large. Only the first 100 lines will be processed.", 'warning');
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        processFileContent(file, content, isPartial);
      };
      reader.onerror = (e) => {
        console.error('Error reading file:', e);
        showNotification('Failed to read the file.', 'error');
      };

      // if file size is too large, read only the first 100 MB
      if (isPartial) {
        reader.readAsText(file.slice(0, fileSizeLimit));
      } else {
        reader.readAsText(file);
      }
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
        setInputDataType('UNKNOWN');
        setIsValid(true); // Treat empty input as valid. Adjust based on requirements
        return;
      }

      const detectedType = detectDataType('input.txt', content);
      setInputDataType(detectedType);
      const valid = validateData(content, detectedType);

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

  const numberOfLines = inputData.split('\n').length;

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2 }}>
        <Typography variant="h6">Input</Typography>
        <Typography variant="body2" color="textSecondary">
          {inputDataType}
        </Typography>
      </Box>
      {/* TextField with dynamic height */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 2 }}>
        <TextField
          variant="outlined"
          value={inputData}
          onChange={handleTextChange}
          placeholder="e.g., >Sequence1\nACGT..."
          InputProps={{
            multiline: true,
            inputComponent: 'textarea',
          }}
          rows={10}
          sx={{
            flexGrow: 1,
            flexShrink: 1,
            overflow: 'auto',
            minHeight: '100px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '0.875rem',
          }}
          error={!isValid && inputDataType !== 'UNKNOWN'}
          helperText={!isValid && inputDataType !== 'UNKNOWN' ? `The entered data does not conform to the expected ${inputDataType} format.` : ''}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 1,
          flexShrink: 0,
        }}
      >
        <Typography variant="body2" color="textSecondary">
          {inputData.length} characters, {numberOfLines} lines
        </Typography>
        <Tooltip title="Upload File">
          <IconButton
            color="primary"
            component="label"
            sx={{
              padding: '6px',
              backgroundColor: isAcceptable ? 'primary.main' : 'grey.500',
              '&:hover': {
                backgroundColor: isAcceptable ? 'primary.dark' : 'grey.500',
              },
              cursor: isAcceptable ? 'pointer' : 'not-allowed',
              color: 'white',
            }}
            disabled={!isAcceptable}
          >
            <UploadIcon fontSize="small" />
            <input
              type="file"
              hidden
              accept={acceptableExtensions.join(',')}
              onChange={handleFileUpload}
            />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default InputPanel;
