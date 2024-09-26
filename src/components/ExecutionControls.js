import React, { useState, useEffect } from 'react';
import { Button, FormControlLabel, Checkbox, CircularProgress } from '@mui/material';
import { loadWasmModule } from '../gtoWasm';
import description from '../../description.json'; 

const ExecutionControls = ({ workflow, inputData, setOutputData }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [autoExecute, setAutoExecute] = useState(false);

  const handleRun = async () => {
    console.log('Starting workflow execution');
    console.log('Workflow:', workflow);
    console.log('Input data:', inputData);

    setIsExecuting(true);
    try {
      let data = inputData;
      for (const operation of workflow) {
        const { toolName, params } = operation;
        console.log(`Processing operation: ${toolName}`);

        // Load the wrapper function dynamically
        const runFunction = await loadWasmModule(toolName);
        console.log(`Run function loaded for ${toolName}`);

        // Find tool configuration from description.json
        const toolConfig = description.tools.find(tool => tool.name === `gto_${toolName}`);
        if (!toolConfig) {
          console.error(`Configuration for tool ${toolName} not found in description.json`);
          throw new Error(`Configuration for tool ${toolName} not found.`);
        }
        console.log(`Tool configuration for ${toolName}:`, toolConfig);

        // Prepare arguments based on tool configuration
        let args = [];
        if (params && Object.keys(params).length > 0) {
          args = Object.entries(params)
            .flatMap(([key, value]) => [`--${key}`, `${value}`]);
        }

        // Include flags if any
        if (toolConfig.flags && toolConfig.flags.length > 0) {
          args.push(...toolConfig.flags);
        }

        console.log(`Arguments for ${toolName}:`, args);

        // Execute the tool
        console.log(`Executing ${toolName} with input:`, data);
        const outputData = await runFunction(data, args);
        console.log(`Output from ${toolName}:`, outputData);

        // Update data for the next operation
        data = outputData;
      }
      setOutputData(data);
      console.log('Workflow execution completed successfully');
    } catch (error) {
      console.error('Error executing workflow:', error);
      setOutputData(`Error: ${error.message}`);
    }
    setIsExecuting(false);
  };

  // Auto-Execute: Execute workflow whenever workflow or inputData changes
  useEffect(() => {
    if (autoExecute && workflow.length > 0 && inputData) {
      console.log('Auto-executing workflow');
      handleRun();
    }
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