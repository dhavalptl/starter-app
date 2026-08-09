/**
 * Thin Jest-like BDD wrappers over Node's built-in test runner.
 * Use with: `node --test --test-concurrency=1 dist/pvt.js`
 */
export {
  describe,
  it,
  test,
  before,
  after,
  beforeEach,
  afterEach,
} from 'node:test'
