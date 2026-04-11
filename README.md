# Texas Thanos Stats

⚠️ Work-in-progress starter code for custom notebook renderers in VS Code. Expect this to change as notebooks matures. ⚠️

This starter includes:

 - 🖥️ TypeScript code to create a simple `NotebookOutputRenderer`
 - 📦 A Webpack build for renderer client code
 - ⚡ Support for hot module reloading and safe boilerplate
 - 🎨 CSS modules support

### Running this App

 1. `cd <project-folder>`
 1. `code-insiders .`: Open the folder in VS Code Insiders
 1. Hit `F5` to build+debug

### Structure

A Notebook Renderer consists of code that runs in the VS Code Extension Host (Node.js), which registers the renderer and passes data into the UI code running inside a WebView (Browser/DOM).

This uses TypeScript project references. There are three projects in the `src` directory:

 - `extension` contains the code running in Node.js extension host. It's compiled with `tsc`.
 - `client` is the UI code, built by Webpack, with access to the DOM.
 - `common` contains code shared between the extension and client.

When you run `watch`, `compile`, or `dev`, we invoke both `tsc` and `webpack` to compile the extension and the client portion of the code.

### Google Sheets API Key

For the Texas Thanos browser build, the Google Sheets API key is injected at build time.

 - Local development: create `.env.local` from `.env.local.example` and set `GOOGLE_SHEETS_API_KEY`.
 - GitHub Pages CI: set repository secret `GOOGLE_SHEETS_API_KEY`.

Do not commit real keys to source files.
