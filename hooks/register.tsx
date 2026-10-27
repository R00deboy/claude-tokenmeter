import { atom, read, update } from 'claude-code'
import type { Hook, Register } from 'claude-code'

import type { Meter } from '../types'

const PANE = 'tokenmeter'
const TITLE = 'Tokenmeter'
const meter = atom({ plugin: 'tokenmeter', key: 'meter' } as const, { limits: [] } as Meter, {
  shape: 'meter-1',
})

const NAMES: Record<string, string> = {
  five_hour: '5-Stunden-Fenster',
  seven_day: '7-Tage-Fenster',
  spend_limit: 'Ausgabenlimit',
}

function bar(percent: number, width = 20): string {
  const p = Math.max(0, Math.min(100, percent))
  const full = Math.round((p / 100) * width)
  return '█'.repeat(full) + '░'.repeat(width - full)
}

function when(iso?: string): string {
  if (!iso) return 'unbekannt'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function color(p: number): string {
  return p >= 90 ? 'red' : p >= 70 ? 'yellow' : 'green'
}

type Api = Parameters<Hook<'session.start'>>[0]

async function refresh($: Api) {
  const u = await $.session.usage()
  const now = await $.clock.now()
  await update($, meter, () => ({
    limits: u.rateLimits.map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt })),
    contextPercent: u.context.percent,
    contextTokens: u.context.tokens,
    contextWindow: u.context.window,
    usd: u.cost?.usd,
    measuredAt: now,
  }))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'tokenmeter', description: 'Tokenmeter-Panel öffnen' })
    void $.ui.open({ id: PANE, title: TITLE })
    await refresh($)
    return next(e)
  })

  on('command.run', { command: 'tokenmeter' }, async $ => {
    await refresh($)
    await $.ui.open({ id: PANE, title: TITLE })
    return { text: 'Tokenmeter geöffnet.' }
  })

  on('session.measure', async ($, e, next) => {
    const now = await $.clock.now()
    await update($, meter, old => ({
      ...old,
      limits: e.rateLimits.map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt })),
      contextPercent: e.context.percent,
      contextTokens: e.context.tokens,
      contextWindow: e.context.window,
      usd: e.cost?.usd ?? old.usd,
      measuredAt: now,
    }))
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const m = await read($, meter)

    return (
      <Box flexDirection="column">
        <Text bold>Abo-Kontingent</Text>
        {m.limits.length === 0 && (
          <Text dimColor>Noch keine Werte – erscheinen nach Claudes nächster Antwort.</Text>
        )}
        {m.limits.map(l => (
          <Box flexDirection="column" marginBottom={1}>
            <Text>{NAMES[l.kind] ?? l.kind}</Text>
            <Text color={color(l.percentUsed)}>
              {bar(l.percentUsed)} {l.percentUsed} % verbraucht
            </Text>
            <Text dimColor>Rest: {Math.max(0, 100 - l.percentUsed).toFixed(1)} % · zurückgesetzt: {when(l.resetsAt)}</Text>
          </Box>
        ))}
        <Text bold>Diese Sitzung</Text>
        {m.contextPercent !== undefined ? (
          <Text color={color(m.contextPercent)}>
            Kontext {bar(m.contextPercent)} {m.contextPercent} %
          </Text>
        ) : (
          <Text dimColor>Kontext: noch kein Wert</Text>
        )}
        {m.contextTokens !== undefined && (
          <Text dimColor>
            {m.contextTokens.toLocaleString('de-DE')} von {m.contextWindow?.toLocaleString('de-DE')} Tokens
          </Text>
        )}
        {m.usd !== undefined && (
          <Text dimColor>API-Gegenwert: {m.usd.toFixed(2)} US$ (nicht deine Abo-Kosten)</Text>
        )}
        {m.measuredAt !== undefined && (
          <Text dimColor>Stand: {new Date(m.measuredAt).toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin' })}</Text>
        )}
      </Box>
    )
  })
}
