# Vitest 5 Browser Mode POC

React + TanStack Router + Mantine (CSS Modules) on Vite 8, with component tests running in a real Chrome via Vitest 5 browser mode.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm test` | Watch mode. Opens a Chrome window with the Vitest UI; re-runs on save. |
| `pnpm test:ui` | Same as above, explicitly with `--ui`. |
| `pnpm test:run` | Single run (use in CI). |
| `pnpm dev` | The actual app. |

First-time setup: `pnpm install`. Google Chrome must be installed (see "Why `channel: 'chrome'`" below).

`pnpm-workspace.yaml` holds pnpm settings. By default pnpm refuses packages published less than a day ago (`minimumReleaseAge`), so `minimumReleaseAgeExclude` lists any brand-new version we deliberately installed.

## How it fits together

```
vite.config.ts      app config: TanStack Router plugin + React plugin
vitest.config.ts    mergeConfig(viteConfig, test config)  ← tests get the same plugins as the app
postcss.config.cjs  Mantine PostCSS preset (same for app and tests)
src/test/setup.ts   runs before every test file: Mantine global CSS + vitest-browser-react
src/test/render.tsx renderWithMantine() / renderRoute() helpers
```

### 1. Packages

```sh
pnpm add -D vitest @vitest/browser-playwright @vitest/ui playwright vitest-browser-react
```

- `vitest`: the runner. `vitest/browser` exposes `page`, `userEvent`, etc. (there's no separate `@vitest/browser` import anymore).
- `@vitest/browser-playwright`: the **provider**. Playwright is only used to launch and drive the browser; it is not the test runner.
- `@vitest/ui`: the dashboard you see with `--ui`.
- `vitest-browser-react`: `render()` for React that returns **locators** instead of DOM nodes.

### 2. `vitest.config.ts`

```ts
export default mergeConfig(
  viteConfig,                       // reuse the app's plugins: router, react, CSS modules, PostCSS
  defineConfig({
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/test/setup.ts'],
      browser: {
        enabled: true,              // run in a real browser instead of jsdom
        provider: playwright({ launchOptions: { channel: 'chrome' } }),
        instances: [{ browser: 'chromium' }],
        viewport: { width: 1280, height: 800 },
      },
    },
  }),
)
```

Key points:

- **`mergeConfig(viteConfig, …)`** is the most important line. Your tests compile exactly like the app, so CSS Modules, Mantine's PostCSS and the router plugin all just work. Don't maintain a second plugin list.
- **`provider` is a function call** (`playwright()`), not a string. This changed in Vitest 4 and still holds in 5.
- **`instances`** lists the browsers. Add `{ browser: 'firefox' }` to run the same suite in multiple browsers.
- **Headed vs headless**: locally it defaults to headed with the UI, and in CI (`CI=true`) to headless. Force it with `--browser.headless` / `--browser.headless=false`.

### Why `channel: 'chrome'`

`pnpm exec playwright install chromium` downloads its own `chrome.exe` into `%LOCALAPPDATA%\ms-playwright`. On this machine Windows blocks that binary ("Permission denied" / `spawn UNKNOWN`), probably an endpoint/AppLocker policy. Headless still works because it uses a different binary (`chromium_headless_shell`), but the UI needs a headed browser.

`channel: 'chrome'` tells Playwright to use the **installed, signed Google Chrome** instead. `'msedge'` works too. If your production machines/CI don't have that restriction, you can drop `launchOptions` and use Playwright's bundled Chromium.

### 3. `src/test/setup.ts`

```ts
import '@mantine/core/styles.css'   // Mantine components are unstyled without this, in tests too
import 'vitest-browser-react'       // registers auto-cleanup + page.render types
```

### 4. Render helpers (`src/test/render.tsx`)

Mantine components throw without `MantineProvider`, so every test goes through a wrapper:

```tsx
export function renderWithMantine(ui: ReactNode) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>)
}
```

For routes, build a **fresh router per test** with in-memory history so tests don't share URL state or touch the real address bar:

```tsx
export async function renderRoute(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  const screen = await renderWithMantine(<RouterProvider router={router} />)
  return { screen, router }
}
```

In your production app, add your other providers here too (QueryClientProvider, i18n, auth context and so on).

### 5. Writing tests

```tsx
test('increments when the button is clicked', async () => {
  const screen = await renderWithMantine(<Counter initialCount={1} />)

  await screen.getByRole('button', { name: 'Increment' }).click()

  await expect.element(screen.getByText('Count is 2')).toBeVisible()
})
```

How this differs from Testing Library + jsdom:

- **`render` is async**, so always `await` it.
- **`.click()` is a real browser click** (via Chrome DevTools Protocol), not a synthetic `fireEvent`. It respects `disabled`, overlays and visibility.
- **`expect.element(locator)` retries** until it passes or times out. No `waitFor` or `findBy*` needed. Use plain `expect(value)` only for non-DOM values.
- **Real CSS is computed.** `toHaveStyle` checks actual rendered styles, so CSS Module rules and Mantine theme colours are testable (see `Counter.test.tsx`). jsdom can't do this.
- **Cleanup happens *before* each test**, not after, so the last component stays on screen in the UI for you to inspect.

### 6. TanStack Router gotcha: colocated tests

The router plugin treats every file in `src/routes/` as a route. A test file there produces a "does not export a Route" warning. Fix in `vite.config.ts`:

```ts
tanstackRouter({ target: 'react', autoCodeSplitting: true, routeFileIgnorePattern: '\\.test\\.tsx?$' })
```

### 7. Vite 8 gotcha

Import the Vite config **with** its extension (`'./vite.config.ts'`) in `vitest.config.ts`. Vite 8 warns about extensionless imports, and that needs `allowImportingTsExtensions` in `tsconfig.json`.

## Using the UI

Run `pnpm test`. A Chrome window opens with the Vitest UI:

- The left panel is the test tree. Click a test to re-run just that one.
- The middle panel is the **live rendered component** in the real browser, at the configured viewport. You can use DevTools on it (F12) to inspect the DOM and styles.
- Edit a component or test and save: only the affected tests re-run, and you see the new render immediately.

Tip: to freeze a component mid-test, open DevTools in that window and add a temporary `debugger` statement, then re-run the test.

## Porting to your production project

1. Install the 5 dev packages above (+ `pnpm exec playwright install chromium` if not using `channel`).
2. Create `vitest.config.ts` with `mergeConfig(viteConfig, …)`.
3. Create `setup.ts` with your global CSS imports.
4. Create a `render` helper wrapping all your app providers.
5. Add `routeFileIgnorePattern` if tests live inside `src/routes`.
6. Add `"types": ["@vitest/browser-playwright"]` to `tsconfig.json` so `page`/locator types know about Playwright options.
