const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the directory of the script
const SCRIPT_DIR = __dirname;

// Set the path to the emsdk directory
const EMSDK_PATH = "/home/jorge/GTOChef/emsdk";

// Ensure Emscripten is in the PATH
process.env.PATH = `${EMSDK_PATH}:${process.env.PATH}`;

// Path to description.json
const DESCRIPTION_FILE = path.join(SCRIPT_DIR, "description.json");

// Ensure description.json exists
if (!fs.existsSync(DESCRIPTION_FILE)) {
    console.error(`Error: description.json not found at ${DESCRIPTION_FILE}`);
    process.exit(1);
}

// Ensure public/wasm directory exists
const WASM_DIR = path.join(SCRIPT_DIR, "public", "wasm");
fs.mkdirSync(WASM_DIR, { recursive: true });

// Single log file for all compilations
const MAIN_LOG_FILE = path.join(WASM_DIR, "compilation_log.txt");
fs.writeFileSync(MAIN_LOG_FILE, "Compilation Log\n=================\n");

function log(message) {
    console.log(message);
    fs.appendFileSync(MAIN_LOG_FILE, message + "\n");
}

// Compile common source files
const common_sources = ["argparse.c", "buffer.c", "common.c", "csmodel.c", "dna.c", "fcm.c", "labels.c", "mem.c", "misc.c", "parser.c", "phash.c", "reads.c"];
let common_objects = "";

log("Compiling common source files...");

common_sources.forEach(file => {
    const obj_file = file.replace('.c', '.o');
    log(`Compiling ${file}...`);
    try {
        execSync(`emcc -c "${path.join(SCRIPT_DIR, 'gto', 'src', file)}" -o "${obj_file}" -I"${path.join(SCRIPT_DIR, 'gto', 'src')}" -O3 -Wall -ffast-math -DLINUX`, { stdio: 'inherit' });
        common_objects += ` ${obj_file}`;
    } catch (error) {
        console.error(`Error compiling ${file}. Check ${MAIN_LOG_FILE} for details.`);
        process.exit(1);
    }
});

// Compile Additional Objects for Comparative Mapping
const additional_cmap_sources = ["common-cmap.c", "mem-cmap.c", "msg-cmap.c", "paint-cmap.c", "time-cmap.c"];
let additional_cmap_objects = "";

log("Compiling additional ComparativeMap source files...");

additional_cmap_sources.forEach(file => {
    const obj_file = file.replace('.c', '.o');
    log(`Compiling ${file}...`);
    try {
        execSync(`emcc -c "${path.join(SCRIPT_DIR, 'gto', 'src', file)}" -o "${obj_file}" -I"${path.join(SCRIPT_DIR, 'gto', 'src')}" -O3 -Wall -ffast-math -DLINUX`, { stdio: 'inherit' });
        additional_cmap_objects += ` ${obj_file}`;
    } catch (error) {
        console.error(`Error compiling ${file}. Check ${MAIN_LOG_FILE} for details.`);
        process.exit(1);
    }
});

// Read tools from description.json
const description = JSON.parse(fs.readFileSync(DESCRIPTION_FILE, 'utf8'));
const tools = description.tools;

let total_programs = 0;
let compiled_programs = 0;
let failed_programs = 0;
let failed_list = [];

