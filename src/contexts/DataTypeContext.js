import React, { createContext, useState } from 'react';

export const DataTypeContext = createContext();

/**
 * Provides the current data type and a function to update it.
 */
export const DataTypeProvider = ({ children }) => {
  const [dataType, setDataType] = useState('UNKNOWN');

  /**
   * Validates the data based on the detected data type.
   * @param {string} data - The data to validate.
   * @returns {boolean} - True if data is valid for the detected type, else false.
   */
  const validateData = (data) => {
    if (dataType === 'FASTA') {
      // Basic validation for FASTA: starts with '>' and contains at least one sequence line
      return data.startsWith('>') && /\n[ACGTacgt]+/.test(data);
    } else if (dataType === 'Multi-FASTA') {
      // Validation for Multi-FASTA: contains multiple headers starting with '>'
      const headers = data.match(/>[^>\n]+/g);
      return headers && headers.length > 1 && /[ACGTacgt]+/.test(data);
    } else if (dataType === 'FASTQ') {
      // Basic validation for FASTQ: starts with '@' and follows FASTQ format structure
      const lines = data.split('\n');
      return (
        data.startsWith('@') &&
        lines.length % 4 === 0 &&
        lines.every((line, index) => {
          if (index % 4 === 0) return line.startsWith('@');
          if (index % 4 === 2) return line.startsWith('+');
          // Lines 1 and 3 should contain sequence and quality scores respectively
          return /^[ACGTacgt]+$/.test(line) || /^[!-~]+$/.test(line);
        })
      );
    } else if (dataType === 'POS') {
      // Validation for POS: lines containing numeric position data
      const lines = data.split('\n');
      return lines.every(line => /^\d+(\.\d+)?\s+\d+(\.\d+)?$/.test(line));
    } else if (dataType === 'SVG') {
      // Validation for SVG: starts with '<svg' tag
      return data.trim().startsWith('<svg');
    } else if (dataType === 'NUM') {
      // Validation for NUM: all content is numeric, possibly separated by whitespace
      return /^\d+(\.\d+)?(\s+\d+(\.\d+)?)*/.test(data.trim());
    } else if (dataType === 'text') {
      // For text, we'll assume any non-empty string is valid
      return data.trim().length > 0;
    }
    // Add more validations for other data types if necessary
    return true; // Default to true for UNKNOWN or unhandled types
  };

  return (
    <DataTypeContext.Provider value={{ dataType, setDataType, validateData }}>
      {children}
    </DataTypeContext.Provider>
  );
};