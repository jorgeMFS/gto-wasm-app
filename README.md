# GTO BioChef

A web-based GTO tool, utilizing GTO WebAssembly modules for data processing.

## Features

- Select and run various GTO tools.
- Input data via text or file.
- View output in real-time.
- Responsive and user-friendly UI built with Material-UI.

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm start
   ```

3. **Build for production:**

   ```bash
   npm run build
   ```

4. **Copy WASM files to `public/wasm`:**

   ```bash
   npm run copy-wasm
   ```

## Adding New Tools

1. **Place the `.wasm` and `.js` files in the `public/wasm` directory.**
2. **Update the `predefinedToolNames` array in `App.js` with the new tool name.**
3. **Ensure the tool is properly loaded and handled in `gtoWasm.js`.**

## License

MIT License