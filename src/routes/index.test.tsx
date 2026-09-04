import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { HomePage } from './index'

it('renders the app name as a heading', () => {
  render(<HomePage />)
  expect(
    screen.getByRole('heading', { level: 1, name: 'Hone' }),
  ).toBeInTheDocument()
})
