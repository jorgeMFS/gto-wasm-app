import React, { useState, useMemo } from 'react';
import { 
  List, 
  ListItemText, 
  ListSubheader, 
  TextField, 
  Divider, 
  Typography,
  Box,
  Tooltip
} from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import debounce from 'lodash.debounce';

// Define categories and map operations to them
const operationCategories = {
  "Sequence Manipulation": [
    { name: 'fasta_extract', description: 'Extracts sequences from a FASTA file' },
    { name: 'fasta_reverse', description: 'Reverses the order of a FASTA or Multi-FASTA file format' },
    { name: 'fasta_complement', description: 'Replaces the ACGT bases with their complements in FASTA or Multi-FASTA file format' },
    { name: 'fasta_mutate', description: 'Creates a synthetic mutation of a FASTA file' },
    { name: 'fasta_rand_extra_chars', description: 'Substitutes in the DNA sequence the outside ACGT chars by random ACGT symbols' },
    { name: 'fasta_extract_by_read', description: 'Extracts sequences from each read in a Multi-FASTA file' },
    { name: 'fasta_extract_read_by_pattern', description: 'Extracts reads from a Multi-FASTA file format given a pattern in the header' },
    { name: 'fasta_extract_pattern_coords', description: 'Extracts the header and coordinates from a Multi-FASTA file format given a pattern/motif in the sequence' },
    { name: 'fasta_split_reads', description: 'Splits a Multi-FASTA file to multiple FASTA files' },
    { name: 'fasta_split_streams', description: 'Splits and writes a FASTA file into three channels of information: headers, extra and DNA' },
    { name: 'fasta_merge_streams', description: 'Merges the three channels of information (headers, extra and DNA) and writes it into a FASTA file' },
    { name: 'fastq_exclude_n', description: 'Discards the FASTQ reads with the minimum number of \'N\' symbols' },
    { name: 'fastq_extract_quality_scores', description: 'Extracts all the quality-scores from FASTQ reads' },
    { name: 'fastq_minimum_quality_score', description: 'Discards reads with average quality-score below of the defined' },
    { name: 'fastq_minimum_read_size', description: 'Filters the FASTQ reads with the length smaller than the value defined' },
    { name: 'fastq_maximum_read_size', description: 'Filters the FASTQ reads with the length higher than the value defined' },
    { name: 'fastq_minimum_local_quality_score_forward', description: 'Filters the reads considering the quality score average of a defined window size of bases' },
    { name: 'fastq_minimum_local_quality_score_reverse', description: 'Filters the reverse reads, considering the quality score average of a defined window size of bases' },
    { name: 'fastq_rand_extra_chars', description: 'Substitutes in the FASTQ files, the DNA sequence the outside ACGT chars by random ACGT symbols' },
    { name: 'fastq_cut', description: 'Cuts read sequences in a FASTQ file' },
    { name: 'fastq_pack', description: 'Packages each FASTQ read in a single line' },
    { name: 'fastq_unpack', description: 'Unpacks the FASTQ reads packaged using the gto_fastq_pack tool' },
    { name: 'fastq_quality_score_info', description: 'Analyses the quality-scores of a FASTQ file' },
    { name: 'fastq_quality_score_min', description: 'Analyses the minimal quality-scores of a FASTQ file' },
    { name: 'fastq_quality_score_max', description: 'Analyses the maximal quality-scores of a FASTQ file' },
    { name: 'fastq_complement', description: 'Replaces the ACGT bases with their complements in a FASTQ file format' },
    { name: 'fastq_reverse', description: 'Reverses the ACGT bases order for each read in a FASTQ file format' },
    { name: 'fastq_split', description: 'Splits Paired End files according to the direction of the strand' },
    { name: 'fastq_mutate', description: 'Creates a synthetic mutation of a FASTQ file' },
  ],
  "Format Conversion": [
    { name: 'fasta_from_seq', description: 'Converts a genomic sequence to pseudo FASTA file format' },
    { name: 'fasta_to_seq', description: 'Converts a FASTA or Multi-FASTA file format to a seq' },
    { name: 'fastq_to_fasta', description: 'Converts a FASTQ file format to a pseudo FASTA file' },
    { name: 'fastq_to_mfasta', description: 'Converts a FASTQ file format to a pseudo Multi-FASTA file' },
    { name: 'fastq_from_seq', description: 'Converts a genomic sequence to pseudo FASTQ file format' },
    { name: 'amino_acid_from_fasta', description: 'Converts DNA sequences in FASTA or Multi-FASTA file format to an amino acid sequence' },
    { name: 'amino_acid_from_fastq', description: 'Converts DNA sequences in the FASTQ file format to an amino acid sequence' },
    { name: 'amino_acid_from_seq', description: 'Converts DNA sequence to an amino acid sequence' },
    { name: 'amino_acid_to_seq', description: 'Converts amino acid sequences to DNA sequences' },
  ],
  "Genomic Operations": [
    { name: 'genomic_complement', description: 'Replaces the ACGT bases with their complements in a DNA sequence' },
    { name: 'genomic_reverse', description: 'Reverses the ACGT bases order for each read in a sequence file' },
    { name: 'genomic_extract', description: 'Extracts sequences from a sequence file' },
    { name: 'genomic_gen_random_dna', description: 'Generates a synthetic DNA' },
    { name: 'genomic_rand_seq_extra_chars', description: 'Substitutes in the DNA sequence the outside ACGT chars by random ACGT symbols' },
    { name: 'genomic_period', description: 'Calculates the best order depth of a sequence, using FCMs' },
    { name: 'genomic_count_bases', description: 'Counts the number of bases in sequence, FASTA or FASTQ files' },
    { name: 'genomic_dna_mutate', description: 'Creates a synthetic mutation of a sequence file' },
  ],
  "Amino Acid Operations": [
    { name: 'amino_acid_to_group', description: 'Converts an amino acid sequence to a group sequence' },
    { name: 'amino_acid_to_pseudo_dna', description: 'Converts an amino acid (protein) sequence to a pseudo DNA sequence' },
  ],
  "Information and Analysis": [
    { name: 'fasta_info', description: 'Shows the readed information of a FASTA or Multi-FASTA file format' },
    { name: 'fastq_info', description: 'Analyses the basic information of FASTQ file format' },
    { name: 'info', description: 'Gives the basic properties of the file' },
    { name: 'fasta_find_n_pos', description: 'Reports the \'N\' regions in a sequence or FASTA (seq) file' },
    { name: 'comparative_map', description: 'Creates a visualization for comparative maps' },
  ],
  "Mathematical Operations": [
    { name: 'lower_bound', description: 'Sets an lower bound in a file with a value per line' },
    { name: 'upper_bound', description: 'Sets an upper bound in a file with a value per line' },
    { name: 'max', description: 'Computes the maximum value in each row between two files' },
    { name: 'min', description: 'Computes the minium value in each row between two files' },
    { name: 'sum', description: 'Adds decimal values in file, line by line, splitted by spaces or tabs' },
    { name: 'permute_by_blocks', description: 'Permutates by block sequence, FASTA and Multi-FASTA files' },
    { name: 'real_to_binary_with_threshold', description: 'Converts a sequence of real numbers into a binary sequence, given a threshold' },
  ],
  "Text Processing": [
    { name: 'char_to_line', description: 'Splits a sequence into lines, creating an output sequence which has a char for each line' },
    { name: 'new_line_on_new_x', description: 'Splits different rows with a new empty row' },
    { name: 'filter', description: 'Filters numerical sequences using a low-pass filter' },
    { name: 'reverse', description: 'Reverses the ACGT bases order for each read in a sequence file' },
    { name: 'segment', description: 'Segments a filtered sequence based on a threshold' },
    { name: 'word_search', description: 'Search for a word in a file' },
    { name: 'brute_force_string', description: 'Generates all combinations, line by line, for an inputted alphabet and specific size' },
  ]
};

