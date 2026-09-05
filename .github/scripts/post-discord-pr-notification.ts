// Thin glue for the Discord PR-notification workflow (issue #41): reads the
// `pull_request` event GitHub Actions already checked out, builds the
// Discord message via the tested pure function, and posts it. Deliberately
// untested (per issue #41 Testing Decisions) — verify manually post-merge
// by opening/closing a real test PR, the same way the old native webhook
// was verified.

import { readFileSync } from 'node:fs'

import { buildPrNotification, type PullRequestEventPayload } from './discord-pr-notification.ts'

const eventPath = process.env.GITHUB_EVENT_PATH
if (!eventPath) {
  throw new Error('GITHUB_EVENT_PATH is not set — this script only runs inside a GitHub Actions job.')
}

const webhookUrl = process.env.DISCORD_WEBHOOK_URL
if (!webhookUrl) {
  throw new Error('DISCORD_WEBHOOK_URL is not set — add it as a repo secret (see docs/team-workflow.md §5).')
}

const payload: PullRequestEventPayload = JSON.parse(readFileSync(eventPath, 'utf-8'))

const message = buildPrNotification(payload)

if (!message) {
  console.log('Skipping Discord notification (draft PR, bot-authored PR, or unhandled action).')
  process.exit(0)
}

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(message),
})

if (!response.ok) {
  throw new Error(`Discord webhook POST failed: ${response.status} ${response.statusText} — ${await response.text()}`)
}

console.log('Posted Discord PR notification.')
