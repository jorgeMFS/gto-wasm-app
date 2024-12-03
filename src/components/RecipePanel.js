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
import { ContentCopy, FileUpload, FolderOpen, GetApp, HelpOutline, PlayArrow, Save } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import description from '../../description.json';
import { DataTypeContext } from '../contexts/DataTypeContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { loadWasmModule } from '../gtoWasm';
import { detectDataType } from '../utils/detectDataType';
import { exportRecipe } from '../utils/exportRecipe';
import SortableItem from './SortableItem';

const RecipePanel = ({ workflow, setWorkflow, inputData, setOutputData }) => {
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [recipeName, setRecipeName] = useState('');
  const [openLoadDialog, setOpenLoadDialog] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const { setDataType, dataType, inputDataType } = useContext(DataTypeContext); // To update data type context
  const [invalidItemIds, setInvalidItemIds] = useState([]); // To store invalid item IDs
  const [outputTypesMap, setOutputTypesMap] = useState({}); // To store output types of tools
  const [validationErrors, setValidationErrors] = useState({}); // To store validation errors for parameters
  const [helpMessages, setHelpMessages] = useState({}); // To store help messages for toolconst [openExportDialog, setOpenExportDialog] = useState(false); // State for export dialog
  const [exportFileName, setExportFileName] = useState('workflow_script.sh'); // Default export name
  const [openExportDialog, setOpenExportDialog] = useState(false); // State for export dialog
  const [command, setCommand] = useState('');
  const [openImportDialog, setOpenImportDialog] = useState(false); // State for import dialog
  const [importInput, setImportInput] = useState(''); // State for import input
  const [importError, setImportError] = useState(''); // State for import error

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const showNotification = useContext(NotificationContext);

  useEffect(() => {
    if (workflow.length > 0) {
      const lastTool = workflow[workflow.length - 1];
      const lastOutputType = outputTypesMap[lastTool.id];

      // Update the data type based on the last valid tool in the workflow
      if (lastOutputType) {
        if (lastOutputType !== dataType) {
          showNotification(`Data type updated to ${lastOutputType}`, 'info');
        }
        setDataType(lastOutputType);
      }
    } else {
      // If the workflow is empty, reset the data type to the input type
      setDataType(inputDataType);
    }
  }, [workflow, outputTypesMap, inputDataType, setDataType]);

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
      const generatedCommand = exportRecipe(
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

  const processImportCommand = (command) => {
    try {
      // Split the command into steps
      const steps = command.split(/\|\|?/).map((step) => step.trim());
      if (steps.length === 0) throw new Error('Invalid command: No steps found.');

      let inputFile = null;
      let outputFile = null;

      let newWorkflow = [];

      steps.forEach((step) => {
        // Divides the step into tool and arguments
        const [toolWithPath, ...args] = step.split(/\s+/);
        const toolName = toolWithPath.replace('./gto_', ''); // Extract the tool name
        const toolConfig = description.tools.find((t) => t.name === `gto_${toolName}`);
        if (!toolConfig) throw new Error(`Tool "${toolName}" is not recognized.`);

        // Initialize the parameters object
        const params = {};

        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (arg.startsWith('./')) {
            throw new Error('Invalid argument: Consecutive tool paths detected.');
          } else if (arg === '<') {
            // Manipulation of input redirection
            if (inputFile) throw new Error('Multiple input redirections detected.');
            i++; // Next argument is the input file
            if (!args[i]) throw new Error('Missing input file after "<".');
            inputFile = args[i];
          } else if (arg === '>') {
            // Manipulation of output redirection
            if (outputFile) throw new Error('Multiple output redirections detected.');
            i++; // Next argument is the output file
            if (!args[i]) throw new Error('Missing output file after ">".');
            outputFile = args[i];
          } else {
            // Verify if the argument is a flag
            const flagObj = toolConfig.flags.find((flag) => flag.flag === arg);

            if (flagObj) {
              if (flagObj.parameter) {
                i++; // Next argument is the parameter value
                params[flagObj.flag] = true; // Define the flag as active
                if (!args[i] || ['<', '>', '-'].includes(args[i][0])) {
                  params[flagObj.parameter] = '';
                  i--; // Revert to the previous argument
                } else {
                  params[flagObj.parameter] = args[i]; // Define the parameter value
                }
              }
            }
          }
        }

        const uniqueId = `${toolName}-${uuidv4()}`;
        const newOperation = {
          id: uniqueId,
          toolName,
          params,
        };

        // Add the new operation to the workflow
        newWorkflow.push(newOperation);
      });

      if (!inputFile) throw new Error('Workflow must include an input file.');
      if (!outputFile) throw new Error('Workflow must include an output file.');

      // Clear the error and close the dialog
      setImportError('');
      setOpenImportDialog(false);

      // Get the input data type of the first tool
      const firstTool = description.tools.find((t) => `gto_${newWorkflow[0].toolName}` === t.name);
      const firstToolInputTypes = firstTool.input.format.split(',').map(f => f.trim());
      const firstToolInputType = firstToolInputTypes[0] || 'UNKNOWN';

      // Checks if the sequence of tools is valid
      if (validateWorkflow(newWorkflow, firstToolInputType)) {
        let valid = true;
        let validInput = true;

        // Validate each tool parameters
        for (let i = 0; i < newWorkflow.length; i++) {
          const tool = newWorkflow[i];
          if (!validateParameters(tool)) {
            valid = false;
            break;
          }
        }

        // Check if the input data type is compatible with the first tool
        if (!firstToolInputTypes.includes(inputDataType)) {
          validInput = false;
        }

        if (valid && validInput) {
          showNotification('Workflow imported successfully!', 'success');
        } else if (!valid && validInput) {
          showNotification('Workflow imported with errors. Please correct the invalid parameters', 'warning');
        } else if (valid && !validInput) {
          showNotification('Workflow imported successfully! Be aware that the input data type may not be compatible with the first tool.', 'warning');
        } else {
          showNotification('Workflow imported with errors. Please correct the invalid parameters and the input data type.', 'warning');
        }

        setWorkflow(newWorkflow);
      } else {
        throw new Error('Invalid workflow: Incompatible steps.');
      }
    } catch (error) {
      setImportError(error.message);
      showNotification(`Failed to import workflow: ${error.message}`, 'error');
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
          }
        }
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
      const newWorkflow = workflow.slice(0, index); // Remove todos os itens a partir do índice
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

  const handleSaveRecipe = () => {
    if (recipeName.trim() === '') return;
    setSavedRecipes([...savedRecipes, { name: recipeName, workflow }]);
    setRecipeName('');
    setOpenSaveDialog(false);
  };

  const handleLoadRecipe = (saved) => {
    setWorkflow(saved.workflow);
    setOpenLoadDialog(false);
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
      // else {
      //   if (hasInfoMessage) {
      //     setTimeout(() => {
      //       showNotification(`Data type updated to ${detectedType}`, 'info');
      //     }, 7000); // Delay to ensure it appears after info messages
      //   } else {
      //     showNotification(`Data type updated to ${detectedType}`, 'info');
      //   }
      // }


      return outputData.stdout;
    } catch (error) {
      showNotification(`Execution failed: ${error.message}`, 'error');
      throw error;
    }
  };

  const handleRunTool = async (tool) => {
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

      // If the tool is the last in the workflow, update the overall output
      if (toolIndex === workflow.length - 1) {
        setOutputData(data);
      }
    } catch (error) {
      setOutputData(`Error: ${error.message}`);
      showNotification(`Workflow execution failed: ${error.message}`, 'error');
    } finally {
      setRunningToolIds((ids) => ids.filter((id) => id !== tool.id));
    }
  };

  const renderParameters = (tool) => {
    const toolConfig = description.tools.find((t) => t.name === `gto_${tool.toolName}`);
    if (!toolConfig) return null;

    const toolErrors = validationErrors[tool.id] || {};
    const toolHelp = helpMessages[tool.toolName] || { general: 'Loading help...', flags: {} };
    const flagHelpMessages = toolHelp.flags || {};

    return (
      <Box sx={{ marginTop: 1 }}>
        {toolConfig.flags
          .filter((flagObj) => flagObj.flag !== '-h')
          .map((flagObj) => {
            const isFlagRequired = flagObj.required;
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
                {/* Render flag and parameter input */}
                {isFlagRequired ? (
                  <>
                    <Typography variant="body2" sx={{ minWidth: '100px' }}>
                      {flagObj.flag}
                    </Typography>
                    {/* Add help icon to a required flag */}
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
                      <IconButton size="small" sx={{ marginLeft: 1 }}>
                        <HelpOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {flagObj.parameter && (
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
                  </>
                ) : (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={flagValue}
                          onChange={(e) =>
                            handleParameterChange(tool.id, flagObj.flag, e.target.checked)
                          }
                        />
                      }
                      label={flagObj.flag}
                      sx={{ alignItems: 'center' }}
                    />
                    {/* Add help icon to a flag */}
                    <Tooltip
                      title={
                        flagHelpMessages[flagObj.flag] || 'Loading help message...'
                      }
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
                      <IconButton size="small" sx={{ marginLeft: 1 }}>
                        <HelpOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
                  </>
                )}
              </Box>
            );
          })}
      </Box>
    );
  };


  return (
    <Paper
      elevation={3}
      sx={{ padding: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Workflow
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ marginLeft: 2, textAlign: 'center', flexGrow: 1 }}>
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
            {workflow.map((tool) => (
              <SortableItem
                key={tool.id}
                id={tool.id}
                toolName={tool.toolName}
                onDelete={() => handleDelete(tool.id)}
                onDeleteFromHere={() => handleDeleteFromHere(tool.id)}
                isInvalid={invalidItemIds.includes(tool.id)} // Is true if the tool is invalid
                helpMessage={helpMessages[tool.toolName]?.general}
              >
                {renderParameters(tool)}
                <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleRunTool(tool)}
                    startIcon={<PlayArrow />}
                    disabled={runningToolIds.includes(tool.id)}
                  >
                    Run
                  </Button>
                  {runningToolIds.includes(tool.id) && (
                    <CircularProgress size={24} sx={{ marginLeft: 1 }} />
                  )}
                </Box>
                {outputs[tool.id] && (
                  <Box sx={{ marginTop: 1 }}>
                    <Typography variant="subtitle2">Output:</Typography>
                    <Paper sx={{ padding: 1, backgroundColor: '#f5f5f5', overflow: 'auto', maxHeight: '200px', wordWrap: 'break-word' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {outputs[tool.id]}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </SortableItem>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenSaveDialog(true)}
          startIcon={<Save />}
        >
          Save Recipe
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setOpenLoadDialog(true)}
          startIcon={<FolderOpen />}
        >
          Load Recipe
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            if (workflow.length > 0) {
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

      {/* Save Recipe Dialog */}
      <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)}>
        <DialogTitle>Save Recipe</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Recipe Name"
            type="text"
            fullWidth
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSaveDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveRecipe} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Load Recipe Dialog */}
      <Dialog open={openLoadDialog} onClose={() => setOpenLoadDialog(false)}>
        <DialogTitle>Load Recipe</DialogTitle>
        <DialogContent>
          {savedRecipes.length === 0 ? (
            <Typography>No saved recipes.</Typography>
          ) : (
            savedRecipes.map((saved, index) => (
              <Paper
                key={index}
                sx={{
                  padding: 1,
                  marginBottom: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography sx={{ flexGrow: 1 }}>{saved.name}</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => handleLoadRecipe(saved)}
                >
                  Load
                </Button>
              </Paper>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoadDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Recipe Dialog */}
      <Dialog open={openExportDialog} onClose={() => setOpenExportDialog(false)}>
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

          {/* Download script */}
          <Typography variant="subtitle1" gutterBottom>
            Download Script:
          </Typography>
          <TextField
            fullWidth
            margin="dense"
            label="File Name"
            type="text"
            value={exportFileName}
            onChange={(e) => setExportFileName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExportDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (workflow.length > 0) {
                exportRecipe(
                  workflow,
                  inputData,
                  inputDataType,
                  outputTypesMap,
                  exportFileName,
                  showNotification,
                  setOpenExportDialog
                );
              } else {
                showNotification('Workflow is empty. Cannot export script.', 'error');
              }
            }}
            color="primary"
          >
            Download Script
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Recipe Dialog */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Recipe</DialogTitle>
        <DialogContent>
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
            placeholder="e.g., ./gto_fasta_complement  < input.fa || ./gto_fasta_extract -i 0 -e 4 > output.txt"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={() => processImportCommand(importInput)}
            color="primary"
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>

    </Paper>
  );
};

export default RecipePanel;
