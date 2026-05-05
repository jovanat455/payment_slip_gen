# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## How to run this app locally

1. Open a terminal in the project folder.
2. Install dependencies if you have not already:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the app in your browser at:

   ```text
   http://localhost:5173/
   ```

5. When the app is running, you can generate the payment slip PDF from the form.

## How to build for production

Run:

```bash
npm run build
```

The production build files are generated in the `dist/` folder.

## Project notes

- App entry point: `src/main.jsx`
- Main component: `src/App.jsx`
- Styles: `src/index.css` and `src/App.css`

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
