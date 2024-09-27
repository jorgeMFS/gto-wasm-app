import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  IconButton, 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Divider,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Delete, Save, FolderOpen, ExpandMore } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItem from './SortableItem';
import description from '../../description.json';

const RecipePanel = ({ workflow, setWorkflow, gtoModules }) => {
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [recipeName, setRecipeName] = useState('');
  const [openLoadDialog, setOpenLoadDialog] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = workflow.findIndex(item => item.id === active.id);
      const newIndex = workflow.findIndex(item => item.id === over.id);
      setWorkflow(arrayMove(workflow, oldIndex, newIndex));
    }
  };

  const handleDelete = (id) => {
    setWorkflow(workflow.filter(item => item.id !== id));
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
    setWorkflow(workflow.map(item => 
      item.id === id 
        ? { ...item, params: { ...item.params, [paramName]: value } }
        : item
    ));
  };

  const renderParameters = (tool) => {
    const toolConfig = description.tools.find(t => t.name === `gto_${tool.toolName}`);
    if (!toolConfig) return null;

    const hasParameters = toolConfig.parameters && toolConfig.parameters.length > 0;
    const hasFlags = toolConfig.flags && toolConfig.flags.length > 0;

    if (!hasParameters && !hasFlags) return null;

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Parameters & Flags</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {hasFlags && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {toolConfig.flags.map(flag => (
                  <FormControlLabel
                    key={flag}
                    control={
                      <Checkbox
                        checked={tool.params[flag] || false}
                        onChange={(e) => handleParameterChange(tool.id, flag, e.target.checked)}
                      />
                    }
                    label={flag}
                  />
                ))}
              </Box>
            )}
            {hasParameters && toolConfig.parameters.map(param => (
              <Box key={param.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ minWidth: '100px' }}>{param.name}:</Typography>
                <FormControl size="small" sx={{ minWidth: '120px' }}>
                  <Select
                    value={tool.params[param.name] || ''}
                    onChange={(e) => handleParameterChange(tool.id, param.name, e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {param.type === 'integer' && [1, 2, 3, 4, 5].map(value => (
                      <MenuItem key={value} value={value}>{value}</MenuItem>
                    ))}
                    {param.type === 'float' && [0.1, 0.2, 0.3, 0.4, 0.5].map(value => (
                      <MenuItem key={value} value={value}>{value.toFixed(1)}</MenuItem>
                    ))}
                    {param.type === 'string' && ['option1', 'option2', 'option3'].map(value => (
                      <MenuItem key={value} value={value}>{value}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Paper sx={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Workflow
      </Typography>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={workflow.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {workflow.map((tool) => (
              <React.Fragment key={tool.id}>
                <SortableItem 
                  id={tool.id} 
                  onDelete={() => handleDelete(tool.id)} 
                />
                {renderParameters(tool)}
              </React.Fragment>
            ))}
          </Box>
        </SortableContext>
      </DndContext>

      <Divider sx={{ margin: '20px 0' }} />

      <Box>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setOpenSaveDialog(true)} 
          sx={{ marginRight: '10px' }}
          startIcon={<Save />}
        >
          Save Recipe
        </Button>
        <Button 
          variant="contained" 
          color="secondary"
          startIcon={<FolderOpen />}
          onClick={() => setOpenLoadDialog(true)}
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
          {savedRecipes.map((saved, index) => (
            <Paper key={index} sx={{ padding: '10px', marginBottom: '10px' }}>
              <Typography>{saved.name}</Typography>
              <Button onClick={() => handleLoadRecipe(saved)} color="primary">
                Load
              </Button>
            </Paper>
          ))}
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