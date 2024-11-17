import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Delete, DragIndicator, HelpOutline } from '@mui/icons-material';
import {
  Box, IconButton, Menu,
  MenuItem, Paper, Tooltip, Typography
} from '@mui/material';
import React, { useState } from 'react';

const SortableItem = ({ id, toolName, onDelete, onDeleteFromHere, children, isDragging, isInvalid, helpMessage }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
        <Tooltip
          title={<pre style={{ whiteSpace: 'pre-wrap' }}>{helpMessage || 'Loading help...'}</pre>}
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                maxWidth: 'none',
              },
            },
          }}
        >
          <IconButton size="small" sx={{ marginLeft: 1 }}>
            <HelpOutline fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Delete Operation">
          <IconButton onClick={handleMenuOpen} size="small">
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onDelete(id); // Remove only this operation
            }}
          >
            Remove this operation
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onDeleteFromHere(id); // Remove this operation and all operations below it
            }}
          >
            Remove from here downwards
          </MenuItem>
        </Menu>

      </Box>
      {children}
    </Paper>
  );
};

export default SortableItem;
