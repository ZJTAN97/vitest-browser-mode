import type { ReactNode } from 'react'
import { MantineProvider } from '@mantine/core'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { render } from 'vitest-browser-react'
import { routeTree } from '../routeTree.gen'
import { theme } from '../theme'

export function renderWithMantine(ui: ReactNode) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>)
}

export async function renderRoute(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  const screen = await renderWithMantine(<RouterProvider router={router} />)
  return { screen, router }
}
