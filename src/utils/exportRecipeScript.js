import description from '../../description.json';

const TypeToExtensionMap = {
    'Multi-FASTA': 'fa',
    'FASTA': 'fa',
    'FASTQ': 'fq',
    'POS': 'pos',
    'SVG': 'svg',
    'NUM': 'num',
    'DNA': 'txt',
    'RNA': 'txt',
    'AminoAcids': 'txt',
    'text': 'txt',
};

export const exportRecipeScript = (workflow, inputData, inputDataType, outputTypesMap, exportFileName, showNotification, setOpenExportDialog, returnCommand = false) => {
    if (workflow.length === 0) {
        showNotification('Cannot export an empty workflow.', 'error');
        return;
    }

    // Generation of the command line
    const inputFile = `input.${TypeToExtensionMap[inputDataType] || 'txt'}`;
    const outputFile = `output.${TypeToExtensionMap[outputTypesMap[workflow[workflow.length - 1]?.id] || 'text'] || 'txt'}`;

    const commands = workflow.map((tool, index) => {
        const toolConfig = description.tools.find((t) => `gto_${tool.toolName}` === t.name);
        if (!toolConfig) return '';

        const flags = toolConfig.flags
            .map((flag) => {
                const flagValue = tool.params[flag.parameter];
                return flagValue ? `${flag.flag} ${flagValue}` : flag.flag && tool.params[flag.flag] ? flag.flag : null;
            })
            .filter(Boolean)
            .join(' ');

        const toolCommand = `./gto_${tool.toolName} ${flags}`;
        return index === 0 ? `${toolCommand} < ${inputFile}` : `${toolCommand}`;
    });

    const fullCommand = `${commands.join(' || ')} > ${outputFile}`;

    // If returning the one-line command for "Copy Command" functionality
    if (returnCommand) {
        return fullCommand;
    }

    // Generation of the script
    const scriptLines = ['#!/bin/bash\n\n# Auto-generated Workflow Script'];

    // Step 1: Find or Clone GTO Repository
    scriptLines.push('echo "Searching for the GTO binary directory..."');
    scriptLines.push('GTO_BIN_DIR=$(find / -type d -name "bin" 2>/dev/null | grep "/gto/bin" | head -n 1)');
    scriptLines.push('if [ -z "$GTO_BIN_DIR" ]; then');
    scriptLines.push('  echo "GTO binary directory not found. Cloning GTO repository..."');
    scriptLines.push('  git clone git@github.com:cobilab/gto.git ~/gto || { echo "Failed to clone GTO repository. Exiting."; exit 1; }');
    scriptLines.push('  GTO_BIN_DIR=$(find ~/gto -type d -name "bin" 2>/dev/null | head -n 1)');
    scriptLines.push('fi');
    scriptLines.push('if [ -z "$GTO_BIN_DIR" ]; then');
    scriptLines.push('  echo "Error: GTO binary directory not found even after cloning. Exiting."; exit 1;');
    scriptLines.push('fi');
    scriptLines.push('echo "GTO binary directory found: $GTO_BIN_DIR"\n');

    // Step 2: Display Workflow Summary
    scriptLines.push('echo -e "\\nWorkflow to be executed:"');

    const workflowSummary = workflow
        .map((tool, index) => {
            const toolConfig = description.tools.find((t) => `gto_${tool.toolName}` === t.name);
            if (!toolConfig) return '';
            const flags = toolConfig.flags
                .map((flag) => {
                    const flagValue = tool.params[flag.parameter];
                    return flagValue ? `${flag.flag} ${flagValue}` : flag.flag && tool.params[flag.flag] ? flag.flag : null;
                })
                .filter(Boolean)
                .join(' ');

            const inputRedirection = index === 0 ? '<input_file>' : '';
            return `gto_${tool.toolName} ${flags} ${inputRedirection}`;
        })
        .join(' | '); // Use '|' to pipe the commands

    scriptLines.push(`echo "${workflowSummary}"`);
    scriptLines.push('while true; do');
    scriptLines.push('  echo -n "Do you wish to execute this workflow? (y/n) "');
    scriptLines.push('  read confirm');
    scriptLines.push('  case $confirm in');
    scriptLines.push('    [Yy]* ) break;;');
    scriptLines.push('    [Nn]* ) echo "Exiting..."; exit 0;;');
    scriptLines.push('    * ) echo "Please answer y or n.";;');
    scriptLines.push('  esac');
    scriptLines.push('done\n');

    // Step 3: Request Input File
    const defaultInputFile = `input.${TypeToExtensionMap[inputDataType] || 'txt'}`;
    scriptLines.push(`defaultInputFile="${defaultInputFile}"`);
    scriptLines.push(`echo -e "${inputData.replace(/\n/g, '\\n')}" > "$defaultInputFile"`);
    scriptLines.push('echo -e "\\nDefault input file:"');
    scriptLines.push('file_size=$(wc -c < "$defaultInputFile")');
    scriptLines.push('if [ "$file_size" -gt 300 ]; then');
    scriptLines.push('  head -c 100 "$defaultInputFile"; echo "..."');
    scriptLines.push('else');
    scriptLines.push('  cat "$defaultInputFile"');
    scriptLines.push('fi');

    // Request user input for input file
    scriptLines.push('while true; do');
    scriptLines.push('  echo -n "Do you wish to change the input file? (y/n) "');
    scriptLines.push('  read changeInput');
    scriptLines.push('  case $changeInput in');
    scriptLines.push('    [Yy]* ) break;;');
    scriptLines.push('    [Nn]* ) echo "Using default input file..."; break;;');
    scriptLines.push('    * ) echo "Please answer y or n.";;');
    scriptLines.push('  esac');
    scriptLines.push('done');

    scriptLines.push('if [ "$changeInput" = "y" ]; then');
    scriptLines.push('  echo "Please provide an input file (press Enter to use the default):"');
    scriptLines.push('  read userInputFile');
    scriptLines.push('  if [ -z "$userInputFile" ]; then');
    scriptLines.push('    echo "Using default input file."');
    scriptLines.push('    inputFile="$defaultInputFile"');
    scriptLines.push('  else');
    scriptLines.push('    if [ ! -f "$userInputFile" ]; then');
    scriptLines.push('      echo "Provided file does not exist. Exiting."');
    scriptLines.push('      exit 1');
    scriptLines.push('    fi');
    scriptLines.push('    inputFile="$userInputFile"');
    scriptLines.push('  fi');
    scriptLines.push('else');
    scriptLines.push('  inputFile="$defaultInputFile"');
    scriptLines.push('fi');

    // Step 4: Workflow Execution
    scriptLines.push('echo -e "\\nExecuting the workflow..."');
    scriptLines.push('previousOutput="$inputFile"'); // Initial input
    workflow.forEach((tool, index) => {
        const toolConfig = description.tools.find((t) => `gto_${tool.toolName}` === t.name);

        if (!toolConfig) {
            console.error(`Tool configuration for ${tool.toolName} not found.`);
            return;
        }

        const outputType = outputTypesMap[tool.id] || 'text';
        const outputExtension = TypeToExtensionMap[outputType] || 'txt';
        const outputFile = `output_tool_${index + 1}.${outputExtension}`;

        const toolCommand = `$GTO_BIN_DIR/gto_${tool.toolName}`;
        const flags = toolConfig.flags
            .map((flag) => {
                const flagValue = tool.params[flag.parameter];
                return flagValue ? `${flag.flag} ${flagValue}` : flag.flag && tool.params[flag.flag] ? flag.flag : null;
            })
            .filter(Boolean)
            .join(' ');

        scriptLines.push(`# Step ${index + 1}: ${tool.toolName}`);
        if (flags) {
            scriptLines.push(`echo -e "\\nRunning ${tool.toolName} with flags: ${flags}"`);
        } else {
            scriptLines.push(`echo -e "\\nRunning ${tool.toolName} with no flags"`);
        }
        scriptLines.push(`${toolCommand} ${flags} < "$previousOutput" > "${outputFile}"`);
        scriptLines.push(`echo -e "Output of ${tool.toolName}:"`);
        scriptLines.push(`cat "${outputFile}"`);
        scriptLines.push(`echo -e ""`);
        scriptLines.push(`previousOutput="${outputFile}"`); // Update for the next tool
    });

    scriptLines.push('echo -e "\\nWorkflow execution completed.\\n"');

    // Step 5: Cleanup
    workflow.forEach((_, index) => {
        const outputType = outputTypesMap[workflow[index].id] || 'text';
        const outputExtension = TypeToExtensionMap[outputType] || 'txt';
        scriptLines.push(`rm "output_tool_${index + 1}.${outputExtension}"`);
    });
    scriptLines.push('rm "$defaultInputFile"');

    // Step 6: Create and Download the Script
    const blob = new Blob([scriptLines.join('\n')], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFileName}.sh` || 'workflow_script.sh';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Workflow exported successfully!', 'success');
    setOpenExportDialog(false);
};