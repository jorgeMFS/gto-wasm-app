import React, { useState, useEffect } from 'react';
import { Button, TextField, CircularProgress, Typography } from '@mui/material';

const GtoTool = ({ name, module, inputType }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const allocatedPointers = [];

  const runTool = async () => {
    setIsRunning(true);
    setError(null);
    setOutput('');
    try {
      let inputArray;
      if (inputType === 'file') {
        const arrayBuffer = await input.arrayBuffer();
        inputArray = new Uint8Array(arrayBuffer);
      } else {
        inputArray = new TextEncoder().encode(input);
      }

      const inputPtr = module._malloc(inputArray.length);
      module.HEAPU8.set(inputArray, inputPtr);
      allocatedPointers.push(inputPtr);

      const argvPtr = module._malloc(2 * 4);
      module.setValue(argvPtr, inputPtr, 'i32');
      module.setValue(argvPtr + 4, 0, 'i32');
      allocatedPointers.push(argvPtr);

      const argc = 1;
      const outputPtr = module.ccall('main', 'number', ['number', 'number'], [argc, argvPtr]);
      allocatedPointers.push(outputPtr);

      const outputLength = inputArray.length;
      const outputArray = new Uint8Array(module.HEAPU8.buffer, outputPtr, outputLength);
      const outputText = new TextDecoder().decode(outputArray);

      setOutput(outputText);
    } catch (err) {
      console.error(`Error running tool ${name}:`, err);
      setError(`Error: ${err.message}`);
    }
    setIsRunning(false);
  };

  useEffect(() => {
    return () => {
      allocatedPointers.forEach(ptr => {
        module._free(ptr);
      });
    };
  }, [allocatedPointers, module]);

  return (
    <div>
      <Typography variant="h6">{name}</Typography>
      {inputType === 'file' ? (
        <input type="file" onChange={(e) => setInput(e.target.files[0])} />
      ) : (
        <TextField
          label="Input"
          multiline
          rows={10}
          variant="outlined"
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      )}
      <Button variant="contained" color="primary" onClick={runTool} disabled={isRunning} style={{ marginTop: '10px' }}>
        {isRunning ? <CircularProgress size={24} /> : 'Run'}
      </Button>
      {output && (
        <>
          <Typography variant="h6" style={{ marginTop: '10px' }}>Output:</Typography>
          <pre>{output}</pre>
        </>
      )}
      {error && <Typography color="error" style={{ marginTop: '10px' }}>{error}</Typography>}
    </div>
  );
};

export default GtoTool;