#!/bin/bash

# Don't exit immediately on error
set +e

# Set the path to the emsdk directory
EMSDK_PATH="/home/jorge/GTOChef/emsdk"

# Ensure Emscripten is in the PATH
source "$EMSDK_PATH/emsdk_env.sh"

# Navigate to the GTO src directory
cd "$(dirname "$0")/gto/src"

# Create the output directory
mkdir -p ../../public/wasm

# Compile common objects
common_sources="argparse.c csmodel.c buffer.c mem.c misc.c parser.c reads.c labels.c common.c dna.c fcm.c phash.c"
for file in $common_sources; do
    echo "Compiling $file..."
    emcc -c "$file" -o "${file%.c}.o" -I. -DLINUX -O3 -Wall -ffast-math
    if [ $? -ne 0 ]; then
        echo "Error compiling $file"
        exit 1
    fi
done

common_objects=$(echo $common_sources | sed 's/\.c/\.o/g')

# Define the list of programs to compile (order matches Makefile)
declare -A program_sources
program_sources=(
    ["fastq_to_fasta"]="FastqToFasta.c"
    ["fastq_to_mfasta"]="FastqToMFasta.c"
    ["fasta_to_seq"]="FastaToSeq.c"
    ["fasta_from_seq"]="FastaFromSeq.c"
    ["fastq_from_seq"]="FastqFromSeq.c"
    ["char_to_line"]="CharToLine.c"
    ["amino_acid_to_group"]="AminoAcidToGroup.c"
    ["fasta_extract_read_by_pattern"]="FastaExtractReadByIdPattern.c"
    ["fasta_extract"]="FastaExtract.c"
    ["fasta_extract_by_read"]="FastaExtractByRead.c"
    ["fasta_info"]="FastaInfo.c"
    ["fastq_exclude_n"]="FastqExcludeN.c"
    ["fastq_extract_quality_scores"]="FastqExtractQS.c"
    ["fastq_info"]="FastqInfo.c"
    ["fastq_maximum_read_size"]="FastqMaximumReadSize.c"
    ["fastq_minimum_read_size"]="FastqMinimumReadSize.c"
    ["fastq_minimum_quality_score"]="FastqMinimumQualityScore.c"
    ["fasta_find_n_pos"]="FastaFindNPos.c"
    ["genomic_gen_random_dna"]="GenomicGenRandomDNA.c"
    ["fasta_mutate"]="FastaMutate.c"
    ["fastq_mutate"]="FastqMutate.c"
    ["new_line_on_new_x"]="NewLineForNewValue.c"
    ["amino_acid_to_pseudo_dna"]="AminoAcidToPseudoDNA.c"
    ["fasta_rand_extra_chars"]="FastaRandExtraChars.c"
    ["fastq_rand_extra_chars"]="FastqRandExtraChars.c"
    ["genomic_rand_seq_extra_chars"]="GenomicRandSeqExtraChars.c"
    ["fasta_rename_human_headers"]="FastaRenameHumanHeaders.c"
    ["genomic_reverse"]="Reverse.c"
    ["reverse"]="Reverse.c"
    ["fasta_split_reads"]="FastaSplitReads.c"
    ["fastq_split"]="FastqSplit.c"
    ["fastq_pack"]="FastqPack.c"
    ["fastq_unpack"]="FastqUnpack.c"
    ["upper_bound"]="UpperBound.c"
    ["lower_bound"]="LowerBound.c"
    ["fastq_quality_score_info"]="FastqQualityScoreInfo.c"
    ["fastq_quality_score_min"]="FastqQualityScoreMin.c"
    ["fastq_quality_score_max"]="FastqQualityScoreMax.c"
    ["fastq_cut"]="FastqCut.c"
    ["fastq_minimum_local_quality_score_forward"]="FastqMinimumQualityScoreForward.c"
    ["fastq_minimum_local_quality_score_reverse"]="FastqMinimumQualityScoreReverse.c"
    ["genomic_dna_mutate"]="GenomicDNAMutate.c"
    ["genomic_extract"]="GenomicExtract.c"
    ["brute_force_string"]="BruteForceString.c"
    ["real_to_binary_with_threshold"]="RealToBinaryWithThreshold.c"
    ["sum"]="Sum.c"
    ["filter"]="Filter.c"
    ["word_search"]="WordSearch.c"
    ["permute_by_blocks"]="PermuteByBlocks.c"
    ["fasta_extract_pattern_coords"]="FastaExtractPatternCoords.c"
    ["info"]="Info.c"
    ["segment"]="Segment.c"
    ["fasta_get_unique"]="FastaGetUnique.c"
    ["genomic_period"]="GenomicPeriod.c"
    ["genomic_count_bases"]="GenomicCountBases.c"
    ["max"]="Max.c"
    ["min"]="Min.c"
    ["fastq_complement"]="FastqComplement.c"
    ["fasta_complement"]="FastaComplement.c"
    ["genomic_complement"]="GenomicComplement.c"
    ["fastq_reverse"]="FastqReverse.c"
    ["fasta_reverse"]="FastaReverse.c"
    ["amino_acid_from_fasta"]="AminoAcidFromFasta.c"
    ["amino_acid_from_fastq"]="AminoAcidFromFastq.c"
    ["amino_acid_from_seq"]="AminoAcidFromSeq.c"
    ["fasta_split_streams"]="FastaSplitStreams.c"
    ["fasta_merge_streams"]="FastaMergeStreams.c"
    ["fasta_filter_extra_char_seqs"]="FastaFilterExtraCharSeqs.c"
)

