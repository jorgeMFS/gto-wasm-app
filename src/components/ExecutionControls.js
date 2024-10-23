import { Box, Button, Checkbox, CircularProgress, FormControlLabel } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import description from '../../description.json';
import { DataTypeContext } from '../contexts/DataTypeContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { loadWasmModule } from '../gtoWasm';
import { detectDataType } from '../utils/detectDataType';

const ExecutionControls = ({ workflow, inputData, setOutputData }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [autoExecute, setAutoExecute] = useState(false);
  const { setDataType } = useContext(DataTypeContext); // To update data type context
  const showNotification = useContext(NotificationContext);

  const handleRun = async () => {
    setIsExecuting(true);
    try {
      let data = inputData;
      for (const operation of workflow) {
        const { toolName, params } = operation;

        // Load the wrapper function dynamically
        const runFunction = await loadWasmModule(toolName);

        // Find tool configuration from description.json
        const toolConfig = description.tools.find((tool) => tool.name === `gto_${toolName}`);
        if (!toolConfig) {
          showNotification(`Configuration for tool ${toolName} not found.`, 'error');
          throw new Error(`Configuration for tool ${toolName} not found.`);
        }

        // Prepare arguments based on tool configuration and user-set parameters
        let args = [];
        if (params && Object.keys(params).length > 0) {
          toolConfig.parameters.forEach((param) => {
            if (params[param.name] !== undefined && params[param.name] !== '') {
              args.push(`--${param.name}`);
              args.push(`${params[param.name]}`);
            }
          });
          toolConfig.flags.forEach((flag) => {
            if (params[flag]) {
              args.push(flag);
            }
          });
        }

        // Execute the tool
        const outputData = await runFunction(data, args);

        // Check for errors in the output
        if (outputData.stderr) {
          showNotification(`Error in ${toolName}: ${outputData.stderr}`, 'error');
          throw new Error(outputData.stderr);
        }

        // Update data for the next operation
        data = outputData.stdout;
      }

      // Detect data type of the final output
      const detectedType = detectDataType('output.txt', data);
      setDataType(detectedType); // Update data type context
      showNotification(`Data type updated to ${detectedType}`, 'info');

      setOutputData(data);
      showNotification('Workflow executed successfully!', 'success');
    } catch (error) {
      setOutputData(`Error: ${error.message}`);
      showNotification(`Workflow execution failed: ${error.message}`, 'error');
    }
    setIsExecuting(false);
  };

  // Auto-Execute: Execute workflow whenever workflow or inputData changes
  useEffect(() => {
    if (autoExecute && workflow.length > 0 && inputData) {
      handleRun();
    }
  }, [workflow, inputData, autoExecute]);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleRun}
        disabled={workflow.length === 0 || isExecuting}
        startIcon={isExecuting ? <CircularProgress size={20} /> : null}
      >
        {isExecuting ? 'Running...' : 'Run Workflow'}
      </Button>
      <FormControlLabel
        control={
          <Checkbox
            checked={autoExecute}
            onChange={(e) => setAutoExecute(e.target.checked)}
            color="primary"
          />
        }
        label="Auto Execute"
        sx={{ marginLeft: 2 }}
      />
    </Box>
  );
};

export default ExecutionControls;
