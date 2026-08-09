import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/** Browser MSW worker — local mock mode only (`VITE_ENABLE_MSW=true`) */
export const worker = setupWorker(...handlers)
