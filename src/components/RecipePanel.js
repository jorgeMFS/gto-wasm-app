import React, { useState, useEffect } from 'react';
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
  Divider
} from '@mui/material';
import { Delete, Save, FolderOpen } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import SortableItem from './SortableItem'; // Ensure this path is correct

const RecipePanel = ({ workflow, setWorkflow, gtoModules }) => {
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [openLoadDialog, setOpenLoadDialog] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('savedWorkflows');
    if (stored) {
      setSavedWorkflows(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('savedWorkflows', JSON.stringify(savedWorkflows));
  }, [savedWorkflows]);

  const handleDelete = (index) => {
    const newWorkflow = Array.from(workflow);
    newWorkflow.splice(index, 1);
    setWorkflow(newWorkflow);
  };

  const handleSaveWorkflow = () => {
    const newSavedWorkflows = [...savedWorkflows, { name: workflowName, workflow }];
    setSavedWorkflows(newSavedWorkflows);
    setWorkflowName('');
    setOpenSaveDialog(false);
  };

  const handleLoadWorkflow = (loadedWorkflow) => {
    setWorkflow(loadedWorkflow);
    setOpenLoadDialog(false);
  };

  const handleClearWorkflow = () => {
    setWorkflow([]);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = workflow.indexOf(active.id);
      const newIndex = workflow.indexOf(over.id);
      setWorkflow((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <Paper style={{ padding: '20px', minHeight: '400px' }}>
      <Typography variant="h6" gutterBottom>
        Workflow
      </Typography>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={workflow}
          strategy={verticalListSortingStrategy}
        >
          {workflow.map((operation, index) => (
            <SortableItem 
              key={operation} 
              id={operation} 
              onDelete={() => handleDelete(index)} 
            />
          ))}
        </SortableContext>
      </DndContext>

      <Divider style={{ margin: '20px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setOpenSaveDialog(true)}
          startIcon={<Save />}
        >
          Save
        </Button>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={() => setOpenLoadDialog(true)}
          startIcon={<FolderOpen />}
        >
          Load
        </Button>
        <Button 
          variant="outlined" 
          color="inherit" 
          onClick={handleClearWorkflow}
        >
          Clear
        </Button>
      </div>

      {/* Save Workflow Dialog */}
      <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)}>
        <DialogTitle>Save Workflow</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Workflow Name"
            type="text"
            fullWidth
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSaveDialog(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveWorkflow} 
            color="primary" 
            disabled={!workflowName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Load Workflow Dialog */}
      <Dialog open={openLoadDialog} onClose={() => setOpenLoadDialog(false)}>
        <DialogTitle>Load Workflow</DialogTitle>
        <DialogContent>
          {savedWorkflows.length === 0 ? (
            <Typography>No saved workflows available.</Typography>
          ) : (
            savedWorkflows.map((saved, idx) => (
              <Paper 
                key={idx} 
                style={{ padding: '10px', marginBottom: '10px', cursor: 'pointer' }}
                onClick={() => handleLoadWorkflow(saved.workflow)}
              >
                <Typography>{saved.name}</Typography>
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