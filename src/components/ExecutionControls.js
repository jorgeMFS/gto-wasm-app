import { Box, Button, Checkbox, CircularProgress, FormControlLabel } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import description from '../../description.json';
import { DataTypeContext } from '../contexts/DataTypeContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { ValidationErrorsContext } from '../contexts/ValidationErrorsContext';
import { loadWasmModule } from '../gtoWasm';
import { detectDataType } from '../utils/detectDataType';

const ExecutionControls = ({ workflow, inputData, setOutputData }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [autoExecute, setAutoExecute] = useState(false);
  const { validationErrors, setValidationErrors } = useContext(ValidationErrorsContext); // Access validation errors
  const { setDataType } = useContext(DataTypeContext);
  const showNotification = useContext(NotificationContext);

  // Validate parameters for a single tool
  const validateParameters = (operation) => {
    const toolConfig = description.tools.find((tool) => tool.name === `gto_${operation.toolName}`);
    if (!toolConfig) return { isValid: true, errors: '' };

    const errors = {};

    toolConfig.flags.forEach((flagObj) => {
      const isFlagRequired = flagObj.required;
      const flagValue = !!operation.params[flagObj.flag]; // Check if the flag is active
      const paramValue = operation.params[flagObj.parameter];
      const paramConfig = toolConfig.parameters.find((param) => param.name === flagObj.parameter);

      if (paramConfig) {
        if (isFlagRequired || flagValue) { // Check if the flag is required or active
          if (paramConfig.type === 'integer' && !/^-?\d+$/.test(paramValue)) {
            errors[flagObj.parameter] = 'Invalid integer value';
          } else if (paramConfig.type === 'float' && !/^-?\d+(\.\d+)?$/.test(paramValue)) {
            errors[flagObj.parameter] = 'Invalid float value';
          } else if (paramValue === undefined || paramValue === '') {
            errors[flagObj.parameter] = 'Parameter value cannot be empty';
          }
        }
      } else if (isFlagRequired && (paramValue === undefined || paramValue === '')) {
        errors[flagObj.flag] = 'Required flag cannot be empty';
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        [operation.id]: errors,
      }));
      const errorMessages = Object.values(errors).join('\n');
      return { isValid: false, errors: errorMessages };
    } else {
      // Clear errors for this operation if validation passed
      setValidationErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[operation.id];
        return newErrors;
      });
      return { isValid: true, errors: '' };
    }
  };

  const handleRun = async () => {
    setIsExecuting(true);
    try {
      let data = inputData;

      for (const operation of workflow) {
        // Validate parameters before executing each tool
        const { isValid, errors } = validateParameters(operation);
        if (!isValid) {
          showNotification('Invalid input detected for tool "' + operation.toolName + '". Please correct the inputs in red.', 'error');
          setIsExecuting(false);
          return;
        }

        const { toolName, params } = operation;
        const runFunction = await loadWasmModule(toolName);

        const toolConfig = description.tools.find((tool) => tool.name === `gto_${toolName}`);
        if (!toolConfig) {
          showNotification(`Configuration for tool ${toolName} not found.`, 'error');
          throw new Error(`Configuration for tool ${toolName} not found.`);
        }

        // Prepare arguments for execution
        let args = [];
        toolConfig.flags.forEach((flagObj) => {
          if (params[flagObj.parameter]) {
            args.push(flagObj.flag);
            if (
              flagObj.parameter &&
              params[flagObj.parameter] !== undefined &&
              params[flagObj.parameter] !== ''
            ) {
              args.push(`${params[flagObj.parameter]}`);
            }
          }
        });


        // Execute the tool
        const outputData = await runFunction(data, args);

        // Handle messages in stderr
        let hasInfoMessage = false;
        if (outputData.stderr) {
          const stderrLines = outputData.stderr.split('\n');
          let infoMessages = []; // Accumulate all informational messages

          stderrLines.forEach((line) => {
            if (line.trim().startsWith('ERROR:')) {
              throw new Error(line.trim()); // Treat as an error
            } else if (line.trim()) {
              infoMessages.push(line.trim()); // Accumulate info messages
              hasInfoMessage = true;
            }
          });

          // Display all accumulated informational messages together
          if (infoMessages.length > 0) {
            showNotification(infoMessages.join('\n'), 'info');
          }
        }

        data = outputData.stdout;
      }

      const detectedType = detectDataType('output.txt', data);
      setDataType(detectedType);
      setOutputData(data);
      showNotification('Workflow executed successfully!', 'success');
    } catch (error) {
      setOutputData(`Error: ${error.message}`);
      showNotification(`Workflow execution failed: ${error.message}`, 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  // Auto-Execute: Execute workflow whenever workflow or inputData changes
  useEffect(() => {
    if (autoExecute && workflow.length > 0 && inputData) {
      handleRun();
    }
  }, [workflow, inputData, autoExecute]);

  return (
    <Box sx={{ textAlign: 'center', position: 'relative' }}>
      {/* Overlay to block interaction */}
      {Object.values(validationErrors).some(error => Object.keys(error).length > 0) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 10,
            pointerEvents: 'all',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* <Block sx={{
            color: 'error.main',
            fontSize: 80,
            padding: 2,
          }} /> */}
        </Box>
      )}
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