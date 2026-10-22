import { Button, Group, Text } from '@mantine/core'
import { useState } from 'react'
import classes from './Counter.module.css'

type CounterProps = {
  initialCount: number
  max?: number
}

export function Counter({ initialCount, max = 5 }: CounterProps) {
  const [count, setCount] = useState(initialCount)
  const atLimit = count >= max

  return (
    <div className={classes.card}>
      <Text className={classes.count} data-limit={atLimit || undefined}>
        Count is {count}
      </Text>
      <Group mt="sm">
        <Button onClick={() => setCount((c) => c + 1)} disabled={atLimit}>
          Increment
        </Button>
        <Button variant="default" onClick={() => setCount(initialCount)}>
          Reset
        </Button>
      </Group>
      {atLimit && <Text c="red.7" mt="xs">Limit reached</Text>}
    </div>
  )
}
