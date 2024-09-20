import { loadWasmModule } from './gtoWasm';

/**
 * Initializes and loads all GTO WASM modules.
 * @returns {Promise<Object>} - An object containing all loaded GTO modules.
 */
export async function initializeAllModules() {
  const modules = {};

  // List of all GTO module names
  const moduleNames = [
    'fastq_exclude_n',
    'fastq_minimum_local_quality_score_reverse',
    'fastq_rand_extra_chars',
    'lower_bound',
    'fasta_extract_read_by_pattern',
    'fastq_unpack',
    'fasta_extract_pattern_coords',
    'fastq_quality_score_min',
    'fastq_to_fasta',
    'fasta_find_n_pos',
    'info',
    'fasta_rand_extra_chars',
    'fastq_extract_quality_scores',
    'fastq_quality_score_max',
    'fastq_maximum_read_size',
    'fastq_info',
    'upper_bound',
    'amino_acid_from_fasta',
    'fastq_to_mfasta',
    'fastq_minimum_local_quality_score_forward',
    'fasta_complement',
    'max',
    'fasta_merge_streams',
    'fasta_from_seq',
    'fasta_info',
    'fasta_reverse',
    'genomic_gen_random_dna',
    'amino_acid_from_seq',
    'amino_acid_from_fastq',
    'genomic_extract',
    'filter',
    'fastq_mutate',
    'fastq_split',
    'segment',
    'fasta_split_reads',
    'genomic_reverse',
    'fasta_to_seq',
    'fastq_minimum_read_size',
    'amino_acid_to_pseudo_dna',
    'genomic_dna_mutate',
    'fastq_reverse',
    'brute_force_string',
    'reverse',
    'char_to_line',
    'fasta_rename_human_headers',
    'min',
    'fastq_complement',
    'fasta_split_streams',
    'genomic_count_bases',
    'fastq_quality_score_info',
    'new_line_on_new_x',
    'genomic_complement',
    'fasta_filter_extra_char_seqs',
    'fastq_from_seq',
    'fasta_get_unique',
    'genomic_period',
    'fasta_mutate',
    'fastq_pack',
    'permute_by_blocks',
    'sum',
    'fasta_extract_by_read',
    'fasta_extract',
    'amino_acid_to_group',
    'fastq_minimum_quality_score',
    'genomic_rand_seq_extra_chars',
    'word_search',
    'fastq_cut',
    'real_to_binary_with_threshold',
    'comparative_map',
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