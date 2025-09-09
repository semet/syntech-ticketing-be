export function parseMessage(input) {
    const wlMatch = input.match(/wl\s*:\s*(\S+)/i);
    const merchantMatch = input.match(/merchant\s*:\s*(\d+)/i);
    return {
        whitelabel: wlMatch?.[1] ?? '',
        merchant: merchantMatch ? Number(merchantMatch[1]) : 0,
        description: input.trim(),
    };
}
//# sourceMappingURL=functions.js.map