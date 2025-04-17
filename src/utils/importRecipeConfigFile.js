export const importRecipeConfigFile = (
    file,
    setWorkflow,
    setInputData,
    setInputDataType,
    showNotification,
    setOpenImportDialog
) => {
    const reader = new FileReader();

    // Handle the file reading
    reader.onload = (event) => {
        try {
            // Parse the configuration file
            const config = JSON.parse(event.target.result);

            // Validate the configuration file format
            if (!config.workflow || !config.workflow.input || !config.workflow.tools) {
                throw new Error('Invalid configuration file format.');
            }

            // Updates the workflow, input data, and input data type states
            setWorkflow(config.workflow.tools);
            setInputData(config.workflow.input.data);
            setInputDataType(config.workflow.input.format);

            showNotification('Workflow imported successfully!', 'success');
            setOpenImportDialog(false); // Close the import dialog
        } catch (error) {
            console.error('Error importing workflow:', error);
            showNotification(
                `Failed to import workflow: ${error.message}`,
                'error'
            );
        }
    };

    // Handle file reading errors
    reader.onerror = (error) => {
        console.error('File reading error:', error);
        showNotification('Failed to read the file.', 'error');
    };

    // Start reading the file
    reader.readAsText(file);
};
