import React, { useRef, useState } from 'react';
import { Box, Button, Typography, List, ListItem, ListItemText } from '@mui/material';

export default function FileUpload({ onFilesSelected }) {
  const [files, setFiles] = useState([]);
  const dropRef = useRef();

  const handleFiles = (fileList) => {
    const fileArr = Array.from(fileList);
    setFiles((prev) => [...prev, ...fileArr]);
    if (onFilesSelected) onFilesSelected([...files, ...fileArr]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
  };

  return (
    <Box>
      <Box
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        sx={{
          border: '2px dashed #1976d2',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          color: '#1976d2',
          mb: 2,
          cursor: 'pointer',
        }}
        onClick={() => dropRef.current.querySelector('input').click()}
      >
        <Typography variant="body1">Drag and drop files here, or click to select files</Typography>
        <input
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
      </Box>
      {files.length > 0 && (
        <List dense>
          {files.map((file, idx) => (
            <ListItem key={idx}>
              <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(2)} KB`} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
} 