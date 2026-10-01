// ESLint flat config (Next.js 16).
// `eslint-config-next` ya exporta flat configs nativos, así que no hace falta
// @eslint/eslintrc / FlatCompat (que rompía con "Converting circular structure").
import nextTypescript from 'eslint-config-next/typescript'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'functions/**',
    ],
  },
  ...nextTypescript,
  ...nextCoreWebVitals,
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    rules: {
      // El proyecto usa `any` de forma extensiva en bordes con Firestore/Stripe.
      // Se deja como aviso en vez de error para que `npm run lint` sea útil.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Avisos de imports/variables sin usar: se reportan pero no bloquean.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Regla nueva del plugin de React 19: muchas páginas actualizan estado en
      // efectos de forma intencionada al cargar de Firestore.
      'react-hooks/set-state-in-effect': 'warn',
      // Hay <img> deliberados para URLs de Firestore con host dinámico.
      '@next/next/no-img-element': 'warn',
    },
  },
  {
    // tailwind.config.ts y postcss.config.mjs usan require() por diseño.
    files: ['tailwind.config.ts', '**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]

export default eslintConfig