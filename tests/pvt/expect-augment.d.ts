import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'expect' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation
  interface Matchers<R = void>
    extends TestingLibraryMatchers<ReturnType<typeof String>, R> {}
}

export {}
