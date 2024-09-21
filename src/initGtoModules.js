import { loadWasmModule } from './gtoWasm';

/**
 * Initializes and loads all GTO WASM modules.
 * @returns {Promise<Object>} - An object containing all loaded GTO modules.
 */
export async function initializeAllModules() {
  const modules = {};

  // List of all GTO module names
  const moduleNames = [
    'amino_acid_from_fasta',
    'amino_acid_from_fastq',
    'amino_acid_from_seq',
    'amino_acid_to_group',
    'amino_acid_to_pseudo_dna',
    'amino_acid_to_seq',
    'brute_force_string',
    'char_to_line',
    'comparative_map',
    'fasta_complement',
    'fasta_extract_by_read',
    'fasta_extract_pattern_coords',
    'fasta_extract_read_by_pattern',
    'fasta_extract',
    'fasta_filter_extra_char_seqs',
    'fasta_find_n_pos',
    'fasta_from_seq',
    'fasta_get_unique',
    'fasta_info',
    'fasta_merge_streams',
    'fasta_mutate',
    'fasta_rand_extra_chars',
    'fasta_rename_human_headers',
    'fasta_reverse',
    'fasta_split_reads',
    'fasta_split_streams',
    'fasta_to_seq',
    'fastq_complement',
    'fastq_cut',
    'fastq_exclude_n',
    'fastq_extract_quality_scores',
    'fastq_from_seq',
    'fastq_info',
    'fastq_maximum_read_size',
    'fastq_minimum_local_quality_score_forward',
    'fastq_minimum_local_quality_score_reverse',
    'fastq_minimum_quality_score_reverse',
    'fastq_minimum_quality_score',
    'fastq_minimum_read_size',
    'fastq_mutate',
    'fastq_pack',
    'fastq_quality_score_info',
    'fastq_quality_score_max',
    'fastq_quality_score_min',
    'fastq_rand_extra_chars',
    'fastq_reverse',
    'fastq_split',
    'fastq_to_fasta',
    'fastq_to_mfasta',
    'fastq_unpack',
    'filter',
    'genomic_complement',
    'genomic_count_bases',
    'genomic_dna_mutate',
    'genomic_extract',
    'genomic_gen_random_dna',
    'genomic_period',
    'genomic_rand_seq_extra_chars',
    'genomic_reverse',
    'info',
    'lower_bound',
    'max',
    'min',
    'new_line_on_new_x',
    'permute_by_blocks',
    'real_to_binary_with_threshold',
    'reverse',
    'segment',
    'sum',
    'upper_bound',
    'word_search'
  ];

  console.log('Found module names:', moduleNames);

  for (const name of moduleNames) {
    console.log(`Attempting to load module: ${name}`);
    try {
      const moduleInstance = await loadWasmModule(name);
      modules[name] = moduleInstance;
      console.log(`Loaded module: ${name}`);
    } catch (error) {
      console.error(`Error initializing module ${name}:`, error);
    }
  }

  console.log(`Loaded ${Object.keys(modules).length} GTO modules`, modules);
  return modules;
}