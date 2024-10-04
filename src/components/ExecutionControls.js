import React, { useState, useEffect, useContext } from 'react';
import { Button, FormControlLabel, Checkbox, CircularProgress } from '@mui/material';
import { loadWasmModule } from '../gtoWasm';
import description from '../../description.json'; 
import { NotificationContext } from '../contexts/NotificationContext';

const ExecutionControls = ({ workflow, inputData, setOutputData }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [autoExecute, setAutoExecute] = useState(false);
  const showNotification = useContext(NotificationContext);

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
          showNotification(`Configuration for tool ${toolName} not found.`, 'error');
          throw new Error(`Configuration for tool ${toolName} not found.`);
        }
        console.log(`Tool configuration for ${toolName}:`, toolConfig);

        // Prepare arguments based on tool configuration and user-set parameters
        let args = [];
        if (params && Object.keys(params).length > 0) {
          toolConfig.parameters.forEach(param => {
            if (params[param.name] !== undefined && params[param.name] !== '') {
              args.push(`--${param.name}`);
              args.push(`${params[param.name]}`);
            }
          });
          toolConfig.flags.forEach(flag => {
            if (params[flag]) {
              args.push(flag);
            }
          });
        }
        console.log(`Arguments for ${toolName}:`, args);

        // Execute the tool
        console.log(`Executing ${toolName} with input:`, data);
        const outputData = await runFunction(data, args);
        console.log(`Output from ${toolName}:`, outputData);

        // Check for errors in the output
        if (outputData.stderr) {
          showNotification(`Error in ${toolName}: ${outputData.stderr}`, 'error');
          throw new Error(outputData.stderr);
        }

        // Update data for the next operation
        data = `\n${outputData.stdout}\n\nSTDERR:\n${outputData.stderr}`;
      }
      setOutputData(data);
      console.log('Workflow execution completed successfully');
      showNotification('Workflow executed successfully!', 'success');
    } catch (error) {
      console.error('Error executing workflow:', error);
      setOutputData(`Error: ${error.message}`);
      showNotification(`Workflow execution failed: ${error.message}`, 'error');
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