import React, { useState, useEffect } from 'react';
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
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import Box from '@mui/material/Box';

const App = () => {
  const [workflow, setWorkflow] = useState([]);
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [isOperationsPanelExpanded, setIsOperationsPanelExpanded] = useState(true);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddOperation = (toolName, params = {}) => {
    const uniqueId = `${toolName}-${Date.now()}`;
    const newOperation = {
      id: uniqueId,
      toolName,
      params,
    };
    setWorkflow([...workflow, newOperation]);
  };

  const toggleOperationsPanel = () => {
    setIsOperationsPanelExpanded(!isOperationsPanelExpanded);
  };

  const containerStyle = {
    height: isMobile ? 'auto' : `${windowHeight}px`,
    overflow: isMobile ? 'auto' : 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const mainContentStyle = {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
  };

  return (
    <ErrorBoundary>
      <Container maxWidth="xl" style={containerStyle}>
        <Typography variant="h4" align="center" gutterBottom>
          GTO WebAssembly Application
        </Typography>
        <div style={mainContentStyle}>
          <Grid container spacing={2} style={{ height: '100%' }}>
            {/* Operations Panel */}
            <Grid item xs={3} style={{ height: '100%', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <IconButton onClick={toggleOperationsPanel}>
                  {isOperationsPanelExpanded ? <ChevronLeft /> : <ChevronRight />}
                </IconButton>
              </div>
              <OperationsPanel 
                onAddOperation={handleAddOperation} 
                isOperationsPanelExpanded={isOperationsPanelExpanded}
              />
            </Grid>

            {/* Recipe/Workflow Panel */}
            <Grid item xs={6} style={{ height: '100%', overflow: 'auto' }}>
              <RecipePanel 
                workflow={workflow} 
                setWorkflow={setWorkflow} 
              />
            </Grid>

            {/* Input and Output Panels */}
            <Grid item xs={3} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ flex: 1, minHeight: 0, marginBottom: '10px' }}>
                  <InputPanel inputData={inputData} setInputData={setInputData} />
                </Box>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <OutputPanel outputData={outputData} setOutputData={setOutputData} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </div>
        
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