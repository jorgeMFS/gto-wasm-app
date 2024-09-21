import React, { useState, useEffect } from 'react';
import { Button, FormControlLabel, Checkbox, CircularProgress } from '@mui/material';
import { loadWasmModule } from '../gtoWasm';
import description from '../../description.json'; 

const ExecutionControls = ({ workflow, inputData, setOutputData }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [autoExecute, setAutoExecute] = useState(false);

  const handleRun = async () => {
    setIsExecuting(true);
    let data = inputData;
    try {
      for (const operation of workflow) {
        const { toolName, params } = operation;

        // Load the wrapper function dynamically
        const runFunction = await loadWasmModule(toolName);

        if (typeof runFunction === 'function') {
          // Find tool configuration from description.json
          const toolConfig = description.tools.find(tool => tool.name === toolName);
          if (!toolConfig) {
            throw new Error(`Configuration for tool ${toolName} not found.`);
          }

          let args = [];
          if (params && Object.keys(params).length > 0) {
            args = Object.entries(params)
              .flatMap(([key, value]) => [`--${key}`, `${value}`]);
          }

          // Execute the tool
          const outputData = await runFunction(data, args);

          // Update data for the next operation
          data = outputData;
        } else {
          throw new Error(`Function run_${toolName} not found.`);
        }
      }
      setOutputData(data);
    } catch (error) {
      console.error('Error executing workflow:', error);
      setOutputData(`Error: ${error.message}`);
    }
    setIsExecuting(false);
  };

  // Auto-Execute: Execute workflow whenever workflow or inputData changes
  useEffect(() => {
    if (autoExecute && workflow.length > 0 && inputData) {
      handleRun();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow, inputData, autoExecute]);

  return (
    <div style={{ marginTop: '20px', textAlign: 'center' }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleRun}
        disabled={workflow.length === 0 || isExecuting}
      >
        {isExecuting ? <CircularProgress size={24} /> : 'Run'}
      </Button>
      <FormControlLabel
        control={
          <Checkbox
            checked={autoExecute}
            onChange={(e) => setAutoExecute(e.target.checked)}
            color="primary"
          />
        }
        label="Auto Execute (Auto Bake)"
        style={{ marginLeft: '20px' }}
      />
    </div>
  );
};

export default ExecutionControls;