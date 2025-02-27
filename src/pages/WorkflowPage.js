import {
    Box,
    Container,
    Grid,
    useMediaQuery,
    useTheme
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import InputPanel2 from '../components/InputPanel2';
import ErrorBoundary from '/src/components/ErrorBoundary'; // Ensure this component exists
import ExecutionControls from '/src/components/ExecutionControls';
import OperationsPanel from '/src/components/OperationsPanel';
import RecipePanel from '/src/components/RecipePanel';
import { DataTypeContext } from '/src/contexts/DataTypeContext';

const WorkflowPage = () => {
    const [workflow, setWorkflow] = useState([]);
    const [inputData, setInputData] = useState('');
    const [outputData, setOutputData] = useState({});
    const [isLoading, setIsLoading] = useState(false); // State to control data type update loading
    const [insertAtIndex, setInsertAtIndex] = useState(null); // State to control the available tools to insert
    const [addingATool, setAddingATool] = useState(false); // State to control the adding of a tool
    const [filteredTools, setFilteredTools] = useState([]); // State for filtered tools
    const [isVariableLoaded, setIsVariableLoaded] = useState(false); // Control if the workflow was loaded
    const [isInputDataValid, setIsInputDataValid] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState(new Set()); // Track selected files
    const [tabIndex, setTabIndex] = useState(0);    // Track the selected tab index for input mode

    const { inputDataType, setInputDataType } = useContext(DataTypeContext);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Load workflow and input data from localStorage
    useEffect(() => {
        const savedWorkflow = localStorage.getItem('workflow');
        const savedInputData = localStorage.getItem('inputData');
        const savedInputDataType = localStorage.getItem('inputDataType');

        if (savedWorkflow) {
            setWorkflow(JSON.parse(savedWorkflow));
        }
        if (savedInputData) {
            setInputData(savedInputData);
        }
        if (savedInputDataType) {
            setInputDataType(savedInputDataType);
        }

        setIsVariableLoaded(true); // Set flag to true after loading workflow
    }, []);

    // Save workflow in localStorage
    useEffect(() => {
        if (isVariableLoaded) {
            localStorage.setItem('workflow', JSON.stringify(workflow));
        }
    }, [workflow, isVariableLoaded]);

    // Save input in localStorage
    useEffect(() => {
        localStorage.setItem('inputData', inputData);
    }, [inputData]);

    // Save input data type in localStorage
    useEffect(() => {
        if (isVariableLoaded) {
            localStorage.setItem('inputDataType', inputDataType);
        }
    }, [inputDataType, isVariableLoaded]);


    const handleAddOperation = (toolName, insertAtIndex = null, params = {}) => {
        const uniqueId = `${toolName}-${Date.now()}`;
        const newOperation = {
            id: uniqueId,
            toolName,
            params,
        };

        let newWorkflow;
        if (insertAtIndex !== null) {
            newWorkflow = [...workflow];
            newWorkflow.splice(insertAtIndex, 0, newOperation);
        } else {
            newWorkflow = [...workflow, newOperation];

            setInsertAtIndex(newWorkflow.length - 1);
        }

        setWorkflow(newWorkflow);
    };

    const isWorkflowEmpty = workflow.length === 0;

    return (
        <ErrorBoundary>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh', // Set full viewport height
                }}
            >
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
                    <Grid container spacing={2} sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
                        {/* Operations Panel */}
                        <Grid
                            item
                            xs={12}
                            md={3.2}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                flexGrow: 1, // Allow it to take available space without stretching
                                overflowY: 'auto', // Enable independent scrolling
                                height: '100%', // Ensure it does not overflow parent
                            }}
                        >
                            <OperationsPanel
                                onAddOperation={handleAddOperation}
                                isWorkflowEmpty={isWorkflowEmpty}
                                isLoading={isLoading}
                                setIsLoading={setIsLoading}
                                insertAtIndex={insertAtIndex}
                                setInsertAtIndex={setInsertAtIndex}
                                addingATool={addingATool}
                                setAddingATool={setAddingATool}
                                filteredTools={filteredTools}
                                setFilteredTools={setFilteredTools}
                            />
                        </Grid>

                        {/* Recipe/Workflow Panel */}
                        <Grid
                            item
                            xs={12}
                            md={5.6}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                flexGrow: 1, // Allow it to take available space without stretching
                                overflowY: 'auto', // Enable independent scrolling
                                height: '100%', // Ensure it does not overflow parent
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
                                setAddingATool={setAddingATool}
                                setFilteredTools={setFilteredTools}
                                selectedFiles={selectedFiles}
                                setSelectedFiles={setSelectedFiles}
                                isInputDataValid={isInputDataValid}
                                tabIndex={tabIndex}
                            />
                        </Grid>

                        {/* Input and Output Panels */}
                        <Grid
                            item
                            xs={12}
                            md={3.2}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                flexGrow: 1, // Allow it to take available space without stretching
                                overflowY: 'auto', // Enable independent scrolling
                                height: '100%', // Ensure it does not overflow parent
                            }}
                        >
                            <InputPanel2
                                tabIndex={tabIndex}
                                setTabIndex={setTabIndex}
                                selectedFiles={selectedFiles}
                                setSelectedFiles={setSelectedFiles}
                                inputData={inputData}
                            />
                            {/* <Box
                                sx={{
                                    flexGrow: 1,
                                    mb: 2,
                                    overflowY: 'auto', // Independent scrolling
                                }}
                            >
                                <InputPanel inputData={inputData} setInputData={setInputData} uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} isInputDataValid={isInputDataValid} setIsInputDataValid={setIsInputDataValid} />
                            </Box>
                            <Box
                                sx={{
                                    flexGrow: 1,
                                    overflowY: 'auto', // Independent scrolling
                                }}
                            >
                                <OutputPanel outputData={outputData} setOutputData={setOutputData} workflow={workflow} inputData={inputData} page={'WorkflowPage'} uploadedFiles={uploadedFiles} />
                            </Box> */}
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
                        selectedFiles={selectedFiles}
                        setOutputData={setOutputData}
                    />
                </Box>
            </Box>
        </ErrorBoundary>
    );
};

export default WorkflowPage;