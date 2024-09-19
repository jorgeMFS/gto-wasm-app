import React, { useState, useMemo } from 'react';
import { 
  List, 
  ListItemText, 
  ListSubheader, 
  TextField, 
  Divider, 
  Typography,
  Box
} from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import debounce from 'lodash.debounce';

// Define categories and map operations to them
const operationCategories = {
  "Sequence Manipulation": [
    'fasta_extract',
    'fasta_reverse',
    'fasta_complement',
    'fasta_mutate',
    'fasta_rand_extra_chars',
    'fasta_extract_by_read',
    'fasta_extract_read_by_pattern',
    'fasta_extract_pattern_coords',
    'fasta_filter_extra_char_seqs',
    'fasta_get_unique',
    'fasta_rename_human_headers',
    'fasta_split_reads',
    'fasta_split_streams',
    'fasta_merge_streams',
    'fastq_exclude_n',
    'fastq_extract_quality_scores',
    'fastq_minimum_quality_score',
    'fastq_minimum_read_size',
    'fastq_maximum_read_size',
    'fastq_minimum_local_quality_score_forward',
    'fastq_minimum_local_quality_score_reverse',
    'fastq_rand_extra_chars',
    'fastq_cut',
    'fastq_pack',
    'fastq_unpack',
    'fastq_quality_score_info',
    'fastq_quality_score_min',
    'fastq_quality_score_max',
    'fastq_complement',
    'fastq_reverse',
    'fastq_split',
    'fastq_mutate',
  ],
  "Format Conversion": [
    'fasta_from_seq',
    'fasta_to_seq',
    'fastq_to_fasta',
    'fastq_to_mfasta',
    'fastq_from_seq',
    'amino_acid_from_fasta',
    'amino_acid_from_fastq',
    'amino_acid_from_seq',
  ],
  "Genomic Operations": [
    'genomic_complement',
    'genomic_reverse',
    'genomic_extract',
    'genomic_gen_random_dna',
    'genomic_rand_seq_extra_chars',
    'genomic_period',
    'genomic_count_bases',
    'genomic_dna_mutate',
  ],
  "Amino Acid Operations": [
    'amino_acid_to_group',
    'amino_acid_to_pseudo_dna',
  ],
  "Information and Analysis": [
    'fasta_info',
    'fastq_info',
    'info',
    'fasta_find_n_pos',
    'comparative_map',
  ],
  "Mathematical Operations": [
    'lower_bound',
    'upper_bound',
    'max',
    'min',
    'sum',
    'permute_by_blocks',
    'real_to_binary_with_threshold',
  ],
  "Text Processing": [
    'char_to_line',
    'new_line_on_new_x',
    'filter',
    'reverse',
    'segment',
    'word_search',
    'brute_force_string',
  ]
};

// Merge all operations into a single array for search functionality
const allOperations = Object.values(operationCategories).flat();

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
      op.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

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
                <ListItemButton
                  key={operation}
                  onClick={() => onAddOperation(operation)}
                >
                  <ListItemText primary={operation} />
                </ListItemButton>
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