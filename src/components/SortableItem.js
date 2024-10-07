import React from 'react';
import { Paper, Typography, IconButton, Tooltip, Box } from '@mui/material';
import { Delete, DragIndicator } from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ id, toolName, onDelete, children, isDragging }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: '8px',
    padding: '8px',
    borderRadius: '4px',
    cursor: 'grab',
    backgroundColor: isDragging ? 'rgba(255, 255, 255, 0.8)' : 'white',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={1}
      {...attributes}
      {...listeners}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <DragIndicator sx={{ marginRight: 1, color: 'text.secondary' }} />
        <Typography variant="body1" sx={{ flexGrow: 1 }}>
          {toolName}
        </Typography>
        <Tooltip title="Delete Operation">
          <IconButton onClick={onDelete} size="small">
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      {children}
    </Paper>
  );
};

export default SortableItem;
