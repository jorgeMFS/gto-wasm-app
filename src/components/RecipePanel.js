import React from 'react';
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
  Box
} from '@mui/material';
import { Delete, Save, FolderOpen } from '@mui/icons-material';
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

const RecipePanel = ({ workflow, setWorkflow, gtoModules }) => {
  const [openSaveDialog, setOpenSaveDialog] = React.useState(false);
  const [savedRecipes, setSavedRecipes] = React.useState([]);
  const [recipeName, setRecipeName] = React.useState('');
  const [openLoadDialog, setOpenLoadDialog] = React.useState(false);

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
            {workflow.map(({ id, toolName }) => (
              <SortableItem 
                key={id} 
                id={id} 
                onDelete={() => handleDelete(id)} 
              />
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