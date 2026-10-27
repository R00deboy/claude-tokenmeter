export type Meter = {
  limits: { kind: string; percentUsed: number; resetsAt?: string }[]
  contextPercent?: number
  contextTokens?: number
  contextWindow?: number
  usd?: number
  measuredAt?: number
}

declare module 'claude-code' {
  interface PluginState {
    tokenmeter: { meter: Shaped<Meter> }
  }
}
