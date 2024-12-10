// RecipePanel.jsx
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AddCircle, ContentCopy, ExpandLess, ExpandMore, FileUpload, GetApp, HelpOutline, Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import description from '../../description.json';
import { DataTypeContext } from '../contexts/DataTypeContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { ValidationErrorsContext } from '../contexts/ValidationErrorsContext';
import { loadWasmModule } from '../gtoWasm';
import { detectDataType } from '../utils/detectDataType';
import { exportRecipeConfigFile } from '../utils/exportRecipeConfigFile';
import { exportRecipeScript } from '../utils/exportRecipeScript';
import { importRecipeCommand } from '../utils/importRecipeCommand';
import { importRecipeConfigFile } from '../utils/importRecipeConfigFile';
import SortableItem from './SortableItem';

const RecipePanel = ({ workflow, setWorkflow, inputData, setInputData, setOutputData }) => {
  const [activeId, setActiveId] = useState(null);
  const { setDataType, dataType, inputDataType, setInputDataType } = useContext(DataTypeContext); // To update data type context
  const [invalidItemIds, setInvalidItemIds] = useState([]); // To store invalid item IDs
  const [outputTypesMap, setOutputTypesMap] = useState({}); // To store output types of tools
  const { validationErrors, setValidationErrors } = useContext(ValidationErrorsContext); // Access validation errors of parameters
  const [helpMessages, setHelpMessages] = useState({}); // To store help messages for tools
  const [exportFileName, setExportFileName] = useState('my_workflow'); // Default export name
  const [openExportDialog, setOpenExportDialog] = useState(false); // State for export dialog
  const [command, setCommand] = useState('');
  const [openImportDialog, setOpenImportDialog] = useState(false); // State for import dialog
  const [importInput, setImportInput] = useState(''); // State for import input
  const [importError, setImportError] = useState(''); // State for import error
  const [expandedTools, setExpandedTools] = useState({}); // Track each tool's expanded state
  const [expandedOutputs, setExpandedOutputs] = useState({}); // Track each tool's output expanded state
  const [openToolsModal, setOpenToolsModal] = useState(false); // State for tools modal
  const [filteredTools, setFilteredTools] = useState([]); // State for filtered tools
  const [selectedIndex, setSelectedIndex] = useState(null); // State for selected tool index
  const [visibleOutputs, setVisibleOutputs] = useState({}); // Track visible outputs
  const [importMode, setImportMode] = useState('command'); // To track the selected import mode
  const [importFile, setImportFile] = useState(null); // To store the uploaded file for import


  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const showNotification = useContext(NotificationContext);

  // If workflow changes, update the data type and output types map
  useEffect(() => {
    const updateDataType = async () => {
      if (workflow.length > 0) {
        let data = inputData;
        const newOutputTypesMap = {};

        for (const tool of workflow) {
          try {
            const toolConfig = description.tools.find((t) => t.name === `gto_${tool.toolName}`);
            const outputFormats = toolConfig.output.format.split(',').map(f => f.trim());

            if (outputFormats.length === 1) {
              let toolOutput = outputFormats[0];

              if (toolOutput === 'text') {
                toolOutput = 'UNKNOWN';
              }

              newOutputTypesMap[tool.id] = toolOutput;

              if (tool.id === workflow[workflow.length - 1].id && dataType !== toolOutput) {
                setDataType(toolOutput);
                showNotification(`Data type updated to ${toolOutput}`, 'info');
              }
            } else {
              // Execute all tools up to the current one to ensure dependencies are met
              for (let i = 0; i <= workflow.findIndex((t) => t.id === tool.id); i++) {
                const currentTool = workflow[i];
                const output = await executeTool(currentTool, data);
                data = output;
              }
              const detectedType = detectDataType('output.txt', data);

              newOutputTypesMap[tool.id] = detectedType;

              if (tool.id === workflow[workflow.length - 1].id && dataType !== detectedType) {
                setDataType(detectedType);
                showNotification(`Data type updated to ${detectedType}`, 'info');
              }
            }
          } catch (error) {
            console.error(`Failed to update data type for tool ${tool.toolName}:`, error);
          }
        }

        setOutputTypesMap(newOutputTypesMap);
      } else {
        if (dataType !== inputDataType) {
          setDataType(inputDataType);
        }
      }
    };

    updateDataType();
  }, [workflow, inputData, inputDataType, dataType]);

  // State to store help messages for tools
  useEffect(() => {
    workflow.forEach((tool) => {
      if (!helpMessages[tool.toolName]) {
        loadHelpMessage(tool.toolName);
      }
    });
  }, [workflow]);

  // Export
  useEffect(() => {
    if (openExportDialog && workflow.length > 0) {
      const generatedCommand = exportRecipeScript(
        workflow,
        inputData,
        inputDataType,
        outputTypesMap,
        exportFileName,
        showNotification,
        setOpenExportDialog,
        true // Request the command
      );
      setCommand(generatedCommand);
    } else {
      setCommand('');
    }
  }, [openExportDialog, workflow, inputData, inputDataType, outputTypesMap]);

  // Load help message for a tool
  const loadHelpMessage = async (toolName) => {
    try {
      const runFunction = await loadWasmModule(toolName);
      const outputData = await runFunction('', ['-h']); // Execute the tool with -h flag

      if (outputData.stderr) {
        console.error(`Error in ${toolName} help message: ${outputData.stderr}`);
      } else {
        const helpLines = outputData.stdout.split('\n'); // Divida o texto da ajuda em linhas
        const flagsHelp = {};
        let generalHelp = '';

        // Process each line of the help message
        helpLines.forEach((line) => {
          line = line.trim();

          // Separating flags and descriptions
          if (/^-/.test(line)) {
            const [flag, ...descriptionParts] = line.split(/\s+/); // Separating flag and description
            const normalizedFlag = flag.replace(/[, ]/g, '').trim(); // Removing commas and spaces
            flagsHelp[normalizedFlag] = descriptionParts.join(' '); // Store the description
          } else if (
            !line.includes('--help') &&
            !line.toLowerCase().includes('optional') &&
            !line.toLowerCase().includes('optional options')
          ) {
            generalHelp += `${line}\n`;
          }
        });

        // Store the help messages
        setHelpMessages((prev) => ({
          ...prev,
          [toolName]: {
            general: generalHelp.trim(),
            flags: flagsHelp, // Store the flags help
          },
        }));
      }
    } catch (error) {
      console.error(`Failed to load help message for ${toolName}: ${error.message}`);
    }
  };

  // Validate the workflow to ensure compatibility between tools
  const validateWorkflow = (workflow, inputDataType) => {
    const firstTool = description.tools.find((t) => `gto_${workflow[0].toolName}` === t.name);
    const firstToolInputFormats = firstTool.input.format.split(',').map(f => f.trim());

    if (firstToolInputFormats[0] !== "" && inputDataType !== "UNKNOWN" && !firstToolInputFormats.includes(inputDataType)) {
      return false;
    }

    for (let i = 0; i < workflow.length - 1; i++) {
      const currentTool = description.tools.find((t) => `gto_${workflow[i].toolName}` === t.name);
      const nextTool = description.tools.find((t) => `gto_${workflow[i + 1].toolName}` === t.name);

      if (!currentTool || !nextTool) {
        return false;
      }

      const currentOutputFormats = currentTool.output.format.split(',').map(f => f.trim());
      const nextInputFormats = nextTool.input.format.split(',').map(f => f.trim());

      // Check if there is a common format between the output of the current tool and the input of the next tool
      const isValid = currentOutputFormats.some((format) => nextInputFormats.includes(format));

      if (!isValid) {
        return false;
      }
    }
    return true;
  };

  // Validate parameters based on expected type
  const validateParameters = (tool) => {
    const toolConfig = description.tools.find((t) => t.name === `gto_${tool.toolName}`);
    const errors = {};

    toolConfig.flags.forEach((flagObj) => {
      const isFlagRequired = flagObj.required;
      const flagValue = !!tool.params[flagObj.flag]; // Check if the flag is active
      const paramValue = tool.params[flagObj.parameter];
      const paramConfig = toolConfig.parameters.find((param) => param.name === flagObj.parameter);

      if (paramConfig) {
        if (isFlagRequired || flagValue) { // Check if the flag is required or active
          if (paramConfig.type === 'integer' && !/^-?\d+$/.test(paramValue)) {
            errors[flagObj.parameter] = 'Invalid integer value';
          } else if (paramConfig.type === 'float' && !/^-?\d+(\.\d+)?$/.test(paramValue)) {
            errors[flagObj.parameter] = 'Invalid float value';
          } else if (paramValue === undefined || paramValue === '') {
            errors[flagObj.parameter] = 'Parameter value cannot be empty';
          }
        }
      } else if (isFlagRequired && (paramValue === undefined || paramValue === '')) {
        errors[flagObj.flag] = 'Required flag cannot be empty';
      }
    });

    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      [tool.id]: errors,
    }));

    return Object.keys(errors).length === 0;
  };


  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      const oldIndex = workflow.findIndex((item) => item.id === active.id);
      const newIndex = workflow.findIndex((item) => item.id === over.id);

      const newWorkflow = arrayMove(workflow, oldIndex, newIndex);

      // Validate resulting workflow
      if (validateWorkflow(newWorkflow, inputDataType)) {
        setWorkflow(newWorkflow);
      } else {
        showNotification('Invalid operation: resulting workflow has incompatible steps.', 'error');

        const id = active.id;
        setInvalidItemIds((prev) => [...prev, id]);

        // Remove the highlight after 3 seconds
        setTimeout(() => {
          setInvalidItemIds((prev) => prev.filter((itemId) => itemId !== id));
        }, 3000);
      }
    }
    setActiveId(null);
  };

  const handleDelete = (id) => {
    const newWorkflow = workflow.filter((item) => item.id !== id);

    if (newWorkflow.length === 0) {
      setWorkflow(newWorkflow);
      // If no more items in workflow, reset to input data type
      setDataType(inputDataType);
      setOutputTypesMap({}); // Clear the output types map
      showNotification('All operations removed. Data type reset to input type.', 'info');
    } else {

      const toolIndex = workflow.findIndex((t) => t.id === id);
      const isFirstToolWithoutInput = toolIndex === 0 && description.tools.find((tool) => `gto_${workflow[toolIndex].toolName}` === tool.name)?.input?.type === '';

      if (validateWorkflow(newWorkflow, inputDataType) && !isFirstToolWithoutInput) {
        setWorkflow(newWorkflow);

        // Remove the tool from the outputTypesMap
        setOutputTypesMap((prevMap) => {
          const newMap = { ...prevMap };
          delete newMap[id];
          return newMap;
        });

        // Update the data type based on the last valid tool in the workflow
        const lastToolInWorkflow = newWorkflow[newWorkflow.length - 1];
        const lastToolId = lastToolInWorkflow.id;
        const lastOutputType = outputTypesMap[lastToolId];

        if (lastOutputType) {
          setDataType(lastOutputType); // Use the actual output type from the map
          showNotification(`Data type updated to ${lastOutputType}`, 'info');
        }
      } else {
        showNotification('Invalid operation: resulting workflow has incompatible steps.', 'error');

        setInvalidItemIds((prev) => [...prev, id]);

        // Remove the highlight after 3 seconds
        setTimeout(() => {
          setInvalidItemIds((prev) => prev.filter((itemId) => itemId !== id));
        }, 3000);
      }
    }
  };

  // Delete all operations from the selected tool onwards
  const handleDeleteFromHere = (id) => {
    const index = workflow.findIndex((item) => item.id === id);

    if (index !== -1) {
      const newWorkflow = workflow.slice(0, index); // Keep only the operations before the selected one
      setWorkflow(newWorkflow);

      if (newWorkflow.length === 0) {
        setDataType(inputDataType);
        setOutputTypesMap({});
        showNotification('All operations removed. Data type reset to input type.', 'info');
      } else {
        const lastTool = newWorkflow[newWorkflow.length - 1];
        const lastOutputType = outputTypesMap[lastTool.id];
        setDataType(lastOutputType);
        showNotification(`Data type updated to ${lastOutputType}`, 'info');
      }
    }
  };

  const handleParameterChange = (id, name, value) => {
    setWorkflow(
      workflow.map((item) =>
        item.id === id
          ? {
            ...item,
            params: {
              ...item.params,
              [name]: value, // Sets either flag toggle or parameter value
            },
          }
          : item
      )
    );
  };

  const handleListOperations = (index) => {
    const previous = workflow[index]
    const previousOutputType = outputTypesMap[previous.id]

    const next = workflow[index + 1]
    const nextTool = description.tools.find((t) => t.name === `gto_${next.toolName}`)
    const nextInputTypes = nextTool.input.format.split(',').map(f => f.trim())

    const filteredOperations = description.tools.filter((tool) => {
      const toolInputTypes = tool.input.format.split(',').map(f => f.trim());
      const toolOutputTypes = tool.output.format.split(',').map(f => f.trim());

      return toolInputTypes.includes(previousOutputType) && toolOutputTypes.some((type) => nextInputTypes.includes(type));
    });

    setFilteredTools(filteredOperations);
    setSelectedIndex(index);
    setOpenToolsModal(true);
  };

  const handleCloseToolModal = () => {
    setOpenToolsModal(false);
    setFilteredTools([]);
    setSelectedIndex(null);
  };

  const handleAddTool = (tool) => {
    const toolName = tool.name.replace('gto_', '');
    const newOperation = {
      id: `${toolName}-${Date.now()}`,
      toolName: toolName,
      params: {},
    };
    const newWorkflow = [...workflow];
    newWorkflow.splice(selectedIndex + 1, 0, newOperation);
    setWorkflow(newWorkflow);
    handleCloseToolModal();
  };

  // State to store outputs of tools
  const [outputs, setOutputs] = useState({});
  const [runningToolIds, setRunningToolIds] = useState([]);

  const executeTool = async (tool, input) => {
    try {
      // Load the wrapper function dynamically
      const runFunction = await loadWasmModule(tool.toolName);

      // Find tool configuration from description.json
      const toolConfig = description.tools.find(
        (t) => t.name === `gto_${tool.toolName}`
      );
      if (!toolConfig) {
        showNotification(`Configuration for tool ${tool.toolName} not found.`, 'error');
        throw new Error(`Configuration for tool ${tool.toolName} not found.`);
      }

      // Prepare arguments based on tool configuration and user-set parameters
      let args = [];
      if (tool.params && Object.keys(tool.params).length > 0) {
        // Handle flags
        toolConfig.flags.forEach((flagObj) => {
          if (tool.params[flagObj.parameter]) {
            args.push(flagObj.flag);
            // Check if the flag has an associated parameter
            if (
              flagObj.parameter &&
              tool.params[flagObj.parameter] !== undefined &&
              tool.params[flagObj.parameter] !== ''
            ) {
              args.push(`${tool.params[flagObj.parameter]}`);
            }
          }
        });
      }

      // Ensure input is defined
      if (input === undefined || input === null) {
        input = '';
      }

      // Execute the tool
      const outputData = await runFunction(input, args);

      // Handle messages in stderr
      let hasInfoMessage = false;
      if (outputData.stderr) {
        const stderrLines = outputData.stderr.split('\n');
        let infoMessages = []; // Accumulate all informational messages

        stderrLines.forEach((line) => {
          if (line.trim().startsWith('ERROR:')) {
            throw new Error(line.trim()); // Treat as an error
          } else if (line.trim()) {
            infoMessages.push(line.trim()); // Accumulate info messages
            hasInfoMessage = true;
          }
        });

        // Display all accumulated informational messages together
        if (infoMessages.length > 0) {
          showNotification(infoMessages.join('\n'), 'info');
        }
      }

      // Detect data type of the output
      const detectedType = detectDataType('output.txt', outputData.stdout);

      // Update the output types map with the real output type from the current tool
      setOutputTypesMap((prevMap) => ({
        ...prevMap,
        [tool.id]: detectedType,
      }));

      if (outputData.stdout.trim() === '') {
        // Notify the user if the output is empty
        showNotification('Execution resulted in an empty output.', 'warning');
      }

      return outputData.stdout;
    } catch (error) {
      // showNotification(`Execution failed: ${error.message}`, 'error');
      throw error;
    }
  };

  const handleViewTool = async (tool) => {
    if (visibleOutputs[tool.id]) {
      // Hide output if already visible
      setVisibleOutputs((prev) => ({
        ...prev,
        [tool.id]: false,
      }));
      return;
    }

    // Validate parameters before running
    if (!validateParameters(tool)) {
      showNotification('Invalid input detected. Please correct the inputs in red.', 'error');
      return;
    }

    setRunningToolIds((ids) => [...ids, tool.id]);
    try {
      let data = inputData;
      const toolIndex = workflow.findIndex((t) => t.id === tool.id);
      if (toolIndex === -1) throw new Error('Tool not found in workflow');

      // Execute all tools up to the selected one to ensure dependencies are met
      for (let i = 0; i <= toolIndex; i++) {
        const currentTool = workflow[i];
        const output = await executeTool(currentTool, data);
        data = output;
        setOutputs((prevOutputs) => ({ ...prevOutputs, [currentTool.id]: data }));
      }

      // Mark output as visible
      setVisibleOutputs((prev) => ({
        ...prev,
        [tool.id]: true,
      }));
    } catch (error) {
      showNotification(`Failed to view tool output: ${error.message}`, 'error');
    } finally {
      setRunningToolIds((ids) => ids.filter((id) => id !== tool.id));
    }
  };

  const toggleExpand = (toolId) => {
    setExpandedTools((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  const toggleOutputExpand = (toolId) => {
    setExpandedOutputs((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  const renderParameters = (tool) => {
    const toolConfig = description.tools.find((t) => t.name === `gto_${tool.toolName}`);
    if (!toolConfig) return null;

    const toolErrors = validationErrors[tool.id] || {};
    const toolHelp = helpMessages[tool.toolName] || { general: 'Loading help...', flags: {} };
    const flagHelpMessages = toolHelp.flags || {};

    // Filter flags based on required and optionals
    const requiredFlags = toolConfig.flags.filter((flagObj) => flagObj.required && flagObj.flag !== '-h');
    const optionalFlags = toolConfig.flags.filter((flagObj) => !flagObj.required && flagObj.flag !== '-h');

    return (
      <Box sx={{ marginTop: 2 }}>
        {/* Required Flags */}
        {requiredFlags.length > 0 && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                marginBottom: 1,
                color: 'text.secondary',
              }}
            >
              Required Flags
            </Typography>
            {requiredFlags.map((flagObj) => {
              const flagValue = !!tool.params[flagObj.flag];
              const parameterValue = tool.params[flagObj.parameter] || '';
              const error = toolErrors[flagObj.parameter] || '';

              return (
                <Box
                  key={flagObj.flag}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 1,
                    gap: 2,
                  }}
                >
                  <FormControlLabel
                    control={<span />}
                    label={
                      <Tooltip
                        title={flagHelpMessages[flagObj.flag] || 'Loading help message...'}
                        arrow
                        componentsProps={{
                          tooltip: {
                            sx: {
                              maxWidth: 300,
                              whiteSpace: 'pre-wrap',
                            },
                          },
                        }}
                      >
                        <span>
                          {flagObj.flag} <span style={{ color: 'red' }}>*</span>
                        </span>
                      </Tooltip>
                    }
                    sx={{ alignItems: 'center', margin: 0 }}
                  />
                  {flagObj.parameter && (
                    <TextField
                      key={flagObj.parameter}
                      value={parameterValue}
                      onChange={(e) =>
                        handleParameterChange(tool.id, flagObj.parameter, e.target.value)
                      }
                      size="small"
                      label={flagObj.parameter}
                      error={!!error}
                      helperText={error}
                      sx={{
                        flexGrow: 1,
                        '& .MuiOutlinedInput-root': {
                          borderColor: error ? 'red' : 'default',
                        },
                        '& .MuiOutlinedInput-notchedOutline': error
                          ? {
                            borderColor: 'red',
                            borderWidth: '1px',
                          }
                          : {},
                      }}
                      type={
                        toolConfig.parameters.find((p) => p.name === flagObj.parameter)?.type ===
                          'integer'
                          ? 'number'
                          : toolConfig.parameters.find((p) => p.name === flagObj.parameter)
                            ?.type === 'float'
                            ? 'number'
                            : 'text'
                      }
                      inputProps={
                        toolConfig.parameters.find((p) => p.name === flagObj.parameter)?.type ===
                          'integer' ||
                          toolConfig.parameters.find((p) => p.name === flagObj.parameter)?.type ===
                          'float'
                          ? { step: 'any' }
                          : {}
                      }
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Optional Flags */}
        {optionalFlags.length > 0 && (
          <Box sx={{ marginTop: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                },
                padding: '4px 8px',
                borderRadius: '4px',
              }}
              onClick={() => toggleExpand(tool.id)}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  marginBottom: 1,
                  color: 'text.secondary',
                  flexGrow: 1,
                }}
              >
                Optional Flags
              </Typography>
              {expandedTools[tool.id] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </Box>

            {/* Collapse */}
            <Collapse in={expandedTools[tool.id]} timeout="auto" unmountOnExit>
              {optionalFlags.map((flagObj) => {
                const flagValue = !!tool.params[flagObj.flag];
                const parameterValue = tool.params[flagObj.parameter] || '';
                const error = toolErrors[flagObj.parameter] || '';

                return (
                  <Box
                    key={flagObj.flag}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: 1,
                      gap: 2,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={flagValue}
                          onChange={(e) =>
                            handleParameterChange(tool.id, flagObj.flag, e.target.checked)
                          }
                        />
                      }
                      label={
                        <Tooltip
                          title={flagHelpMessages[flagObj.flag] || 'Loading help message...'}
                          arrow
                          componentsProps={{
                            tooltip: {
                              sx: {
                                maxWidth: 300,
                                whiteSpace: 'pre-wrap',
                              },
                            },
                          }}
                        >
                          <span>{flagObj.flag}</span>
                        </Tooltip>
                      }
                      sx={{ alignItems: 'center', margin: 0 }}
                    />
                    {flagObj.parameter && flagValue && (
                      <TextField
                        value={parameterValue}
                        onChange={(e) =>
                          handleParameterChange(tool.id, flagObj.parameter, e.target.value)
                        }
                        size="small"
                        label={flagObj.parameter}
                        error={!!error}
                        helperText={error}
                        sx={{
                          flexGrow: 1,
                          '& .MuiOutlinedInput-root': {
                            borderColor: error ? 'red' : 'default',
                          },
                          '& .MuiOutlinedInput-notchedOutline': error
                            ? {
                              borderColor: 'red',
                              borderWidth: '1px',
                            }
                            : {},
                          alignSelf: 'center',
                        }}
                        type={
                          toolConfig.parameters.find((p) => p.name === flagObj.parameter)?.type ===
                            'integer'
                            ? 'number'
                            : toolConfig.parameters.find((p) => p.name === flagObj.parameter)
                              ?.type === 'float'
                              ? 'number'
                              : 'text'
                        }
                        inputProps={
                          toolConfig.parameters.find((p) => p.name === flagObj.parameter)?.type ===
                            'integer' ||
                            toolConfig.parameters.find((p) => p.name === flagObj.parameter)?.type ===
                            'float'
                            ? { step: 'any' }
                            : {}
                        }
                      />
                    )}
                  </Box>
                );
              })}
            </Collapse>
          </Box>
        )}
      </Box>
    );
  };


  return (
    <Paper
      elevation={3}
      sx={{ padding: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <Typography variant="h6" gutterBottom>
          Workflow
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}
        >
          Current Data Type: {dataType}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={workflow.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {workflow.map((tool, index) => (
              <React.Fragment key={tool.id}>
                <SortableItem
                  id={tool.id}
                  toolName={tool.toolName}
                  onDelete={() => handleDelete(tool.id)}
                  onDeleteFromHere={() => handleDeleteFromHere(tool.id)}
                  isInvalid={invalidItemIds.includes(tool.id)} // Is true if the tool is invalid
                  helpMessage={helpMessages[tool.toolName]?.general}
                  workflowLength={workflow.length}
                >
                  {renderParameters(tool)}
                  <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleViewTool(tool)}
                      startIcon={visibleOutputs[tool.id] ? <VisibilityOff /> : <Visibility />}
                      disabled={runningToolIds.includes(tool.id)}
                    >
                      {visibleOutputs[tool.id] ? 'Hide' : 'View'}
                    </Button>
                    {runningToolIds.includes(tool.id) && (
                      <CircularProgress size={24} sx={{ marginLeft: 1 }} />
                    )}
                  </Box>
                  {outputs[tool.id] && visibleOutputs[tool.id] && (
                    <Box sx={{ marginTop: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">Output:</Typography>
                        <Button
                          size="small"
                          onClick={() => toggleOutputExpand(tool.id)}
                        >
                          {expandedOutputs[tool.id] ? 'Collapse' : 'Expand'}
                        </Button>
                      </Box>
                      <Collapse in={expandedOutputs[tool.id]} timeout="auto" unmountOnExit>
                        <Paper sx={{ padding: 1, backgroundColor: '#f5f5f5', overflow: 'auto', maxHeight: '200px', wordWrap: 'break-word' }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '0.800rem' }}>
                            {outputs[tool.id]}
                          </Typography>
                        </Paper>
                      </Collapse>
                      {!expandedOutputs[tool.id] && (
                        <Paper sx={{ padding: 1, backgroundColor: '#f5f5f5', overflow: 'auto', maxHeight: '200px', wordWrap: 'break-word' }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '0.800rem' }}>
                            {outputs[tool.id].length > 50 ? `${outputs[tool.id].slice(0, 90)}...` : outputs[tool.id]}
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  )}
                </SortableItem>
                {/* Add Operation Button */}
                {index < workflow.length - 1 && (
                  <Box
                    sx={{
                      height: '10px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      opacity: 0,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        height: '40px',
                        opacity: 1,
                      },
                    }}
                    onMouseEnter={() => { }}
                    onMouseLeave={() => { }}
                  >
                    <Tooltip title="Add Operation">
                      <Button
                        color="primary"
                        onClick={() => handleListOperations(index)}
                        sx={{ minWidth: '32px', minHeight: '32px', opacity: 0.8 }}
                      >
                        <AddCircle sx={{ fontSize: '24px' }} />
                      </Button>
                    </Tooltip>
                  </Box>
                )}
              </React.Fragment>
            ))}
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <SortableItem
                id={activeId}
                toolName={workflow.find((item) => item.id === activeId).toolName}
                onDelete={() => { }}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </Box>
      <Divider sx={{ marginY: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            if (workflow.length > 0) {
              console.log('Exporting workflow:', workflow);
              setOpenExportDialog(true);
            } else {
              showNotification('Workflow is empty. Cannot export.', 'error');
            }
          }}
          startIcon={<GetApp />}
        >
          Export Recipe
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenImportDialog(true)}
          startIcon={<FileUpload />}
        >
          Import Recipe
        </Button>
      </Box>

      {/* Modal to select compatible tools */}
      <Dialog open={openToolsModal} onClose={handleCloseToolModal} maxWidth="md" fullWidth>
        <DialogTitle>Select a Tool</DialogTitle>
        <DialogContent>
          {filteredTools.length === 0 ? (
            <Typography>No compatible tools found.</Typography>
          ) : (
            filteredTools.map((tool) => (
              <Paper
                key={tool.name}
                sx={{
                  padding: 1,
                  marginBottom: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography sx={{ flexGrow: 1 }}>{tool.name}</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => handleAddTool(tool)}
                >
                  Add
                </Button>
              </Paper>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseToolModal} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Recipe Dialog */}
      <Dialog open={openExportDialog} onClose={() => setOpenExportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Export Workflow</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Please choose an option to export your workflow:
          </Typography>

          {/* Display command for copying */}
          <Typography variant="subtitle1" gutterBottom>
            Copy Command:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <TextField
              fullWidth
              value={command}
              InputProps={{
                readOnly: true,
                sx: { fontSize: '0.875rem' },
              }}
              variant="outlined"
              size="small"
              placeholder="Generate a workflow to see the command here"
            />
            <Tooltip title="Copy to Clipboard">
              <IconButton
                onClick={() => {
                  if (command) {
                    navigator.clipboard.writeText(command).then(() => {
                      showNotification('Command copied to clipboard!', 'success');
                    });
                  } else {
                    showNotification('Workflow is empty. Cannot copy command.', 'error');
                  }
                }}
                color="primary"
              >
                <ContentCopy />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
            {/* File name input */}
            <Typography variant="subtitle1" gutterBottom>
              File Name for Export:
            </Typography>
            <Box sx={{ ml: 'auto' }}>
              {/* Help Tooltip */}
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      <strong>Download Script:</strong> Exports the workflow as a shell script
                      that can be executed in a terminal to reproduce the workflow.
                    </Typography>
                    <Typography variant="body2">
                      <strong>Download Config:</strong> Exports the workflow as a JSON
                      configuration file, useful for sharing or re-importing into the platform.
                    </Typography>
                  </Box>
                }
                arrow
              >
                <IconButton>
                  <HelpOutline />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <TextField
            fullWidth
            margin="dense"
            label="File Name"
            type="text"
            value={exportFileName}
            onChange={(e) => setExportFileName(e.target.value)}
            sx={{ marginBottom: 2, fontSize: '0.875rem' }}
            InputProps={{
              sx: { fontSize: '0.875rem' },
            }}
            InputLabelProps={{
              sx: { fontSize: '0.875rem' },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExportDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              exportRecipeScript(
                workflow,
                inputData,
                inputDataType,
                outputTypesMap,
                exportFileName,
                showNotification,
                setOpenExportDialog
              );
            }}
            color="primary"
          >
            Download Script
          </Button>
          <Button
            onClick={() => {
              exportRecipeConfigFile(
                workflow,
                inputData,
                inputDataType,
                exportFileName,
                showNotification,
                setOpenExportDialog
              );
            }}
            color="primary"
          >
            Download Config
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Recipe Dialog */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Recipe</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Please choose an option to import your workflow:
          </Typography>

          {/* Tab Navigation for Import Options */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }}>
            <Tabs
              value={importMode}
              onChange={(e, newValue) => setImportMode(newValue)}
              aria-label="Import options"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="Command" value="command" />
              <Tab label="Config File" value="file" />
            </Tabs>
          </Box>

          {/* Import Command */}
          {importMode === 'command' && (
            <Box>
              <TextField
                autoFocus
                margin="dense"
                label="Command"
                type="text"
                fullWidth
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                helperText={importError || 'Enter a valid workflow command.'}
                error={!!importError}
                placeholder="e.g., ./gto_fasta_complement < input.fa || ./gto_fasta_extract -i 0 -e 4 > output.txt"
                InputProps={{
                  sx: { fontSize: '0.875rem' },
                }}
                InputLabelProps={{
                  sx: { fontSize: '0.875rem' },
                }}
                FormHelperTextProps={{
                  sx: { fontSize: '0.75rem' },
                }}
              />
            </Box>
          )}

          {/* Import from File */}
          {importMode === 'file' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" gutterBottom sx={{ fontSize: '0.875rem' }}>
                Upload a JSON configuration file to import your workflow.
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<FileUpload />}
                sx={{ alignSelf: 'flex-start' }}
              >
                Upload File
                <input
                  type="file"
                  hidden
                  accept="application/json"
                  onChange={(e) => setImportFile(e.target.files[0])}
                />
              </Button>
              {importFile && (
                <Typography variant="body2" sx={{ marginTop: 1, fontSize: '0.875rem' }}>
                  Selected file: {importFile.name}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (importMode === 'command') {
                // Handle import via command
                importRecipeCommand(
                  importInput,
                  setWorkflow,
                  setImportError,
                  setOpenImportDialog,
                  inputDataType,
                  showNotification,
                  validateParameters,
                  validateWorkflow
                );
              } else if (importMode === 'file' && importFile) {
                // Handle import via file
                importRecipeConfigFile(
                  importFile,
                  setWorkflow,
                  setInputData,
                  setInputDataType,
                  showNotification,
                  setOpenImportDialog
                );
              } else {
                showNotification('Please provide a valid input for import.', 'error');
              }
            }}
            color="primary"
            disabled={importMode === 'file' && !importFile && importMode === 'command' && !importInput}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>

    </Paper >
  );
};

export default RecipePanel;
