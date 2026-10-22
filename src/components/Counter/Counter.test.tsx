import { describe, expect, test } from 'vitest'
import { renderWithMantine } from '../../test/render'
import { Counter } from './Counter'

describe('Counter', () => {
  test('increments when the button is clicked', async () => {
    const screen = await renderWithMantine(<Counter initialCount={1} />)

    await screen.getByRole('button', { name: 'Increment' }).click()

    await expect.element(screen.getByText('Count is 2')).toBeVisible()
  })

  test('disables increment and turns red at the limit', async () => {
    const screen = await renderWithMantine(<Counter initialCount={2} max={3} />)

    await screen.getByRole('button', { name: 'Increment' }).click()

    const mantineRed7 = getComputedStyle(document.documentElement)
      .getPropertyValue('--mantine-color-red-7')
      .trim()
    await expect.element(screen.getByRole('button', { name: 'Increment' })).toBeDisabled()
    await expect.element(screen.getByText('Limit reached')).toBeVisible()
    await expect
      .element(screen.getByText('Count is 3'))
      .toHaveStyle({ color: mantineRed7 })
  })

  test('applies CSS module styles', async () => {
    const screen = await renderWithMantine(<Counter initialCount={0} />)

    await expect
      .element(screen.getByText('Count is 0'))
      .toHaveStyle({ fontSize: '32px', fontWeight: '700' })
  })
})
