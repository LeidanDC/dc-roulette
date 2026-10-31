# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite/blob/main/packages/plugin-react) uses Oxc
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses SWC

## React Compiler

The React Compiler is not enabled on this template because of its impact on build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. To add TypeScript to this project, see [the TypeScript template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts).

## Gift Draw

A private roulette wheel for a gift exchange. Add each guest with their first and family name, then start the draw to hide the guest list. Before each spin, enter the drawer's first and family name. Guests draw once, cannot draw someone from their own family, and the wheel does not display names. Each result appears in a modal and is hidden when **OK** is pressed.

To run locally:

```sh
npm install
npm run dev
```

Use **Start over** to clear the guest list. Start a new round to draw from the same group again.
