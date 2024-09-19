import React from 'react';
import { 
  Paper, 
  Typography, 
  IconButton 
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ id, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
  };

  // Extract the operation name from the unique ID
  const operationName = id.split('-')[0];

  return (
    <Paper ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Typography>{operationName}</Typography>
      <IconButton onClick={onDelete} size="small">
        <Delete />
      </IconButton>
    </Paper>
  );
};

export default SortableItem;