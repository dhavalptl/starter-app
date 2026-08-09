import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Node MSW server — Jest unit tests only */
export const server = setupServer(...handlers)
