/**
 * Detects the data type based on file name or content.
 * @param {string} fileName - Name of the file.
 * @param {string} content - Content of the file.
 * @returns {string} - Detected data type (e.g., 'FASTA', 'FASTQ', 'UNKNOWN').
 */
export const detectDataType = (fileName, content) => {
  // Trim content to remove leading/trailing whitespace
  const trimmedContent = content.trim();

  // Check file extension
  const extension = fileName.split('.').pop().toLowerCase();

  // Define mapping of extensions to possible data types
  const extensionToTypeMap = {
    fasta: ['FASTA', 'Multi-FASTA'],
    fa: ['FASTA', 'Multi-FASTA'],
    fastq: ['FASTQ'],
    fq: ['FASTQ'],
    pos: ['POS'],
    svg: ['SVG'],
    txt: ['text'],
    num: ['NUM'],
    // Add more mappings if necessary
  };

  // Check based on file extension
  if (extensionToTypeMap[extension]) {
    for (const type of extensionToTypeMap[extension]) {
      switch (type) {
        case 'FASTA':
          if (trimmedContent.startsWith('>') && /[ACGTacgt]+\n/.test(trimmedContent)) {
            return 'FASTA';
          }
          break;
        case 'Multi-FASTA':
          if (trimmedContent.startsWith('>') && />\w+/.test(trimmedContent)) {
            return 'Multi-FASTA';
          }
          break;
        case 'FASTQ':
          const lines = trimmedContent.split('\n');
          if (
            lines.length >= 4 &&
            lines.length % 4 === 0 &&
            lines[0].startsWith('@') &&
            lines[2].startsWith('+') &&
            /^[ACGTacgt]+$/.test(lines[1]) &&
            /^[!-~]+$/.test(lines[3])
          ) {
            return 'FASTQ';
          }
          break;
        case 'POS':
          if (/^\d+(\.\d+)?\s+\d+(\.\d+)?$/.test(trimmedContent)) {
            return 'POS';
          }
          break;
        case 'SVG':
          if (trimmedContent.startsWith('<svg') || trimmedContent.includes('<svg ')) {
            return 'SVG';
          }
          break;
        case 'NUM':
          if (/^\d+(\.\d+)?(\s+\d+(\.\d+)?)*/.test(trimmedContent)) {
            return 'NUM';
          }
          break;
        case 'text':
          // For text, we'll assume any non-empty string is valid
          return 'text';
        default:
          break;
      }
    }
  }

  // Fallback: Inspect content without relying on file extension
  if (trimmedContent.startsWith('>')) {
    const lines = trimmedContent.split('\n');
    return lines.length > 1 && /^[ACGTacgt]+$/.test(lines[1]) ? 'FASTA' : 'UNKNOWN';
  }
  if (trimmedContent.startsWith('@')) {
    const lines = trimmedContent.split('\n');
    return (
      lines.length >= 4 &&
      lines.length % 4 === 0 &&
      lines[2].startsWith('+') &&
      /^[ACGTacgt]+$/.test(lines[1]) &&
      /^[!-~]+$/.test(lines[3])
    )
      ? 'FASTQ'
      : 'UNKNOWN';
  }
  if (trimmedContent.startsWith('<svg')) {
    return 'SVG';
  }
  if (/^\d+(\.\d+)?(\s+\d+(\.\d+)?)*/.test(trimmedContent)) {
    return 'NUM';
  }

  return 'UNKNOWN';
};