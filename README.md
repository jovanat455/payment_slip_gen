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

4. If you want to save `src/dugovanja.txt` directly from the app, also start the backend server in another terminal:

   ```bash
   npm run backend
   ```

5. Open the app in your browser at:

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

### Data files format

#### `src/dugovanja.txt` - Debt tracking file

Format: `STAN|YEAR|MONTHS`

Example:
```
01|2025|1,1,1,1,1,1,1,1,1,1,1,1
01|2026|1,0,0,0,0,0,0,0,0,0,0,0
02|2025|1,1,1,1,1,1,1,1,1,1,1,1
02|2026|1,1,1,0,0,0,0,0,0,0,0,0
```

- `STAN`: Apartment number (01-11)
- `YEAR`: Year (2025, 2026, etc.)
- `MONTHS`: Comma-separated 12 values (1 = paid, 0 = unpaid) for January-December

#### `src/dugovanja_dodatni_troskovi.txt` - Additional apartment costs and payment status

Format:

```txt
06|2026-01|popravka garaznih vrata|5000|0
07|2026-01|popravka garaznih vrata|5000|0
08|2026-01|popravka garaznih vrata|5000|1

Example:

Apartment 06 has an unpaid additional cost of 5000 dinars for garage door repair in January 2026.
Apartment 08 has already paid the same cost.

Additional costs are automatically:

included in generated invoices
shown in unpaid debt calculation
tracked separately from the regular monthly maintenance payment

**Example with duplicate apartments:**
Stan 03 appears twice, so it will be charged 2×2000 = 4000 dinars for that item.

**If file is empty or missing:** No additional costs are added to invoices.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
