import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Hegemonia</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Build your city. Forge your empire. Dominate the world.
        </p>
      </div>
    </div>
  )
}
