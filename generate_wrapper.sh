#!/bin/bash

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <tool_name> <input_type> <output_type>"
    exit 1
fi

tool_name=$1
input_type=$2
output_type=$3

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
wrapper_file="$SCRIPT_DIR/public/wasm/${tool_name}_wrapper.js"

cat > "$wrapper_file" <<EOL
(function() {
  window.run_${tool_name} = async function(inputText = '', args = []) {
    try {
      const moduleInstance = await window.createModule_${tool_name}({
        noInitialRun: true,
      });

      let outputText = '';

      // Override stderr to capture error messages
      moduleInstance.stderr = function(charCode) {
        console.error(String.fromCharCode(charCode));
      };

      if ('${input_type}' === 'stdin') {
        let inputIndex = 0;

        moduleInstance.stdin = function() {
          if (inputIndex < inputText.length) {
            const charCode = inputText.charCodeAt(inputIndex++);
            return charCode;
          } else {
            return null; // EOF
          }
        };

        moduleInstance.stdout = function(charCode) {
          outputText += String.fromCharCode(charCode);
        };

        const argv = ['${tool_name}', ...args];
        moduleInstance.callMain(argv);
      } else if ('${input_type}' === 'file') {
        // Determine input and output file names based on output_type
        const inputFile = '/input.txt';
        const outputFile = '${output_type}' === 'file' ? '/output.txt' : '/output.txt';

        // Write input data to a virtual file
        moduleInstance.FS.writeFile(inputFile, inputText);

        // Prepare command-line arguments
        const argv = ['${tool_name}', ...args, inputFile, outputFile];

        // Optionally, redirect stdout if needed
        moduleInstance.stdout = function(charCode) {
          outputText += String.fromCharCode(charCode);
        };

        moduleInstance.callMain(argv);

        if ('${output_type}' === 'file') {
          // Read the output data from the output file
          outputText += moduleInstance.FS.readFile(outputFile, { encoding: 'utf8' });
        }
      } else {
        throw new Error('Unsupported input type.');
      }

      return outputText;
    } catch (err) {
      console.error('Error in run_${tool_name}:', err);
      throw err;
    }
  };

  // Factory function to create the Module instance
  window.createModule_${tool_name} = function(moduleOverrides = {}) {
    return new Promise((resolve, reject) => {
      var script = document.createElement('script');
      script.src = '/wasm/${tool_name}.js';
      script.onload = () => {
        var moduleFactory = window['${tool_name}'];
        if (typeof moduleFactory !== 'function') {
          return reject(new Error('Module factory function not found.'));
        }
        moduleFactory({
          ...moduleOverrides,
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

echo "Generated wrapper for ${tool_name} at ${wrapper_file}"