// At the beginning of the file, after imports
console.log('Operation categories:', operationCategories);

const OperationsPanel = ({ onAddOperation }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search handler
  const handleSearch = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
    []
  );

  const onChange = (e) => {
    handleSearch(e.target.value);
  };

  // Filter operations based on search term
  const filterOperations = (operations) => {
    return operations.filter((op) =>
      op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Inside the OperationsPanel component, before the return statement
  console.log('Rendered operations:', Object.keys(operationCategories).flatMap(category => operationCategories[category]));

  return (
    <Box>
      <Typography variant="h6" align="center" gutterBottom>
        Operations
      </Typography>
      <TextField
        label="Search Operations"
        variant="outlined"
        size="small"
        fullWidth
        onChange={onChange}
        style={{ margin: '10px 0' }}
      />
      <List>
        {Object.keys(operationCategories).map((category) => {
          const filteredOps = filterOperations(operationCategories[category]);
          if (filteredOps.length === 0) return null;

          return (
            <React.Fragment key={category}>
              <ListSubheader>{category}</ListSubheader>
              {filteredOps.map((operation) => (
                <Tooltip key={operation.name} title={operation.description} placement="right">
                  <ListItemButton
                    onClick={() => {
                      console.log(`Adding operation: ${operation.name}`);
                      onAddOperation(operation.name);
                    }}
                  >
                    <ListItemText primary={operation.name} />
                  </ListItemButton>
                </Tooltip>
              ))}
              <Divider />
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
};

export default OperationsPanel;