export function parseMessage(input: string) {
  const wlMatch = input.match(/wl\s*:\s*(\S+)/i)
  const merchantMatch = input.match(/merchant\s*:\s*(\d+)/i)

  return {
    whitelabel: wlMatch?.[1] ?? '',
    merchant: merchantMatch ? Number(merchantMatch[1]) : 0,
    description: input.trim(),
  }
}

export function parseSingleLinedMessage(input: string) {
  const match = input.match(/(.+?)\s*\/\s*merchant\s+(\d+)/i)

  if (match) {
    return {
      whitelabel: match[1].trim(),
      merchant: Number(match[2]),
      description: input.slice(match.index! + match[0].length).trim(),
    }
  }

  return {
    whitelabel: '',
    merchant: 0,
    description: input.trim(),
  }
}
