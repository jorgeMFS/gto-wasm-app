import React, { useState } from 'react';
import { loadWasmModule } from './gtoWasm';
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
  Paper, 
  CircularProgress 
} from '@mui/material';

const App = () => {
  const [gtoModules, setGtoModules] = useState({});
  const [error, setError] = useState(null);
  const [workflow, setWorkflow] = useState([]); // Array to hold the sequence of operations
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');

  const loadSelectedTool = async (toolName) => {
    if (gtoModules[toolName]) {
      return;
    }
    try {
      const module = await loadWasmModule(toolName);
      setGtoModules((prev) => ({ ...prev, [toolName]: module }));
    } catch (err) {
      console.error(`Error loading tool ${toolName}:`, err);
      setError(err.message);
    }
  };

  const handleAddOperation = async (toolName) => {
    // Generate a unique ID for the operation
    const uniqueId = `${toolName}-${Date.now()}`;
    // Add the tool to the workflow
    setWorkflow((prev) => [...prev, uniqueId]);
    // Load the module if not already loaded
    if (!gtoModules[toolName]) {
      await loadSelectedTool(toolName);
    }
  };
  return (
    <ErrorBoundary>
      <Container maxWidth="xl" style={{ marginTop: '20px' }}>
        <Typography variant="h4" gutterBottom align="center">
          GTO CyberChef
        </Typography>
        <Grid container spacing={2}>
          {/* Operations Panel */}
          <Grid item xs={3}>
            <OperationsPanel onAddOperation={handleAddOperation} />
          </Grid>

          {/* Recipe/Workflow Panel */}
          <Grid item xs={6}>
            <RecipePanel 
              workflow={workflow} 
              setWorkflow={setWorkflow} 
              gtoModules={gtoModules} 
            />
          </Grid>

          {/* Input and Output Panels */}
          <Grid item xs={3}>
            <InputPanel inputData={inputData} setInputData={setInputData} />
            <OutputPanel outputData={outputData} setOutputData={setOutputData} />
          </Grid>
        </Grid>

        {/* Execution Controls */}
        <ExecutionControls 
          workflow={workflow} 
          gtoModules={gtoModules} 
          inputData={inputData} 
          setOutputData={setOutputData} 
        />

        {/* Display Errors */}
        {error && (
          <Typography color="error" align="center" style={{ marginTop: '20px' }}>
            Error loading GTO modules: {error}
          </Typography>
        )}
      </Container>
    </ErrorBoundary>
  );
};

export default App;