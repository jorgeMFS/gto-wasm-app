import {
  AppBar,
  Box,
  Container,
  Grid,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import BioChefLogo from '../img/BioChefWhite.svg'; // Ensure this component exists
import ErrorBoundary from './components/ErrorBoundary'; // Ensure this component exists
import ExecutionControls from './components/ExecutionControls';
import InputPanel from './components/InputPanel';
import OperationsPanel from './components/OperationsPanel';
import OutputPanel from './components/OutputPanel';
import RecipePanel from './components/RecipePanel';

const App = () => {
  const [workflow, setWorkflow] = useState([]);
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleAddOperation = (toolName, params = {}) => {
    const uniqueId = `${toolName}-${Date.now()}`;
    const newOperation = {
      id: uniqueId,
      toolName,
      params,
    };
    setWorkflow([...workflow, newOperation]);
  };

  const isWorkflowEmpty = workflow.length === 0;

  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Header Section */}
        <AppBar position="static" color="primary" elevation={0}>
          <Toolbar>
            <BioChefLogo style={{ maxWidth: '75px', marginRight: '15px' }} />
            <Typography variant="h6" color="inherit" noWrap>
              Workflow Builder
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ flex: 1, py: 2, display: 'flex', flexDirection: 'column' }}>
          <Grid container spacing={2} sx={{ flex: 1 }}>
            {/* Operations Panel */}
            <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column' }}>
              <OperationsPanel onAddOperation={handleAddOperation} isWorkflowEmpty={isWorkflowEmpty} />
            </Grid>

            {/* Recipe/Workflow Panel */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
              <RecipePanel
                workflow={workflow}
                setWorkflow={setWorkflow}
                inputData={inputData}
                setOutputData={setOutputData}
              />
            </Grid>

            {/* Input and Output Panels */}
            <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', mb: 2 }}>
                <InputPanel inputData={inputData} setInputData={setInputData} />
              </Box>
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <OutputPanel outputData={outputData} setOutputData={setOutputData} />
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* Execution Controls */}
        <Box sx={{ padding: 2, backgroundColor: theme.palette.background.paper }}>
          <ExecutionControls
            workflow={workflow}
            inputData={inputData}
            setOutputData={setOutputData}
          />
        </Box>
      </Box>
    </ErrorBoundary>
  );
};

export default App;