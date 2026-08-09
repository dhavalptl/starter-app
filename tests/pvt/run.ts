/**
 * PVT entry — App RTL with expect + jsdom (isolated child process).
 *   node --test --test-concurrency=1 --test-timeout=30000 dist/pvt.js
 *
 * Runs in a separate Node process from Express so jsdom / fetch mocks
 * never touch the production server globals.
 */
import './app.test.js'

console.log('[pvt] App production verify starting…')
