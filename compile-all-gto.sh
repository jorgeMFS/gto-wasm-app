#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status.

# Set the path to the emsdk directory
EMSDK_PATH="/home/jorge/GTOChef/emsdk"

# Ensure Emscripten is in the PATH
source "$EMSDK_PATH/emsdk_env.sh"

# Navigate to the GTO src directory
cd "$(dirname "$0")/gto/src"

# Create the output directory
mkdir -p ../../public/wasm

# Compile common objects
common_objects="argparse.o csmodel.o buffer.o mem.o misc.o parser.o reads.o labels.o common.o dna.o fcm.o phash.o"
for file in $common_objects; do
    echo "Compiling ${file%.o}.c..."
    emcc -c "${file%.o}.c" -o "$file" -I. -DLINUX
done

# Declare associative array
declare -A program_sources

# Define the regex pattern to extract program names and source files
regex='^\$\(([^)]+)\)/gto_([a-zA-Z0-9_]+):[[:space:]]+([a-zA-Z0-9_]+\.c)'

# Initialize counters
total_programs=0
compiled_programs=0
failed_programs=0

# Read the Makefile and extract program names and source files
while IFS= read -r line; do
    if [[ $line =~ $regex ]]; then
        prog="${BASH_REMATCH[2]}"
        source_file="${BASH_REMATCH[3]}"
        program_sources["$prog"]="$source_file"
        total_programs=$((total_programs + 1))
    fi
done < Makefile

# Debug: List all programs and their source files
echo "Programs to compile:"
for prog in "${!program_sources[@]}"; do
    echo " - $prog: ${program_sources[$prog]}"
done

# Define common flags
common_flags=(
    -O3
    -Wall
    -Wextra
    -Wno-unused-result
    -DPROGRESS
    -DLINUX
    -I.
    -s WASM=1
    -s EXPORT_ES6=1
    -s MODULARIZE=1
    -s ENVIRONMENT=web
    -s USE_ES6_IMPORT_META=1
    -s ALLOW_MEMORY_GROWTH=1
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]'
    -s EXPORTED_FUNCTIONS='["_main", "_malloc", "_free"]'
)

# Compile individual programs
for prog in "${!program_sources[@]}"; do
    source_file="${program_sources[$prog]}"
    echo "---------------------------------------------"
    echo "Compiling program: $prog"
    echo "Source file: $source_file"

    if [ -f "$source_file" ]; then
        echo "Compiling $source_file for program $prog..."
        if emcc "${common_flags[@]}" \
            -o "../../public/wasm/gto_${prog}.js" \
            "$source_file" \
            $common_objects \
            >> compile_errors.log 2>&1; then
            compiled_programs=$((compiled_programs + 1))
            echo "Successfully compiled ${prog}"
        else
            failed_programs=$((failed_programs + 1))
            echo "Failed to compile ${prog}. Check compile_errors.log for details."
            tail -n 10 compile_errors.log
        fi
    else
        failed_programs=$((failed_programs + 1))
        echo "Warning: Source file $source_file not found for program $prog"
    fi
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

# Remove any remaining files in src/wasm and wasm directories
rm -rf src/wasm/*.wasm src/wasm/*.js wasm/*.wasm wasm/*.js