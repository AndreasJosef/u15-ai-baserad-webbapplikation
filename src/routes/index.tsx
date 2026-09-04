import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: HomePage })

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">Hone</h1>
      <p className="max-w-md text-lg text-neutral-500">
        Turn a vague idea into a concrete plan. Placeholder page — the
        interview is on its way.
      </p>
    </main>
  )
}
