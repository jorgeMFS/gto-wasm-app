import { Close, Delete, Folder, Info, Upload, Visibility } from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, Paper, Select, TextField, Tooltip, Typography } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { DataTypeContext } from '../contexts/DataTypeContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { detectDataType } from '../utils/detectDataType';

const InputPanel = ({ inputData, setInputData, uploadedFiles, setUploadedFiles, isInputDataValid, setIsInputDataValid }) => {
  const [fileName, setFileName] = useState('');
  const showNotification = useContext(NotificationContext);
  const { setInputDataType, validateData, inputDataType } = useContext(DataTypeContext);
  const [isAcceptable, setIsAcceptable] = useState(true);
  const [selectedFile, setSelectedFile] = useState('');
  const [openMetadataDialog, setOpenMetadataDialog] = useState(false);
  const [selectedFileForMetadata, setSelectedFileForMetadata] = useState(null);

  // Define acceptable file extensions
  const acceptableExtensions = ['.fasta', '.fa', '.fastq', '.fq', '.pos', '.svg', '.txt', '.num'];

  // Debounce state
  const [debounceTimer, setDebounceTimer] = useState(null);

  const numberOfLines = inputData.split('\n').length;

  // Function to process uploaded files
  const processFile = (file) => {
    const extension = `.${file.name.split('.').pop().toLowerCase()}`;
    if (!acceptableExtensions.includes(extension)) {
      showNotification(`Unsupported file type: ${extension}`, 'error');
      return null;
    }

    const fileSizeLimit = 100 * 1024 * 1024; // 100MB limit
    const isPartial = file.size > fileSizeLimit;
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = (e) => {
        const content = e.target.result.split('\n').slice(0, isPartial ? 100 : undefined).join('\n');
        const detectedType = detectDataType(file.name, content);

        if (!validateData(content, detectedType) && detectedType !== 'UNKNOWN') {
          showNotification(`Invalid ${detectedType} data format in ${file.name}.`, 'error');
          reject();
        }

        resolve({
          name: file.name,
          content,
          type: detectedType,
          size: file.size,
        });
      };

      reader.onerror = () => {
        showNotification(`Failed to read file: ${file.name}`, 'error');
        reject();
      };

      reader.readAsText(isPartial ? file.slice(0, fileSizeLimit) : file);
    });
  };

  // Handle multiple file uploads
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      const processedFiles = await Promise.all(files.map(processFile));
      const validFiles = processedFiles.filter((file) => file !== null);

      if (validFiles.length > 0) {
        const fileTypes = new Set(validFiles.map((file) => file.type));
        if (fileTypes.size > 1) {
          showNotification('All files must have the same data type.', 'error');
          return;
        }

        const newFileType = validFiles[0].type;
        if (inputDataType !== 'UNKNOWN' && inputDataType !== newFileType) {
          showNotification(`Uploaded file type (${newFileType}) does not match the current input data type (${inputDataType}).`, 'error');
          return;
        }

        setUploadedFiles([...uploadedFiles, ...validFiles]);
        setInputDataType(validFiles[0].type);
      }
    } catch (error) {
      console.error('File processing error:', error);
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
      if (content.trim() === '' && uploadedFiles.length === 0) {
        // If input is empty, reset data type and validation
        setInputDataType('UNKNOWN');
        setIsInputDataValid(true); // Treat empty input as valid. Adjust based on requirements
        return;
      }

      const detectedType = detectDataType('input.txt', content);
      const valid = validateData(content, inputDataType);

      setIsInputDataValid(valid);

      if (!valid && detectedType !== 'UNKNOWN') {
        showNotification(`Invalid ${detectedType} data format.`, 'error');
      }

      if (uploadedFiles.length > 0) {
        if (detectedType !== 'UNKNOWN' && detectedType !== inputDataType) {
          showNotification(`Manual input data type (${detectedType}) does not match the uploaded files data type (${inputDataType}).`, 'error');
        }
      } else {
        setInputDataType(detectedType);
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

  // Function to open metadata dialog and store the index of the file
  const handleViewMetadata = (file) => {
    setSelectedFileForMetadata(file);
    setOpenMetadataDialog(true);
  };

  // Function to close metadata dialog
  const handleCloseMetadataDialog = () => {
    setOpenMetadataDialog(false);
    setSelectedFileForMetadata(null);
  };

  // Remove file from the uploaded files list
  const handleRemoveFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);

    if (newFiles.length === 0 && inputData.trim() === '') {
      setInputDataType('UNKNOWN');
    } else if (newFiles.length === 0 && inputData.trim() !== '') {
      setInputDataType(detectDataType('input.txt', inputData));
    }
  }

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6">Input:</Typography>
          <Typography variant="body1" color="textSecondary" sx={{ marginLeft: 1 }}>
            {inputDataType}
          </Typography>
        </Box>
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
          inputProps={{ maxLength: 100000 }}
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
          error={inputData.trim() !== '' && uploadedFiles.length > 0 && inputDataType !== 'UNKNOWN' && !isInputDataValid}
          helperText={(inputData.trim() !== '' && uploadedFiles.length > 0 && inputDataType !== 'UNKNOWN' && !isInputDataValid) ? `The entered data does not conform to the expected ${inputDataType} format.` : ''}
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
        <Typography variant="caption" color="textSecondary" sx={{ marginRight: 'auto' }}>
          {inputData.length}/100000 characters, {numberOfLines} lines
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* File Counter */}
          <Typography variant="caption" color="textSecondary" sx={{ marginRight: 1 }}>
            {uploadedFiles.length} file(s)
          </Typography>
          {/* File Selection Dropdown */}
          <Tooltip
            title="View Uploaded Files"
            placement="top"
            PopperProps={{
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -8], // Ajuste a margem conforme necessário
                  },
                },
              ],
            }}>
            <IconButton
              color="primary"
              sx={{
                padding: '6px',
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                color: 'white',
              }}
            >
              <Folder fontSize="small" />
              <Select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                displayEmpty
                sx={{
                  position: 'absolute',
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  top: 0,
                  left: 0,
                }}
              >
                {uploadedFiles.length > 0 ? (
                  uploadedFiles.map((file, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                      }}
                    >
                      <Typography variant="body1" sx={{ flexGrow: 1, marginRight: "10px" }}>
                        {file.name}
                      </Typography>
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation();
                          handleViewMetadata(file);
                        }}
                        size="small"
                        sx={{ marginRight: "8px" }}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  ))
                ) : (
                  <Typography sx={{ padding: 1, textAlign: "center", color: "gray" }}>
                    No files uploaded
                  </Typography>
                )}
              </Select>
            </IconButton>
          </Tooltip>
          <Tooltip title="Upload File"
            placement="top"
            PopperProps={{
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -8], // Ajuste a margem conforme necessário
                  },
                },
              ],
            }}>
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
              <Upload fontSize="small" />
              <input type="file" hidden multiple accept={acceptableExtensions.join(',')} onChange={handleFileUpload} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Metadata Dialog */}
      <Dialog open={openMetadataDialog} onClose={handleCloseMetadataDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'primary.main',
          color: 'primary.contrastText'
        }}>
          <Info /> File Information
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedFileForMetadata ? (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1" gutterBottom>{selectedFileForMetadata.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                  <Typography variant="body1" gutterBottom>{selectedFileForMetadata.type}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Size</Typography>
                  <Typography variant="body1" gutterBottom>
                    {(selectedFileForMetadata.size / 1024).toFixed(2)} KB
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Preview
              </Typography>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  bgcolor: 'grey.100',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  '&:hover': {
                    boxShadow: 6,
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}
                >
                  {selectedFileForMetadata.content.slice(0, 300)}
                  {selectedFileForMetadata.content.length > 300 ? '...' : ''}
                </Typography>
              </Paper>
            </Box>
          ) : (
            <Typography>Loading...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseMetadataDialog}
            color="primary"
            variant="contained"
            startIcon={<Close />}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default InputPanel;
