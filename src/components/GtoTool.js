import React, { useState } from 'react';
import { Button, TextField, CircularProgress, Typography } from '@mui/material';
import { loadWasmModule } from '../gtoWasm';

const GtoTool = ({ name, inputType }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [params, setParams] = useState({});

  const runTool = async () => {
    setIsRunning(true);
    setError(null);
    setOutput('');

    try {
      // Load the wrapper function
      const runFunction = await loadWasmModule(name);

      if (typeof runFunction === 'function') {
        // Prepare command-line arguments
        let args = [];
        if (params && Object.keys(params).length > 0) {
          args = Object.entries(params)
            .flatMap(([key, value]) => [`--${key}`, `${value}`]);
        }

        // Run the function with input and arguments
        const outputData = await runFunction(input, args);

        setOutput(outputData);
      } else {
        throw new Error(`Function run_${name} not found.`);
      }
    } catch (err) {
      console.error(`Error running tool ${name}:`, err);
      setError(`Error: ${err.message}`);
    }

    setIsRunning(false);
  };

  // UI for setting hyperparameters
  const renderParamsInput = () => {
    switch (name) {
      case 'fasta_extract':
        return (
          <>
            <TextField
              label="Start Position"
              type="number"
              variant="outlined"
              fullWidth
              value={params.init || ''}
              onChange={(e) => setParams({ ...params, init: e.target.value })}
              style={{ marginTop: '10px' }}
            />
            <TextField
              label="End Position"
              type="number"
              variant="outlined"
              fullWidth
              value={params.end || ''}
              onChange={(e) => setParams({ ...params, end: e.target.value })}
              style={{ marginTop: '10px' }}
            />
          </>
        );
      // Add cases for other tools with hyperparameters
      default:
        return null;
    }
  };

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
      {renderParamsInput()}
      <Button
        variant="contained"
        color="primary"
        onClick={runTool}
        disabled={isRunning}
        style={{ marginTop: '10px' }}
      >
        {isRunning ? <CircularProgress size={24} /> : 'Run'}
      </Button>
      {output && (
        <>
          <Typography variant="h6" style={{ marginTop: '10px' }}>Output:</Typography>
          <TextField
            multiline
            rows={10}
            variant="outlined"
            fullWidth
            value={output}
            InputProps={{
              readOnly: true,
            }}
          />
        </>
      )}
      {error && <Typography color="error" style={{ marginTop: '10px' }}>{error}</Typography>}
    </div>
  );
};

export default GtoTool;