# Initialize counters
total_programs=0
compiled_programs=0
failed_programs=0

for prog in "${!program_sources[@]}"; do
    source_file=${program_sources[$prog]}
    total_programs=$((total_programs + 1))

    echo "Processing $prog ($source_file)..."

    if [[ -f "$source_file" ]]; then
        output_js="../../public/wasm/gto_${prog}.js"

        # Define compilation flags
          emcc \
            -O3 \
            -Wall \
            -ffast-math \
            -DPROGRESS \
            -DLINUX \
            -I. \
            -s WASM=1 \
            -s ALLOW_MEMORY_GROWTH=1 \
            -s MODULARIZE=1 \
            -s EXPORT_NAME="'gto_${prog}'" \
            -s ENVIRONMENT='web,worker' \
            -s EXPORTED_FUNCTIONS='["_main", "_malloc", "_free"]' \
            -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "FS", "setValue", "stringToUTF8"]' \
            "$source_file" \
            $common_objects \
            -o "$output_js" \
            -lm \
            > "../../public/wasm/gto_${prog}_compile.log" 2>&1

        if [ $? -eq 0 ]; then
            compiled_programs=$((compiled_programs + 1))
            echo "Successfully compiled ${prog}"

            # Create a JavaScript wrapper that attaches run_<toolName> to window
cat > "../../public/wasm/gto_${prog}_wrapper.js" <<EOL
(function() {
  window.run_${prog} = async function(input, args = []) {
    const moduleInstance = await window.createModule_${prog}();
    
    // Set up input
    moduleInstance.FS.writeFile('input.txt', input);

    // Prepare command-line arguments
    const argv = ['gto_${prog}', ...args, 'input.txt', 'output.txt'];
    const argc = argv.length;
    const argvPtrs = argv.map(arg => {
      const buf = moduleInstance._malloc(arg.length + 1);
      moduleInstance.stringToUTF8(arg, buf, arg.length + 1);
      return buf;
    });

    const argvPtr = moduleInstance._malloc(argc * 4);
    argvPtrs.forEach((ptr, i) => {
      moduleInstance.setValue(argvPtr + i * 4, ptr, '*');
    });

    // Run the main function
    moduleInstance._main(argc, argvPtr);

    // Read the output
    const output = moduleInstance.FS.readFile('output.txt', { encoding: 'utf8' });

    // Clean up
    moduleInstance._free(argvPtr);
    argvPtrs.forEach(ptr => moduleInstance._free(ptr));

    return output;
  };

  // Factory function to create the Module instance
  window.createModule_${prog} = function() {
    return new Promise((resolve, reject) => {
      var script = document.createElement('script');
      script.src = '/wasm/gto_${prog}.js';
      script.onload = () => {
        window['gto_${prog}']({
          locateFile: (path, prefix) => {
            if (path.endsWith('.wasm')) {
              return '/wasm/' + path;
            }
            return prefix + path;
          }
        }).then(resolve).catch(reject);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };
})();
EOL

            echo "Created wrapper for ${prog}"

        else
            failed_programs=$((failed_programs + 1))
            echo "Failed to compile ${prog}. Check gto_${prog}_compile.log for details."
            tail -n 10 "../../public/wasm/gto_${prog}_compile.log"
        fi
    else
        failed_programs=$((failed_programs + 1))
        echo "Warning: Source file $source_file not found for program $prog"
    fi

    echo "----------------------------------------"
done

# Clean up common object files
rm *.o

cd ../..

echo "---------------------------------------------"
echo "Compilation complete!"
echo "Total programs: $total_programs"
echo "Successfully compiled: $compiled_programs"
echo "Failed to compile: $failed_programs"

echo "WASM files generated:"
ls -1 public/wasm/*.wasm 2>/dev/null || echo "None"

echo "JS files generated:"
ls -1 public/wasm/*.js 2>/dev/null || echo "None"

echo "Wrapper files generated:"
ls -1 public/wasm/*_wrapper.js 2>/dev/null || echo "None"

# Remove any remaining files in src/wasm and wasm directories
rm -rf src/wasm/*.wasm src/wasm/*.js wasm/*.wasm wasm/*.js