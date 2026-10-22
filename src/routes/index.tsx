import { Stack, Title } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { Counter } from '../components/Counter/Counter'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <Stack>
      <Title order={1}>Home</Title>
      <Counter initialCount={0} />
    </Stack>
  )
}
