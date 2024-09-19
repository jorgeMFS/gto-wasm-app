import React, { useState, useEffect } from 'react';
import { Button, FormControlLabel, Checkbox, Typography, CircularProgress } from '@mui/material';

const ExecutionControls = ({ 
  workflow, 
  gtoModules, 
  inputData, 
  setOutputData 
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [autoExecute, setAutoExecute] = useState(false);

  const handleRun = async () => {
    setIsExecuting(true);
    let data = inputData;
    try {
      for (const operation of workflow) {
        const module = gtoModules[operation];
        if (module && module.process) {
          // Assuming each module's 'process' function is synchronous
          data = module.process(data);
        } else {
          console.error(`Module for ${operation} not loaded or missing 'process' function.`);
          throw new Error(`Module for ${operation} not loaded or missing 'process' function.`);
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