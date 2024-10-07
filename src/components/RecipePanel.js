// RecipePanel.jsx
import React, { useState, useContext } from 'react';
import {
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Box,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Save, FolderOpen, PlayArrow } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItem from './SortableItem';
import description from '../../description.json';
import { NotificationContext } from '../contexts/NotificationContext';
import { loadWasmModule } from '../gtoWasm';

const RecipePanel = ({ workflow, setWorkflow, inputData, setOutputData }) => {
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [recipeName, setRecipeName] = useState('');
  const [openLoadDialog, setOpenLoadDialog] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const showNotification = useContext(NotificationContext);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (active && over && active.id !== over.id) {
      const oldIndex = workflow.findIndex((item) => item.id === active.id);
      const newIndex = workflow.findIndex((item) => item.id === over.id);
      setWorkflow(arrayMove(workflow, oldIndex, newIndex));
    }
  };

  const handleDelete = (id) => {
    setWorkflow(workflow.filter((item) => item.id !== id));
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

  const handleParameterChange = (id, paramName, value) => {
    setWorkflow(
      workflow.map((item) =>
        item.id === id
          ? { ...item, params: { ...item.params, [paramName]: value } }
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
        // Handle parameters
        toolConfig.parameters.forEach((param) => {
          if (tool.params[param.name] !== undefined && tool.params[param.name] !== '') {
            args.push(`--${param.name}`);
            args.push(`${tool.params[param.name]}`);
          }
        });
        // Handle flags
        toolConfig.flags.forEach((flag) => {
          if (tool.params[flag]) {
            args.push(flag);
          }
        });
      }

      // Ensure input is defined
      if (input === undefined || input === null) {
        input = '';
      }

      // Execute the tool
      const outputData = await runFunction(input, args);

      if (outputData.stderr) {
        showNotification(`Error in ${tool.toolName}: ${outputData.stderr}`, 'error');
        throw new Error(outputData.stderr);
      }

      return outputData.stdout;
    } catch (error) {
      showNotification(`Execution failed: ${error.message}`, 'error');
      throw error;
    }
  };

  const handleRunTool = async (tool) => {
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
    const toolConfig = description.tools.find(
      (t) => t.name === `gto_${tool.toolName}`
    );
    if (!toolConfig) return null;

    const parametersAndFlags = [
      ...(toolConfig.parameters || []).map((param) => ({
        name: param.name,
        type: param.type,
        isFlag: false,
      })),
      ...(toolConfig.flags || []).map((flag) => ({
        name: flag,
        type: 'boolean',
        isFlag: true,
      })),
    ];

    if (parametersAndFlags.length === 0) return null;

    return (
      <Box sx={{ marginTop: 1 }}>
        {parametersAndFlags.map((item) => {
          const value = tool.params[item.name];
          return (
            <Box
              key={item.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 1,
                gap: 1,
              }}
            >
              {item.isFlag ? (
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!value}
                      onChange={(e) =>
                        handleParameterChange(tool.id, item.name, e.target.checked)
                      }
                    />
                  }
                  label={item.name}
                />
              ) : (
                <>
                  <Typography variant="body2" sx={{ minWidth: '100px' }}>
                    {item.name}
                  </Typography>
                  <TextField
                    value={value || ''}
                    onChange={(e) =>
                      handleParameterChange(tool.id, item.name, e.target.value)
                    }
                    size="small"
                    type={
                      item.type === 'integer' || item.type === 'float' ? 'number' : 'text'
                    }
                    sx={{ flexGrow: 1 }}
                  />
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
      <Typography variant="h6" gutterBottom>
        Workflow
      </Typography>
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
                    <Paper sx={{ padding: 1, backgroundColor: '#f5f5f5' }}>
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
                onDelete={() => {}}
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
    </Paper>
  );
};

export default RecipePanel;
