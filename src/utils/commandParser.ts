export interface ParsedCommand {
  command: string
  args: string[]
}

/**
 * Parses a command string starting with '/' into command and arguments.
 * Example: "/summary 2023 Q1" → { command: "summary", args: ["2023", "Q1"] }
 */
export function parseCommand(message: string): ParsedCommand | null {
  if (!message.startsWith('/')) return null

  const parts = message.trim().split(/\s+/)
  const command = parts[0].slice(1).toLowerCase() // remove leading "/"
  const args = parts.slice(1)

  return { command, args }
}
