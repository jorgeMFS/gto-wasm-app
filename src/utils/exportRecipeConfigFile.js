export const exportRecipeConfigFile = (workflow, inputData, inputDataType, exportFileName, showNotification, setOpenExportDialog) => {
    if (workflow.length === 0) {
        showNotification('Cannot export an empty workflow.', 'error');
        return;
    }

    // Generation of the configuration file
    const recipe = {
        name: exportFileName,
        created_at: new Date().toISOString(),
        workflow: {
            input: {
                format: inputDataType,
                data: inputData,
            },
            tools: workflow.map((tool) => ({ ...tool })),
        },
    };

    const fileContent = JSON.stringify(recipe, null, 2);

    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFileName}.json`;
    a.click();

    URL.revokeObjectURL(url);
    setOpenExportDialog(false);
}