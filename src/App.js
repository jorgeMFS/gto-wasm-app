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
  const [isLoading, setIsLoading] = useState(false); // State to control data type update loading
  const [insertAtIndex, setInsertAtIndex] = useState(null); // State to control the available tools to insert
  const [filteredTools, setFilteredTools] = useState([]); // State for filtered tools

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleAddOperation = (toolName, insertAtIndex = null, params = {}) => {
    const uniqueId = `${toolName}-${Date.now()}`;
    const newOperation = {
      id: uniqueId,
      toolName,
      params,
    };

    if (insertAtIndex !== null) {
      const newWorkflow = [...workflow];
      newWorkflow.splice(insertAtIndex + 1, 0, newOperation);
      setWorkflow(newWorkflow);
    } else {
      setWorkflow([...workflow, newOperation]);
    }
  };

  const isWorkflowEmpty = workflow.length === 0;

  return (
    <ErrorBoundary>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh', // Occupies the full height of the viewport
          overflowY: 'auto', // Enables vertical scrolling
        }}
      >
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
        <Container
          maxWidth="xl"
          sx={{
            flex: 1,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // Prevents overflow beyond the container
          }}
        >
          <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden' }}>
            {/* Operations Panel */}
            <Grid
              item
              xs={12}
              md={3.2}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto', // Independent scrolling
                maxHeight: 'calc(100vh - 150px)', // Adjusts height relative to header/footer
              }}
            >
              <OperationsPanel
                onAddOperation={handleAddOperation}
                isWorkflowEmpty={isWorkflowEmpty}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                insertAtIndex={insertAtIndex}
                setInsertAtIndex={setInsertAtIndex}
                filteredTools={filteredTools}
                setFilteredTools={setFilteredTools}
              />
            </Grid>

            {/* Recipe/Workflow Panel */}
            <Grid
              item
              xs={12}
              md={5.8}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto', // Independent scrolling
                maxHeight: 'calc(100vh - 150px)', // Adjusts height relative to header/footer
              }}
            >
              <RecipePanel
                workflow={workflow}
                setWorkflow={setWorkflow}
                inputData={inputData}
                setInputData={setInputData}
                setOutputData={setOutputData}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                insertAtIndex={insertAtIndex}
                setInsertAtIndex={setInsertAtIndex}
                setFilteredTools={setFilteredTools}
              />
            </Grid>

            {/* Input and Output Panels */}
            <Grid
              item
              xs={12}
              md={3}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto', // Independent scrolling
                maxHeight: 'calc(100vh - 150px)', // Adjusts height relative to header/footer
              }}
            >
              <Box
                sx={{
                  flexGrow: 1,
                  mb: 2,
                  overflowY: 'auto', // Independent scrolling
                }}
              >
                <InputPanel inputData={inputData} setInputData={setInputData} />
              </Box>
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto', // Independent scrolling
                }}
              >
                <OutputPanel outputData={outputData} setOutputData={setOutputData} />
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* Execution Controls */}
        <Box
          sx={{
            flexShrink: 0,
            padding: 2,
            backgroundColor: theme.palette.background.paper,
          }}
        >
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