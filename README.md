# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Local development

1. Install dependencies with `npm install`.
2. Start the dev server with `npm run dev`.
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## API configuration

API endpoints are assembled in [`src/constants/api.js`](src/constants/api.js). Environment-specific variables such as `VITE_API_BASE_URL` and optional `VITE_API_VERSION` live in [`.env.development`](.env.development) and [`.env.production`](.env.production).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
