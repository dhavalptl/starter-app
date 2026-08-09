/** @type {import('jest').Config} */
const esmPackages = [
  'msw',
  '@mswjs',
  'until-async',
  'rettime',
  'headers-polyfill',
  'isows',
  '@open-draft',
  'outvariant',
  'strict-event-emitter',
]

const swcJest = [
  '@swc/jest',
  {
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
      },
      transform: {
        react: {
          runtime: 'automatic',
        },
      },
      target: 'es2022',
    },
  },
]

/** @type {import('jest').Config} */
module.exports = {
  clearMocks: true,
  restoreMocks: true,
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testEnvironment: 'jest-fixed-jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/app/**/*.{test,spec}.{ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'node'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(svg|png|jpg|jpeg|gif|webp|ico)$':
      '<rootDir>/tests/__mocks__/fileMock.cjs',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': swcJest,
    '^.+\\.mjs$': swcJest,
  },
  transformIgnorePatterns: [
    `/node_modules/(?!(?:${esmPackages.join('|')})/)`,
  ],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons', 'msw'],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
}
