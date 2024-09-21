/**
 * Loads a specific GTO tool's wrapper function.
 * @param {string} toolName - The name of the GTO tool/module to load.
 * @returns {Promise<Function>} - The run function of the module.
 */

export async function loadWasmModule(toolName) {
  try {
    // Do not add 'gto_' prefix
    const moduleName = toolName; // Assume toolName is without 'gto_' prefix
    const scriptUrl = `/wasm/${moduleName}_wrapper.js`;

    // Load the script dynamically
    await loadScript(scriptUrl);

    const runFunctionName = `run_${moduleName}`;
    const runFunction = window[runFunctionName];

    if (typeof runFunction === 'function') {
      return runFunction;
    } else {
      throw new Error(`Function ${runFunctionName} not found on window.`);
    }
  } catch (error) {
    console.error(`Failed to load module for ${toolName}`, error);
    throw error;
  }
}

/**
 * Dynamically loads a script into the document.
 * @param {string} src - The URL of the script to load.
 * @returns {Promise<void>}
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      reject(new Error(`Failed to load script: ${src}`));
    };

    document.head.appendChild(script);
  });
}