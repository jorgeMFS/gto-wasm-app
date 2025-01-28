import { HelpOutline } from '@mui/icons-material';
import {
    Box,
    Button,
    Divider,
    IconButton,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import description from '../../description.json';
import { loadWasmModule } from '../gtoWasm';

const ToolTestingPanel = ({ tool, helpMessage }) => {
    const [inputData, setInputData] = useState('');
    const [parameters, setParameters] = useState({});
    const [output, setOutput] = useState('');
    const [selectedInputFormat, setSelectedInputFormat] = useState('');

    // Find tool configuration and supported input formats
    const toolConfig = description.tools.find((t) => t.name === `gto_${tool.name}`);
    const inputFormats = toolConfig?.input.format.split(',').map((f) => f.trim()) || [];
    const outputFormats = toolConfig?.output.format.split(',').map((f) => f.trim()) || [];
    const requiredFlags = toolConfig?.flags.filter((flag) => flag.required) || [];
    const optionalFlags = toolConfig?.flags.filter((flag) => !flag.required) || [];

    // Example inputs for supported formats
    const exampleInput = {
        FASTA: '>seq\nACGT',
        'Multi-FASTA': '>seq1\nACGT\n>seq2\nTGCA',
        FASTQ: '@seq\nACGT\n+\nIIII',
        DNA: 'ACGT',
        RNA: 'ACGU',
        AminoAcids: 'ACDEFGHIKLMNPQRSTVWY',
        NUM: '1234',
        SVG: '<svg></svg>',
    };

    const handleInputFormatChange = (format) => {
        setSelectedInputFormat(format);
        setInputData(exampleInput[format] || ''); // Load example input if available
    };

    const handleParameterChange = (flag, value) => {
        setParameters((prev) => ({
            ...prev,
            [flag]: value,
        }));
    };

    const handleExecuteTool = async () => {
        console.log(`Executing tool: ${tool.name}`);
        console.log(`Input: ${inputData}, Parameters:`, parameters);

        try {
            const runFunction = await loadWasmModule(tool.name);

            const toolConfig = description.tools.find((t) => t.name === `gto_${tool.name}`);
            if (!toolConfig) {
                console.error(`Configuration for tool ${tool.name} not found.`);
                throw new Error(`Configuration for tool ${tool.name} not found.`);
            }

            let args = [];
            if (parameters && Object.keys(parameters).length > 0) {
                toolConfig.flags.forEach((flagObj) => {
                    if (parameters[flagObj.flag]) {
                        args.push(flagObj.flag);
                        if (
                            flagObj.parameter &&
                            parameters[flagObj.flag] !== undefined &&
                            parameters[flagObj.flag] !== ''
                        ) {
                            args.push(`${parameters[flagObj.flag]}`);
                        }
                    }
                });
            }

            if (inputData === undefined || inputData === null) {
                inputData = '';
            }

            const outputData = await runFunction(inputData, args);

            setOutput(outputData.stdout);
            if (outputData.stderr) {
                console.error(`Error executing tool: ${outputData.stderr}`);
            }
        } catch (error) {
            console.error(`Error executing tool ${tool.name}:`, error);
            setOutput(`Error: ${error.message}`);
        }
    };

    return (
        <Paper elevation={3} sx={{ padding: 3, maxWidth: 800, margin: 'auto' }}>
            {/* Tool Title and Help */}
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
                <Typography variant="h5" component="h2" sx={{ flexGrow: 1 }}>
                    Testing: <strong>{tool.name}</strong>
                </Typography>
                <Tooltip
                    title={<pre style={{ whiteSpace: 'pre-wrap' }}>{helpMessage || 'Loading help...'}</pre>}
                    arrow
                    componentsProps={{
                        tooltip: {
                            sx: {
                                maxWidth: 'none',
                                fontSize: '0.875rem',
                            },
                        },
                    }}
                >
                    <IconButton size="small">
                        <HelpOutline />
                    </IconButton>
                </Tooltip>
            </Box>

            <Divider sx={{ marginBottom: 3 }} />

            {/* Input and Output Formats */}
            <Box sx={{ marginBottom: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Supported Formats
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold">Input:</Typography>
                        <Typography variant="body2">
                            {inputFormats.length > 0 ? inputFormats.join(', ') : 'None available'}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold">Output:</Typography>
                        <Typography variant="body2">
                            {outputFormats.length > 0 ? outputFormats.join(', ') : 'None available'}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Input Data and Selector */}
            <Box sx={{ marginBottom: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Input Data
                    </Typography>
                    <Box sx={{ minWidth: 200 }}>
                        <Select
                            value={selectedInputFormat}
                            onChange={(e) => handleInputFormatChange(e.target.value)}
                            displayEmpty
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="" disabled>
                                Select Example Format
                            </MenuItem>
                            {inputFormats.map((format) => (
                                <MenuItem key={format} value={format}>
                                    {format}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>
                </Box>
                <TextField
                    multiline
                    rows={4}
                    fullWidth
                    variant="outlined"
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    placeholder="Enter your input data here"
                />
            </Box>

            {/* Flags Section */}
            <Typography variant="h6" gutterBottom>
                Flags and Parameters
            </Typography>

            {/* Required Flags */}
            {requiredFlags.length > 0 && (
                <Box sx={{ marginBottom: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Required Flags
                    </Typography>
                    {requiredFlags.map((flagObj) => (
                        <Box key={flagObj.flag} sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                            <Tooltip title={flagObj.description || 'No description available'} arrow>
                                <Typography variant="body2" sx={{ minWidth: 100 }}>
                                    {flagObj.flag} <span style={{ color: 'red' }}>*</span>
                                </Typography>
                            </Tooltip>
                            <TextField
                                label={flagObj.parameter || flagObj.flag}
                                value={parameters[flagObj.flag] || ''}
                                onChange={(e) => handleParameterChange(flagObj.flag, e.target.value)}
                                size="small"
                                fullWidth
                            />
                        </Box>
                    ))}
                </Box>
            )}

            {/* Optional Flags */}
            {optionalFlags.length > 0 && (
                <Box sx={{ marginBottom: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Optional Flags
                    </Typography>
                    {optionalFlags
                        .filter((flagObj) => flagObj.flag !== '-h')
                        .map((flagObj) => (
                            <Box key={flagObj.flag} sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                                <Tooltip title={flagObj.description || 'No description available'} arrow>
                                    <Typography variant="body2" sx={{ minWidth: 100 }}>
                                        {flagObj.flag}
                                    </Typography>
                                </Tooltip>
                                {flagObj.parameter && (
                                    <TextField
                                        label={flagObj.parameter}
                                        value={parameters[flagObj.flag] || ''}
                                        onChange={(e) => handleParameterChange(flagObj.flag, e.target.value)}
                                        size="small"
                                        fullWidth
                                    />
                                )}
                            </Box>
                        ))}
                </Box>
            )}

            {/* Execute Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 3 }}>
                <Button variant="contained" color="primary" onClick={handleExecuteTool}>
                    Execute
                </Button>
            </Box>

            {/* Output */}
            {output && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Output
                    </Typography>
                    <Paper elevation={1} sx={{ padding: 2, backgroundColor: '#f5f5f5' }}>
                        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {output}
                        </Typography>
                    </Paper>
                </Box>
            )}
        </Paper>
    );
};

export default ToolTestingPanel;