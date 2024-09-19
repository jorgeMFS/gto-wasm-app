export async function loadWasmModule(moduleName) {
  try {
    const { default: createModule } = await import(
      /* webpackIgnore: true */ `/wasm/gto_${moduleName}.js`
    );

    const Module = await createModule({
      locateFile: (file) => `/wasm/${file}`,
      env: {
        emscripten_notify_memory_growth: () => {},
      },
    });

    // Define a 'process' function for consistency
    Module.process = (inputData) => {
      // Assuming the WASM module has a 'main' function that processes input
      // You'll need to adjust this based on your actual WASM export functions

      // Allocate memory for input
      const inputBytes = new TextEncoder().encode(inputData);
      const inputPtr = Module._malloc(inputBytes.length);
      Module.HEAPU8.set(inputBytes, inputPtr);

      // Call the WASM module's main function or equivalent
      Module._process(inputPtr, inputBytes.length);

      // Retrieve the output from WASM memory
      const outputPtr = Module._getOutput(); // Adjust based on your WASM exports
      const outputLength = Module._getOutputLength(); // Adjust accordingly
      const outputArray = new Uint8Array(Module.HEAPU8.buffer, outputPtr, outputLength);
      const outputText = new TextDecoder().decode(outputArray);

      // Free allocated memory
      Module._free(inputPtr);
      Module._free(outputPtr);

      return outputText;
    };

    return Module;
  } catch (error) {
    console.error(`Failed to load WASM module: ${moduleName}`, error);
    throw error;
  }
}

export const initGtoModules = async () => {
  const modules = {};
  try {
    // List of all 69 GTO module names
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
      const moduleInstance = await loadWasmModule(name);
      modules[name] = moduleInstance;
      console.log(`Loaded module: ${name}`);
    }

    console.log(`Loaded ${Object.keys(modules).length} GTO modules`, modules);
  } catch (error) {
    console.error('Error initializing GTO modules:', error);
  }
  return modules;
};