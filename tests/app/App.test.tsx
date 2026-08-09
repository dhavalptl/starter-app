import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'

describe('App', () => {
  it('renders the brand heading and increments / decrements the counter', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Starter App' }),
    ).toBeInTheDocument()

    const counter = screen.getByRole('button', { name: /count is 0/i })
    await user.click(counter)
    expect(
      screen.getByRole('button', { name: /count is 1/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Decrement' }))
    expect(
      screen.getByRole('button', { name: /count is 0/i }),
    ).toBeInTheDocument()
  })
})
