import SaveIcon from '@mui/icons-material/Save';
import { Box, IconButton, MenuItem, Paper, Select, TextField, Tooltip, Typography } from '@mui/material';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import React, { useEffect, useState } from 'react';

const OutputPanel = ({ outputData, setOutputData, workflow = null, tool = null, inputData, page, uploadedFiles }) => {
  const iconColor = page === 'WorkflowPage' ? 'primary' : 'secondary';
  const [selectedInput, setSelectedInput] = useState('');

  const handleSaveOutput = () => {
    if (Object.keys(outputData).length === 1) {
      const inputFileName = Object.keys(outputData)[0];
      const outputContent = outputData[inputFileName];
      const blob = new Blob([outputContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${inputFileName}_output.txt`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const zip = new JSZip();
      for (const [inputFileName, outputContent] of Object.entries(outputData)) {
        zip.file(`${inputFileName}_output.txt`, outputContent);
      }
      zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, 'outputs.zip');
      });
    }
  };

  // Clear output data when workflow or input data changes, beacuse the output data is no longer valid
  useEffect(() => {
    if (workflow !== null && !uploadedFiles.hasOwnProperty(selectedInput)) {
      setOutputData({});
    }
  }, [workflow, inputData, uploadedFiles]);

  // Clear output data when tool or input data changes, because the output data is no longer valid
  useEffect(() => {
    if (tool !== null && !uploadedFiles.hasOwnProperty(selectedInput)) {
      setOutputData({});
    }
  }, [tool, inputData, uploadedFiles]);

  // Automatically select the first item in outputData when it has values, and reset when empty
  useEffect(() => {
    if (Object.keys(outputData).length > 0) {
      setSelectedInput(Object.keys(outputData)[0]);
    } else {
      setSelectedInput('');
    }
  }, [outputData]);

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2, flexShrink: 0 }}>
        <Typography variant="h6">Output</Typography>
        <Select
          value={selectedInput}
          onChange={(e) => setSelectedInput(e.target.value)}
          displayEmpty
        >
          <MenuItem value="" disabled>
            Inputs
          </MenuItem>
          {Object.keys(outputData).map((inputFileName) => (
            <MenuItem key={inputFileName} value={inputFileName}>
              {inputFileName}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 2 }}>
        <TextField
          variant="outlined"
          value={selectedInput ? outputData[selectedInput] : ''}
          placeholder="Output Data"
          InputProps={{
            multiline: true,
            inputComponent: 'textarea',
            readOnly: true,
          }}
          rows={8}
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
          <IconButton color={iconColor} onClick={handleSaveOutput}>
            <SaveIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default OutputPanel;
