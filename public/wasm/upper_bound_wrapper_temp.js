/**
 * Wrapper function for the upper_bound WASM module.
 * Automatically generated by generate_wrapper.py
 */

(function() {
  /**
   * Runs the UpperBound tool with the provided input data.
   * @param {string} inputData - The input data.
   * @param {Array<string>} args - Additional arguments to pass to upper_bound.
   * @returns {Promise<Object>} An object containing stdout and stderr outputs.
   */
  async function runUpperBound(inputData, args = []) {
    console.log("Starting runUpperBound with input:", inputData);
    console.log("Arguments:", args);

    try {
      // Normalize line endings
      inputData = inputData.replace(/\r\n/g, '\n');

      // Buffers for capturing stdout and stderr
      let stdoutBuffer = '';
      let stderrBuffer = '';

      // Initialize options for the module
      const options = {
        locateFile: (path) => {
          if (path.endsWith('.wasm')) {
            return `/wasm/${path}`;
          }
          return path;
        },
        thisProgram: './upper_bound',
        noInitialRun: true, // We will call main manually
        // Remove noExitRuntime to use default behavior (false)
        // noExitRuntime: false,
        print: function(text) {
          stdoutBuffer += text + '\n';
        },
        printErr: function(text) {
          stderrBuffer += text + '\n';
        },
      };

      // Load the module
      await loadModuleScript('upper_bound');
      const moduleFactory = window['upper_bound'];
      if (typeof moduleFactory !== 'function') {
        throw new Error("Module factory function for upper_bound is not available.");
      }

      const module = await moduleFactory(options);

      // Write input data to 'input.txt' in the virtual filesystem
      module.FS.writeFile('input.txt', inputData);

      // Execute the module's main function
      const fullArgs = args;
      console.log("Executing module.callMain with arguments:", fullArgs);
      module.callMain(fullArgs);

      // Read the output directly after callMain
      const outputData = stdoutBuffer.trim();

      return {
        stdout: outputData,
        stderr: stderrBuffer.trim()
      };

    } catch (err) {
      console.error('Error in runUpperBound:', err);
      throw err;
    }
  }

  /**
   * Dynamically loads the WASM module script if not already loaded.
   * @param {string} moduleName - The name of the module.
   */
  function loadModuleScript(moduleName) {
    return new Promise((resolve, reject) => {
      if (window[moduleName]) {
        // Module script is already loaded
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `/wasm/${moduleName}.js`;
      script.onload = () => {
        console.log(`Module script ${moduleName}.js loaded.`);
        resolve();
      };
      script.onerror = () => {
        reject(new Error(`Failed to load module script ${moduleName}.js.`));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Expose the runUpperBound function globally.
   */
  window.run_upper_bound = runUpperBound;
})();