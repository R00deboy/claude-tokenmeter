import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'tokenmeter',
  component: 'Pane',
  requestId: 'tokenmeter',
  props: {
    title: 'Tokenmeter',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

const USAGE = {
  context: { percent: 42, tokens: 84000, window: 200000 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 75, resetsAt: '2026-10-27T18:00:00Z' },
    { kind: 'seven_day', percentUsed: 12, resetsAt: '2026-11-01T08:00:00Z' },
  ],
  cost: { usd: 1.234 },
}

function engine(on: any, usage: any) {
  on('command.register', () => ({ value: { command: 'tokenmeter' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: any, e: any) => ({ cwd: e.cwd }))
  on('session.usage', () => ({ value: usage }))
  on('session.measure', (_: any, e: any) => ({ changed: e.changed }))
  on('clock.now', () => ({ value: Date.parse('2026-10-27T12:00:00Z') }))
}

test('Panel zeigt die Fenster nach dem Start, auf jeder Oberfläche', async ($, on) => {
  engine(on, USAGE)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /5-Stunden-Fenster/ }))?.text).toBe('5-Stunden-Fenster')
    expect((await ui.find({ type: 'Text', text: /75 % verbraucht/ })) != null).toBe(true)
    expect((await ui.find({ type: 'Text', text: /Kontext/ }))?.text).toMatch(/42 %/)
    expect((await ui.find({ type: 'Text', text: /API-Gegenwert/ }))?.text).toMatch(/1\.23 US\$/)
    await ui.unmount()
  }
})

test('Leerzustand vor der ersten Antwort', async ($, on) => {
  engine(on, { context: { window: 200000 }, rateLimits: [] })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /Noch keine Werte/ })) != null).toBe(true)
  await ui.unmount()
})

test('session.measure aktualisiert das Panel', async ($, on) => {
  engine(on, { context: { window: 200000 }, rateLimits: [] })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.session.measure({ ...USAGE, changed: ['context', 'rateLimits', 'cost'] })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /7-Tage-Fenster/ }))?.text).toBe('7-Tage-Fenster')
  await ui.unmount()
})

test('/tokenmeter antwortet', async ($, on) => {
  engine(on, USAGE)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const r = await $.command.run({ command: 'tokenmeter', args: '' })
  expect(r.text).toBe('Tokenmeter geöffnet.')
})
