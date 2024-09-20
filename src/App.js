import React, { useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import OperationsPanel from './components/OperationsPanel';
import RecipePanel from './components/RecipePanel';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import ExecutionControls from './components/ExecutionControls';
import { 
  Container, 
  Typography, 
  Grid, 
} from '@mui/material';

const App = () => {
  const [workflow, setWorkflow] = useState([]); // Array to hold the sequence of operations
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');

  const handleAddOperation = (toolName, params = {}) => {
    // Generate a unique ID for the operation
    const uniqueId = `${toolName}-${Date.now()}`;
    const newOperation = {
      id: uniqueId,
      toolName,
      params,
    };
    setWorkflow([...workflow, newOperation]);
  };

  return (
    <ErrorBoundary>
      <Container maxWidth="lg">
        <Typography variant="h4" align="center" gutterBottom>
          GTO WebAssembly Application
        </Typography>
        <Grid container spacing={3}>
          {/* Operations Panel */}
          <Grid item xs={12} md={6}>
            <OperationsPanel onAddOperation={handleAddOperation} />
          </Grid>

          {/* Recipe/Workflow Panel */}
          <Grid item xs={12} md={6}>
            <RecipePanel 
              workflow={workflow} 
              setWorkflow={setWorkflow} 
            />
          </Grid>

          {/* Input and Output Panels */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InputPanel inputData={inputData} setInputData={setInputData} />
              </Grid>
              <Grid item xs={12} md={6}>
                <OutputPanel outputData={outputData} setOutputData={setOutputData} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Execution Controls */}
        <ExecutionControls 
          workflow={workflow} 
          inputData={inputData} 
          setOutputData={setOutputData} 
        />
      </Container>
    </ErrorBoundary>
  );
};

export default App;