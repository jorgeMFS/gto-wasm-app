import {
    ChevronRight,
    Close,
    CreateNewFolder,
    Delete,
    DriveFolderUpload,
    Edit,
    ExpandMore,
    FileUpload,
    FolderZip,
    Info,
    InsertDriveFile,
    LibraryAddCheck,
    MoreVert,
    NoteAdd
} from '@mui/icons-material';
import {
    Box,
    Button,
    Checkbox,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import JSZip from 'jszip';
import React, { useContext, useRef, useState } from 'react';
import { DataTypeContext } from '../contexts/DataTypeContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { detectDataType } from '../utils/detectDataType';

const FileExplorer = ({ selectedFiles, setSelectedFiles, tree, setTree }) => {

    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [contextMenu, setContextMenu] = useState(null);
    const [activeNode, setActiveNode] = useState(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState('');
    // const [isCreating, setIsCreating] = useState(false);
    // const [newItemType, setNewItemType] = useState('file');
    const [showFileInfo, setShowFileInfo] = useState(false);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const zipInputRef = useRef(null);

    // Old variables
    const [isAcceptable, setIsAcceptable] = useState(true);
    const [openMetadataDialog, setOpenMetadataDialog] = useState(false);
    const { validateData } = useContext(DataTypeContext);
    const showNotification = useContext(NotificationContext);

    // Define acceptable file extensions
    const acceptableExtensions = ['.fasta', '.fa', '.fastq', '.fq', '.pos', '.svg', '.txt', '.num'];

    // Function to process uploaded files
    const processFile = (file) => {
        const extension = `.${file.name.split('.').pop().toLowerCase()}`;
        if (!acceptableExtensions.includes(extension)) {
            showNotification(`Unsupported file ${file.name} with type ${extension}.`, 'error');
            return null;
        }

        const fileSizeLimit = 100 * 1024 * 1024; // 100MB limit
        const isPartial = file.size > fileSizeLimit;
        const reader = new FileReader();

        if (isPartial) {
            showNotification(`The file ${file.name} is too large. Only the first 100 lines will be loaded.`, 'warning');
        }

        return new Promise((resolve, reject) => {
            reader.onload = (e) => {
                const content = e.target.result.split('\n').slice(0, isPartial ? 100 : undefined).join('\n');
                const detectedType = detectDataType(file.name, content);

                if (!validateData(content, detectedType) && detectedType !== 'UNKNOWN') {
                    showNotification(`Invalid ${detectedType} data format in ${file.name}.`, 'error');
                    reject();
                }

                resolve({
                    id: `${file.name}-${Date.now()}`,
                    name: file.name,
                    type: "file",
                    fileType: detectedType,
                    content,
                    size: file.size,
                    lastModified: new Date(file.lastModified),
                });
            };

            reader.onerror = () => {
                showNotification(`Failed to read file: ${file.name}`, 'error');
                reject();
            };

            reader.readAsText(isPartial ? file.slice(0, fileSizeLimit) : file);
        });
    };

    // Function to insert files into a folder
    const insertFilesIntoFolder = (nodes, folderId, newFiles) => {
        if (folderId === 'root') {
            return [...nodes, ...newFiles];
        }

        return nodes.map(node => {
            if (node.id === folderId && node.type === 'folder') {
                // Insert new file nodes here
                return {
                    ...node,
                    children: [...(node.children || []), ...newFiles],
                };
            } else if (node.children) {
                // Recursively check subfolders
                return {
                    ...node,
                    children: insertFilesIntoFolder(node.children, folderId, newFiles),
                };
            }
            return node;
        });
    };

    // Handle multiple file uploads
    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        try {
            const processedFiles = await Promise.all(files.map(processFile));
            const validFiles = processedFiles.filter((file) => file !== null);

            const targetFolderId = activeNode?.type === 'folder' ? activeNode.id : 'root';

            setTree((prev) => {
                const newTree = {
                    ...prev,
                    children: insertFilesIntoFolder(
                        prev.children || [],
                        targetFolderId,
                        validFiles
                    ),
                };
                return newTree;
            }
            );

            showNotification(`${validFiles.length} file(s) uploaded successfully.`, 'success');

        } catch (error) {
            console.error('File processing error:', error);
        }
    };

    // Helper: Recursively adds a file node into the tree based on its path parts
    const addFileToTree = (pathParts, fileNode, tree) => {
        if (pathParts.length === 1) {
            // Base case: add the file node
            tree.push(fileNode);
            return;
        }

        const folderName = pathParts.shift();
        // Check if the folder already exists in the current level of the tree
        let folder = tree.find(item => item.type === 'folder' && item.name === folderName);

        if (!folder) {
            folder = {
                id: `${folderName}-${Date.now()}`,
                name: folderName,
                type: 'folder',
                children: [],
            };
            tree.push(folder);
        }
        // Recursively add the file to the subfolder
        addFileToTree(pathParts, fileNode, folder.children);
    };

    // Handle directory upload
    const handleDirectoryUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        const newFilesTree = [];

        let processedFilesCount = 0;

        // Process each file from the uploaded directory
        for (const file of files) {
            try {
                const processedFile = await processFile(file);
                if (processedFile) {
                    // Reconstruct folder structure using webkitRelativePath, e.g. "folder/subfolder/file.txt"
                    const relativePath = file.webkitRelativePath;
                    const pathParts = relativePath.split('/'); // e.g., ["Documents", "file.txt"]

                    // Insert file node into the newFilesTree based on its relative path
                    addFileToTree([...pathParts], processedFile, newFilesTree);
                    processedFilesCount++;
                }
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
            }
        }

        // Merge the new files tree with your existing tree structure
        const targetFolderId = activeNode?.type === 'folder' ? activeNode.id : 'root';
        setTree((prev) => ({
            ...prev,
            children: insertFilesIntoFolder(prev.children || [], targetFolderId, newFilesTree),
        }));

        if (processedFilesCount === 0) {
            showNotification('No files were uploaded due to unsupported file types.', 'warning');
        } else {
            showNotification(`${processedFilesCount} file(s) uploaded successfully from directory.`, 'success');
        }
    };

    const withTimeout = (promise, timeout) => {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Processing timeout')), timeout)
            )
        ]);
    };

    const handleZipUpload = async (event) => {
        const MAX_ZIP_SIZE = 550 * 1024 * 1024; // 550MB
        const MAX_FILES = 1000;
        const PROCESSING_TIMEOUT = 120000; // 2 minutes

        const files = event.target.files;
        if (files.length === 0) return;

        const zipFile = files[0];
        if (zipFile.size > MAX_ZIP_SIZE) {
            showNotification('Zip file is too large.', 'error');
            return;
        }

        try {
            const zip = await withTimeout(JSZip.loadAsync(zipFile), PROCESSING_TIMEOUT);
            const fileNames = Object.keys(zip.files);

            if (fileNames.length > MAX_FILES) {
                showNotification(`Zip file contains too many files. Maximum allowed is ${MAX_FILES}.`, 'error');
                return;
            }

            const newFilesTree = [];

            let processedFilesCount = 0;

            for (const fileName of fileNames) {
                const zipEntry = zip.files[fileName];
                if (zipEntry.dir) continue;

                await new Promise(resolve => setTimeout(resolve, 0));

                const blob = await zipEntry.async('blob');
                const baseName = fileName.split('/').pop();
                const simulatedFile = new File([blob], baseName, {
                    lastModified: Date.now(),
                    type: blob.type,
                });

                try {
                    const processedFile = await processFile(simulatedFile);
                    if (processedFile) {
                        const pathParts = fileName.split('/'); // e.g. ["Documents", "Subfolder", "file.txt"]
                        addFileToTree([...pathParts], processedFile, newFilesTree);
                        processedFilesCount++;
                    }
                } catch (error) {
                    console.error(`Error processing file ${fileName}:`, error);
                }
            }

            const targetFolderId = activeNode?.type === 'folder' ? activeNode.id : 'root';
            setTree((prev) => ({
                ...prev,
                children: insertFilesIntoFolder(prev.children || [], targetFolderId, newFilesTree),
            }));

            showNotification(`${processedFilesCount} file(s) uploaded from zip.`, 'success');
        } catch (error) {
            console.error('Zip processing error:', error);
            showNotification('Failed to process zip file.', 'error');
        }
    };

    // Function to open metadata dialog and store the index of the file
    const handleViewMetadata = (file) => {
        setOpenMetadataDialog(true);
    };

    // Function to close metadata dialog
    const handleCloseMetadataDialog = () => {
        setOpenMetadataDialog(false);
    };

    const handleToggle = (node) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(node.id)) {
                newSet.delete(node.id);
            } else {
                newSet.add(node.id);
            }
            return newSet;
        });
    };

    const handleSelect = (node) => {
        setSelectedFiles((prev) => {
            const newSet = new Set(prev);

            // Helper to collect all file nodes from a node recursively
            const collectFiles = (n) => {
                let files = [];
                if (n.type === 'file') {
                    files.push(n);
                } else if (n.type === 'folder' && n.children) {
                    n.children.forEach(child => {
                        files = files.concat(collectFiles(child));
                    });
                }
                return files;
            };

            // Get the file type of already selected files (if any)
            const getCurrentSelectedType = () => {
                for (let file of newSet) {
                    return file.fileType;
                }
                return null;
            };

            // Toggle a single file node
            const toggleFile = (file, isFolder) => {
                if (newSet.has(file) && !isFolder) {
                    newSet.delete(file);
                } else {
                    const currentType = getCurrentSelectedType();
                    if (!currentType || currentType === file.fileType) {
                        newSet.add(file);
                    } else {
                        showNotification("Selected files must have the same type.", "error");
                    }
                }
            };

            // Toggle selection based on node type
            const toggleSelection = (n) => {
                if (n.type === 'file') {
                    toggleFile(n, false);
                } else if (n.type === 'folder') {
                    const files = collectFiles(n);
                    if (files.length === 0) return; // Nothing to add

                    const currentType = getCurrentSelectedType();

                    // If nothing is selected yet, ensure the folder is homogeneous
                    if (!currentType) {
                        const uniqueTypes = new Set(files.map(file => file.fileType));
                        if (uniqueTypes.size > 1) {
                            showNotification("Folder contains multiple file types. Please select files with the same type.", "error");
                            return;
                        }
                    } else {
                        // If something is already selected, ensure all folder files match
                        const incompatible = files.find(file => file.fileType !== currentType);
                        if (incompatible) {
                            showNotification("Folder contains files of a different type from the selected files.", "error");
                            return;
                        }
                    }

                    // If the folder is already selected, unselect all its files
                    if (files.every(file => newSet.has(file))) {
                        files.forEach(file => newSet.delete(file));
                    } else {
                        // If checks pass, toggle each file in the folder
                        files.forEach(file => toggleFile(file, true));
                    }
                }
            };

            toggleSelection(node);
            return newSet;
        });
    };

    const isFolderChecked = (folder) => {
        if (!folder.children || folder.children.length === 0) return false;
        return folder.children.every(child => {
            if (child.type === 'file') {
                return selectedFiles.has(child);
            } else if (child.type === 'folder') {
                return isFolderChecked(child);
            }
            return false;
        });
    };

    const handleContextMenu = (event, node) => {
        event.preventDefault();
        setActiveNode(node);
        setContextMenu(
            contextMenu === null
                ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4 }
                : null,
        );
    };

    const handleClose = () => {
        setContextMenu(null);
        setActiveNode(null);
    };

    const handleRename = () => {
        setIsRenaming(true);
        setNewName(activeNode?.name || '');
        setContextMenu(null);
    };

    const handleRenameSubmit = () => {
        console.log('Renaming', activeNode, 'to', newName);
        if (activeNode && newName) {
            const updateNodeName = (nodes) => {
                return nodes.map(node => {
                    if (node.id === activeNode.id) {
                        return { ...node, name: newName };
                    }
                    if (node.children) {
                        return { ...node, children: updateNodeName(node.children) };
                    }
                    return node;
                });
            };
            setTree(prev => ({ ...prev, children: updateNodeName(prev.children || []) }));
        }
        setIsRenaming(false);
        setActiveNode(null);
    };

    // const handleCreateSubmit = () => {
    //     if (activeNode && newName) {
    //         const newNode = {
    //             id: Date.now().toString(),
    //             name: newName,
    //             type: newItemType,
    //             children: newItemType === 'folder' ? [] : undefined,
    //         };
    //         const updateTree = (nodes) => {
    //             return nodes.map(node => {
    //                 if (node.id === activeNode.id && node.type === 'folder') {
    //                     return { ...node, children: [...(node.children || []), newNode] };
    //                 }
    //                 if (node.children) {
    //                     return { ...node, children: updateTree(node.children) };
    //                 }
    //                 return node;
    //             });
    //         };
    //         setTree(prev => ({ ...prev, children: updateTree(prev.children || []) }));
    //     }
    //     setIsCreating(false);
    // };

    const handleDelete = () => {
        if (activeNode) {
            const deleteNode = (nodes) => {
                return nodes.filter(node => node.id !== activeNode.id).map(node => {
                    if (node.children) {
                        return { ...node, children: deleteNode(node.children) };
                    }
                    return node;
                });
            };
            setTree(prev => ({ ...prev, children: deleteNode(prev.children || []) }));
        }
        handleClose();
    };

    const handleMenuItemFileUpload = () => {
        fileInputRef.current.click();
    };

    const handleMenuItemFolderUpload = () => {
        folderInputRef.current.click();
    };

    const handleMenuItemZipUpload = () => {
        zipInputRef.current.click();
    };

    const renderTree = (nodes) => (
        <List>
            {nodes.map((node) => (
                <React.Fragment key={node.id}>
                    <ListItem
                        button
                        onClick={() => node.type === 'folder' && handleToggle(node)}
                        onContextMenu={(event) => handleContextMenu(event, node)}
                    >
                        <ListItemIcon>
                            <Checkbox
                                edge="start"
                                checked={node.type === 'folder' ? isFolderChecked(node) : selectedFiles.has(node)}
                                tabIndex={-1}
                                disableRipple
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handleSelect(node);
                                }}
                            />
                        </ListItemIcon>
                        <ListItemIcon>
                            {node.type === 'folder' ? (
                                expandedFolders.has(node.id) ? <ExpandMore /> : <ChevronRight />
                            ) : (
                                <InsertDriveFile />
                            )}
                        </ListItemIcon>
                        <ListItemText primary={node.name} />
                        <ListItemSecondaryAction>
                            <IconButton edge="end" onClick={(event) => handleContextMenu(event, node)}>
                                <MoreVert />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                    {node.type === 'folder' && (
                        <Collapse in={expandedFolders.has(node.id)} timeout="auto" unmountOnExit>
                            <Box ml={4}>
                                {node.children && renderTree(node.children)}
                            </Box>
                        </Collapse>
                    )}
                </React.Fragment>
            ))}
        </List>
    );

    return (
        <Paper elevation={0} sx={{ height: '100%', overflow: 'auto', position: 'relative' }}>
            {tree.children && tree.children.length > 0 ? (
                renderTree(tree.children)
            ) : (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Typography variant="body1" sx={{ padding: '16px', textAlign: 'center' }}>
                        The file manager is empty. Please upload files to appear here.
                    </Typography>
                </Box>
            )
            }

            <Menu
                open={contextMenu !== null}
                onClose={handleClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                {activeNode?.type === 'folder' && (
                    <MenuItem onClick={handleMenuItemFileUpload}>
                        <ListItemIcon>
                            <NoteAdd fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>New File</ListItemText>
                        <input
                            type="file"
                            hidden
                            multiple
                            accept={acceptableExtensions.join(',')}
                            onChange={handleFileUpload}
                            ref={fileInputRef}
                        />
                    </MenuItem>
                )}
                {activeNode?.type === 'folder' && (
                    <MenuItem onClick={handleMenuItemFolderUpload}>
                        <ListItemIcon>
                            <CreateNewFolder fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>New Folder</ListItemText>
                        <input
                            type="file"
                            webkitdirectory="true"
                            mozdirectory="true"
                            hidden
                            multiple
                            onChange={handleDirectoryUpload}
                            ref={folderInputRef}
                        />
                    </MenuItem>
                )}
                {activeNode?.type === 'folder' && (
                    <MenuItem onClick={handleMenuItemZipUpload}>
                        <ListItemIcon>
                            <FolderZip fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>New ZIP</ListItemText>
                        <input
                            type="file"
                            hidden
                            accept=".zip"
                            onChange={handleZipUpload}
                            ref={zipInputRef}
                        />
                    </MenuItem>
                )}
                <MenuItem onClick={handleRename}>
                    <ListItemIcon>
                        <Edit fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Rename</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                        <Delete fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
                {activeNode?.type === 'file' && (
                    <MenuItem onClick={() => handleViewMetadata(activeNode)}>
                        <ListItemIcon>
                            <Info fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>File Info</ListItemText>
                    </MenuItem>
                )}
            </Menu>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    margin: 2, // Ajuste a margem conforme necessário
                }}
            >
                {/* File Counter */}
                <Typography variant="caption" color="textSecondary" sx={{ marginRight: 1 }}>
                    {selectedFiles.size} file(s)
                </Typography>
                {/* File Selection Dropdown */}
                <Tooltip
                    title="Selected Files"
                    placement="top"
                    PopperProps={{
                        modifiers: [
                            {
                                name: 'offset',
                                options: {
                                    offset: [0, -8], // Ajuste a margem conforme necessário
                                },
                            },
                        ],
                    }}>
                    <IconButton
                        color="primary"
                        sx={{
                            padding: '6px',
                            backgroundColor: 'primary.main',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                            },
                            color: 'white',
                        }}
                    >
                        <LibraryAddCheck fontSize="small" />
                        <Select
                            displayEmpty
                            sx={{
                                position: 'absolute',
                                opacity: 0,
                                width: '100%',
                                height: '100%',
                                top: 0,
                                left: 0,
                            }}
                        >
                            {selectedFiles.size > 0 ? (
                                Array.from(selectedFiles).map((file, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "4px 8px",
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ flexGrow: 1, marginRight: "10px" }}>
                                            {file.name}
                                        </Typography>
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="body2" sx={{ padding: 1, textAlign: "center", color: "gray" }}>
                                    No files selected
                                </Typography>
                            )}
                        </Select>
                    </IconButton>
                </Tooltip>
                <Tooltip title="Upload Files"
                    placement="top"
                    PopperProps={{
                        modifiers: [
                            {
                                name: 'offset',
                                options: {
                                    offset: [0, -8], // Ajuste a margem conforme necessário
                                },
                            },
                        ],
                    }}>
                    <IconButton
                        color="primary"
                        component="label"
                        sx={{
                            padding: '6px',
                            backgroundColor: isAcceptable ? 'primary.main' : 'grey.500',
                            '&:hover': {
                                backgroundColor: isAcceptable ? 'primary.dark' : 'grey.500',
                            },
                            cursor: isAcceptable ? 'pointer' : 'not-allowed',
                            color: 'white',
                        }}
                        disabled={!isAcceptable}
                    >
                        <FileUpload fontSize="small" />
                        <input type="file" hidden multiple accept={acceptableExtensions.join(',')} onChange={handleFileUpload} />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Upload Folder"
                    placement="top"
                    PopperProps={{
                        modifiers: [
                            {
                                name: 'offset',
                                options: {
                                    offset: [0, -8], // Ajuste a margem conforme necessário
                                },
                            },
                        ],
                    }}>
                    <IconButton
                        color="primary"
                        component="label"
                        sx={{
                            padding: '6px',
                            backgroundColor: isAcceptable ? 'primary.main' : 'grey.500',
                            '&:hover': {
                                backgroundColor: isAcceptable ? 'primary.dark' : 'grey.500',
                            },
                            cursor: isAcceptable ? 'pointer' : 'not-allowed',
                            color: 'white',
                        }}
                        disabled={!isAcceptable}
                    >
                        <DriveFolderUpload fontSize="small" />
                        <input type="file" webkitdirectory="true" mozdirectory="true" hidden multiple onChange={handleDirectoryUpload} />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Upload Zip" placement="top">
                    <IconButton
                        color="primary"
                        component="label"
                        sx={{
                            padding: '6px',
                            backgroundColor: isAcceptable ? 'primary.main' : 'grey.500',
                            '&:hover': { backgroundColor: isAcceptable ? 'primary.dark' : 'grey.500' },
                            cursor: isAcceptable ? 'pointer' : 'not-allowed',
                            color: 'white',
                        }}
                        disabled={!isAcceptable}
                    >
                        {/* You can use a zip icon if you have one, or fallback to FileUpload */}
                        <FolderZip fontSize="small" />
                        <input
                            type="file"
                            hidden
                            accept=".zip"
                            onChange={handleZipUpload}
                        />
                    </IconButton>
                </Tooltip>
            </Box>

            <Dialog open={isRenaming} onClose={() => setIsRenaming(false)}>
                <DialogTitle>Rename {activeNode?.type}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="New Name"
                        type="text"
                        fullWidth
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsRenaming(false)}>Cancel</Button>
                    <Button onClick={handleRenameSubmit}>Rename</Button>
                </DialogActions>
            </Dialog>

            {/* <Dialog open={isCreating} onClose={() => setIsCreating(false)}>
                <DialogTitle>Create New {newItemType}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={`${newItemType} Name`}
                        type="text"
                        fullWidth
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsCreating(false)}>Cancel</Button>
                    <Button onClick={handleCreateSubmit}>Create</Button>
                </DialogActions>
            </Dialog> */}

            <Dialog open={showFileInfo} onClose={() => setShowFileInfo(false)}>
                <DialogTitle>File Information</DialogTitle>
                <DialogContent>
                    <Typography><strong>Name:</strong> {activeNode?.name}</Typography>
                    <Typography><strong>Type:</strong> {activeNode?.type}</Typography>
                    {activeNode?.size && <Typography><strong>Size:</strong> {activeNode.size} bytes</Typography>}
                    {activeNode?.lastModified && <Typography><strong>Modified:</strong> {activeNode.lastModified.toLocaleString()}</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowFileInfo(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Metadata Dialog */}
            <Dialog open={openMetadataDialog} onClose={handleCloseMetadataDialog} fullWidth maxWidth="sm">
                <DialogTitle sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText'
                }}>
                    <Info /> File Information
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {activeNode ? (
                        <Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                                    <Typography variant="body1" gutterBottom>{activeNode.name}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                                    <Typography variant="body1" gutterBottom>{activeNode.fileType}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Size</Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {(activeNode.size / 1024).toFixed(2)} KB
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            {activeNode.type === 'file' && activeNode.content && (
                                <>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                        Preview
                                    </Typography>
                                    <Paper
                                        elevation={3}
                                        sx={{
                                            p: 2,
                                            bgcolor: 'grey.100',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            '&:hover': {
                                                boxShadow: 6,
                                            },
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontFamily: 'monospace',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-all'
                                            }}
                                        >
                                            {activeNode.content.slice(0, 300)}
                                            {activeNode.content.length > 300 ? '...' : ''}
                                        </Typography>
                                    </Paper>
                                </>
                            )}
                        </Box>
                    ) : (
                        <Typography>Loading...</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseMetadataDialog}
                        color="primary"
                        variant="contained"
                        startIcon={<Close />}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper >
    );
};

export default FileExplorer;