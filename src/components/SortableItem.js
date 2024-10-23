import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Delete, DragIndicator } from '@mui/icons-material';
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import React from 'react';

const SortableItem = ({ id, toolName, onDelete, children, isDragging, isInvalid }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });

  return (
    <Paper
      ref={setNodeRef}
      elevation={1}
      {...attributes}
      {...listeners}
      sx={{
        transform: CSS.Transform.toString(transform),
        transition: 'transform 150ms ease, background-color 300ms ease, border-color 300ms ease', // Smooth transition for both color and transform
        marginBottom: '8px',
        padding: '8px',
        borderRadius: '4px',
        cursor: 'grab',
        backgroundColor: isDragging
          ? 'rgba(255, 255, 255, 0.8)'
          : isInvalid
            ? 'rgba(255, 0, 0, 0.1)' // Light red background for invalid items
            : 'white', // Default background
        border: isInvalid ? '1px solid red' : '1px solid transparent', // Red border for invalid items
        opacity: isDragging ? 0.8 : 1,
      }}
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
