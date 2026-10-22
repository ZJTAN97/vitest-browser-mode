import { describe, expect, test } from 'vitest'
import { renderRoute } from '../test/render'

describe('routes', () => {
  test('home page renders the counter', async () => {
    const { screen } = await renderRoute('/')

    await expect.element(screen.getByRole('heading', { name: 'Home' })).toBeVisible()
    await expect.element(screen.getByText('Count is 0')).toBeVisible()
  })

  test('navigates to about via the header link', async () => {
    const { screen, router } = await renderRoute('/')

    await screen.getByRole('link', { name: 'About' }).click()

    await expect.element(screen.getByRole('heading', { name: 'About' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/about')
  })
})
