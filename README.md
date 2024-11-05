
![BioChef](img/BioChef.svg)

[![Downloads](https://img.shields.io/github/downloads/jorgeMFS/gto-wasm-app/total)](https://github.com/jorgeMFS/gto-wasm-app/releases)
[![License](https://img.shields.io/github/license/jorgeMFS/gto-wasm-app)](LICENSE)
[![Version](https://img.shields.io/github/v/tag/jorgeMFS/gto-wasm-app)](https://github.com/jorgeMFS/gto-wasm-app/releases)

GTO BioChef is a powerful web-based application for genomic sequence analysis and manipulation. It provides a user-friendly interface to execute various genomic tools from the GTO (Genomic Toolkit Operations) suite directly in your browser using WebAssembly technology.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Features](#features)
- [Tools Available](#tools-available)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
  - [Key Files](#key-files)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

- **Interactive Workflow Builder**: Drag-and-drop interface to create custom genomic analysis workflows.
- **Wide Range of Tools**: Access to numerous GTO tools for sequence manipulation, format conversion, and analysis.
- **Real-time Execution**: Run your workflows directly in the browser without the need for server-side processing.
- **Input/Output Management**: Easy-to-use panels for managing input data and viewing results.
- **Data Type Detection**: Automatic detection and validation of input data types (FASTA, FASTQ, etc.).
- **Compatibility Checks**: Visual indicators for tool compatibility based on current input data.
- **Recipe Saving**: Save and load your custom workflows for future use.

## Tools Available

GTO BioChef includes a wide array of genomic tools, categorized for easy access:

1. Sequence Manipulation (e.g., FASTA extraction, reverse, complement)
2. Format Conversion (e.g., FASTA to SEQ, FASTQ to FASTA)
3. Genomic Operations (e.g., genomic complement, random DNA generation)
4. Amino Acid Operations
5. Information and Analysis
6. Mathematical Operations
7. Text Processing



## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Emscripten (for compiling C code to WebAssembly)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/jorgeMFS/gto-wasm-app.git
   cd gto-wasm-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Install Emscripten SDK:
   Download and install the Emscripten SDK from the [official repository](https://github.com/emscripten-core/emsdk). (Preferably the 3.1.65 version)

4. Setup Emscripten Environment Variable:
   ```
   nano ~/.bashrc
   export EMSDK_PATH="/path/to/your/emsdk"
   source ~/.bashrc
   ```

5. Compile GTO tools to WebAssembly:
   ```
   npm run build-wasm
   ```

6. Start the development server:
   ```
   npm start
   ```

7. Open your browser and navigate to `http://localhost:8082`.

For more detailed installation instructions, including troubleshooting tips, please see our [Installation Guide](docs/INSTALLATION.md).

## Usage

1. **Input Data**: Paste your genomic sequence or upload a file in the Input Panel.
2. **Build Workflow**: Drag tools from the Operations Panel to the Recipe Panel to create your workflow.
3. **Set Parameters**: Adjust tool parameters as needed in the Recipe Panel.
4. **Execute**: Run individual tools or the entire workflow using the execution controls.
5. **View Results**: See the output in the Output Panel and save results as needed.


## Development

- The project uses React for the frontend, with Material-UI for styling.
- WebAssembly modules are generated from C source code using Emscripten.
- Webpack is used for bundling and serving the application.

### Key Files

- `src/App.js`: Main application component
- `src/components/`: React components for various UI elements
- `src/utils/`: Utility functions including data type detection
- `src/gtoWasm.js`: WebAssembly module loading logic
- `compile-all-gto.sh`: Script for compiling GTO tools to WebAssembly
- `generate_wrapper.py`: Python script for generating JavaScript wrappers for WebAssembly modules


## Contributing

We welcome contributions to GTO BioChef! Whether it's bug reports, feature requests, or code contributions, please refer to our [Contributing Guidelines](CONTRIBUTING.md) for more information on how to get started.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- The GTO (Genomic Toolkit) suite developers
- The Emscripten team for enabling C-to-WebAssembly compilation
- All contributors and users of GTO BioChef