tools.forEach(tool => {
    const prog = tool.name;
    const source_file = tool.source || '';
    const input_type = tool.input?.type || 'unknown';
    const output_type = tool.output?.type || 'unknown';

    if (!source_file) {
        log(`Skipping ${prog}: no source file specified.`);
        return;
    }

    // Remove 'gto_' prefix for module name
    const module_name = prog.replace(/^gto_/, '');

    const full_source_path = path.join(SCRIPT_DIR, source_file);

    total_programs++;

    log(`Processing ${prog} (${source_file})...`);
    log(`Compiling ${prog}...`);

    if (fs.existsSync(full_source_path)) {
        const output_js = path.join(WASM_DIR, `${module_name}.js`);
        const compile_log = path.join(WASM_DIR, `${module_name}_compile.log`);

        // Define compilation flags
        const emcc_flags = [
            '-O3',
            '-Wall',
            '-ffast-math',
            '-DPROGRESS',
            '-DLINUX',
            `-I"${path.join(SCRIPT_DIR, 'gto', 'src')}"`,
            '-sWASM=1',
            '-sALLOW_MEMORY_GROWTH=1',
            '-sMODULARIZE=1',
            `-sEXPORT_NAME="${module_name}"`,
            '-sENVIRONMENT=web,worker',
            '-sEXPORTED_FUNCTIONS=\'["_main","_malloc","_free"]\'',
            '-sEXPORTED_RUNTIME_METHODS=\'["ccall","cwrap","FS","setValue","stringToUTF8","callMain"]\''
        ];

        // Determine which object files to link
        const link_objects = prog === 'gto_comparative_map' ? additional_cmap_objects : common_objects;

        // Create post.js to assign module factory to window
        const post_js_content = `window['${module_name}'] = ${module_name};`;
        fs.writeFileSync(path.join(WASM_DIR, `${module_name}_post.js`), post_js_content);

        // Compile the program with --post-js
        const compile_command = `emcc ${emcc_flags.join(' ')} "${full_source_path}" ${link_objects} -o "${output_js}" -lm --post-js "${path.join(WASM_DIR, `${module_name}_post.js`)}"`;
        log(`Command: ${compile_command}`);

        try {
            execSync(compile_command, { stdio: 'inherit' });
            log(`Successfully compiled ${module_name}.`);
            compiled_programs++;

            // Generate the wrapper script
            execSync(`"${path.join(SCRIPT_DIR, 'generate_wrapper.sh')}" "${module_name}" "${input_type}" "${output_type}"`, { stdio: 'inherit' });
        } catch (error) {
            failed_programs++;
            failed_list.push(module_name);
            log(`Failed to compile ${module_name}. Check ${compile_log} for details.`);

            // Extract and display relevant error messages
            log(`Analyzing compilation errors for ${module_name}...`);
            const compile_output = fs.readFileSync(compile_log, 'utf8');
            if (compile_output.includes('error:')) {
                log('Compilation errors found:');
                compile_output.split('\n')
                    .filter(line => line.includes('error:'))
                    .slice(0, 5)
                    .forEach(line => log(line));
            } else if (compile_output.includes('undefined symbol')) {
                log('Linker errors found (undefined symbols):');
                compile_output.split('\n')
                    .filter(line => line.includes('undefined symbol'))
                    .slice(0, 5)
                    .forEach(line => log(line));
            } else {
                log('Unknown compilation error. Please check the log file.');
            }
        }
    } else {
        failed_programs++;
        failed_list.push(module_name);
        log(`Warning: Source file '${full_source_path}' not found for program '${module_name}'.`);
    }

    log('----------------------------------------');
});

// Clean up object files
log('Cleaning up object files...');
fs.readdirSync('.').forEach(file => {
    if (file.endsWith('.o')) {
        fs.unlinkSync(file);
    }
});

// Summary
log('\n---------------------------------------------');
log('Compilation complete!');
log(`Total programs: ${total_programs}`);
log(`Successfully compiled: ${compiled_programs}`);
log(`Failed to compile: ${failed_programs}`);

if (failed_list.length > 0) {
    log('\nFailed programs:');
    failed_list.forEach(prog => log(`- ${prog}`));
}

log(`\nDetailed compilation log available at: ${MAIN_LOG_FILE}`);

// Remove any remaining files in src/wasm and wasm directories
['src/wasm', 'wasm'].forEach(dir => {
    const fullDir = path.join(SCRIPT_DIR, dir);
    if (fs.existsSync(fullDir)) {
        fs.readdirSync(fullDir).forEach(file => {
            if (file.endsWith('.wasm') || file.endsWith('.js')) {
                fs.unlinkSync(path.join(fullDir, file));
            }
        });
    }
});