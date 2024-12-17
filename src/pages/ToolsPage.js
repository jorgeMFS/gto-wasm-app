import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import React, { useState } from 'react';
import { loadWasmModule } from '../gtoWasm';
import AllOperationsPanel from '/src/components/AllOperationsPanel';
import Navbar from '/src/components/Navbar';
import ToolTestingPanel from '/src/components/ToolTestingPanel';

const ToolsPage = () => {
    const [selectedTool, setSelectedTool] = useState(null);
    const [helpMessage, setHelpMessage] = useState('');

    const handleToolClick = async (tool) => {
        setSelectedTool(tool); // Update the selected tool

        try {
            const runFunction = await loadWasmModule(tool.name);
            const outputData = await runFunction('', ['-h']);

            if (outputData.stderr) {
                console.error('Error loading tool:', outputData.stderr);
            } else {
                setHelpMessage(outputData.stdout);
            }
        } catch (error) {
            console.error('Error loading tool:', error);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                overflowY: 'auto',
            }}
        >
            <Navbar />
            <Container
                maxWidth="xl"
                sx={{
                    flex: 1,
                    py: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden' }}>
                    {/* Tool Selection Panel */}
                    <Grid
                        item
                        xs={12}
                        md={3.2}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            overflowY: 'auto',
                            maxHeight: 'calc(100vh - 150px)', // Adjust height relative to header/footer
                        }}
                    >
                        <AllOperationsPanel onToolClick={handleToolClick} />
                    </Grid>

                    {/* Tool Information and Testing Panels */}
                    <Grid item xs={12} md={8.8}>
                        <Paper
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: 2,
                                overflowY: 'auto',
                            }}
                        >
                            {selectedTool ? (
                                <Grid container spacing={2}>
                                    {/* Single Tool Testing Panel */}
                                    <Grid item xs={12}>
                                        <ToolTestingPanel tool={selectedTool} helpMessage={helpMessage} />
                                    </Grid>
                                </Grid>
                            ) : (
                                <Typography align="center" variant="h6" sx={{ marginTop: '20%' }}>
                                    Select an operation from the list to view details and test it
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default ToolsPage;
