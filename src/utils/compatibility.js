import description from '../../description.json';

/**
 * Determines which tools are compatible with the current input format.
 * @param {string} currentFormat - The format of the current input data (e.g., "FASTQ").
 * @returns {Array} - An array of tool objects that are compatible.
 */
export const getCompatibleTools = (currentFormat, isWorkflowEmpty) => {
  return description.tools.filter(tool => {
    const isToolInputEmpty = tool.input.format === '';
    return (isToolInputEmpty && isWorkflowEmpty) || tool.input.format.includes(currentFormat);
  });
};