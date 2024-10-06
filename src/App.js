import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import OperationsPanel from './components/OperationsPanel';
import RecipePanel from './components/RecipePanel';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import ExecutionControls from './components/ExecutionControls';
import { 
  Container, 
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Box from '@mui/material/Box';
import BioChefLogo from '../img/BioChef.svg';

const App = () => {
  const [workflow, setWorkflow] = useState([]);
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
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

  const containerStyle = {
    height: isMobile ? 'auto' : `${windowHeight}px`,
    overflow: isMobile ? 'auto' : 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'transparent',
  };

  const mainContentStyle = {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <ErrorBoundary>
      <Container maxWidth="xl" style={containerStyle}>
        <Box sx={{ display: 'flex', justifyContent: 'center', marginY: 4 }}>
          <BioChefLogo style={{ maxWidth: '200px', width: '100%', height: 'auto' }} />
        </Box>
        <div style={mainContentStyle}>
          <Grid container spacing={3} style={{ flex: 1, minHeight: 0 }}>
            {/* Operations Panel */}
            <Grid item xs={12} sm={3} md={3} lg={3} xl={3} style={{ height: '100%', overflow: 'hidden' }}>
              <OperationsPanel 
                onAddOperation={handleAddOperation} 
              />
            </Grid>

            {/* Recipe/Workflow Panel */}
            <Grid item xs={12} sm={6} md={6} lg={6} xl={6} style={{ height: '100%', overflow: 'auto' }}>
              <RecipePanel 
                workflow={workflow} 
                setWorkflow={setWorkflow} 
              />
            </Grid>

            {/* Input and Output Panels */}
            <Grid item xs={12} sm={3} md={3} lg={3} xl={3} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <InputPanel inputData={inputData} setInputData={setInputData} />
              <OutputPanel outputData={outputData} setOutputData={setOutputData} />
            </Grid>
          </Grid>
        </div>
        
        {/* Execution Controls */}
        <Box sx={{ marginTop: 4, display: 'flex', justifyContent: 'center' }}>
          <ExecutionControls 
            workflow={workflow} 
            inputData={inputData} 
            setOutputData={setOutputData} 
          />
        </Box>
      </Container>
    </ErrorBoundary>
  );
};

export default App;