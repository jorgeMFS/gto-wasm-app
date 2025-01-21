import {
    Box,
    Container,
    Grid,
    useMediaQuery,
    useTheme
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ErrorBoundary from '/src/components/ErrorBoundary'; // Ensure this component exists
import ExecutionControls from '/src/components/ExecutionControls';
import InputPanel from '/src/components/InputPanel';
import OperationsPanel from '/src/components/OperationsPanel';
import OutputPanel from '/src/components/OutputPanel';
import RecipePanel from '/src/components/RecipePanel';
import { DataTypeContext } from '/src/contexts/DataTypeContext';

const WorkflowPage = () => {
    const [workflow, setWorkflow] = useState([]);
    const [inputData, setInputData] = useState('');
    const [outputData, setOutputData] = useState('');
    const [isLoading, setIsLoading] = useState(false); // State to control data type update loading
    const [insertAtIndex, setInsertAtIndex] = useState(null); // State to control the available tools to insert
    const [addingATool, setAddingATool] = useState(false); // State to control the adding of a tool
    const [filteredTools, setFilteredTools] = useState([]); // State for filtered tools
    const [isVariableLoaded, setIsVariableLoaded] = useState(false); // Control if the workflow was loaded
    // const [insertedToolIndex, setInsertedToolIndex] = useState(null); // State to control the index of the inserted tool

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
                    minHeight: '100vh', // Occupies the full height of the viewport
                    overflowY: 'auto', // Enables vertical scrolling
                }}
            >
                <Navbar />

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
                                setAddingATool={setAddingATool}
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

export default WorkflowPage;