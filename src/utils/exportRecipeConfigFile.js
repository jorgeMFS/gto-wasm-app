export const exportRecipeConfigFile = (workflow, inputData, inputDataType, exportFileName, showNotification, setOpenExportDialog, partialExportIndex = null) => {
    if (workflow.length === 0) {
        showNotification('Cannot export an empty workflow.', 'error');
        return;
    }

    const exportWorkflow = partialExportIndex !== null
        ? workflow.slice(0, partialExportIndex + 1)
        : workflow;

    // Generation of the configuration file
    const recipe = {
        name: exportFileName,
        created_at: new Date().toISOString(),
        workflow: {
            input: {
                format: inputDataType,
                data: inputData,
            },
            tools: exportWorkflow.map((tool) => ({ ...tool })),
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