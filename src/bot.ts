/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { Telegraf, Context } from 'telegraf'
import xior from 'xior'

import { parseMessage } from './utils/functions'
interface MessageReactionContext extends Context {
  messageReaction: {
    chat: any
    message_id: number
    user: {
      id: number
      is_bot: boolean
      first_name: string
      last_name: string
      username: string
      language_code: string
    }
    date: number
    old_reaction: Array<{ type: string; emoji?: string }>
    new_reaction: Array<{ type: string; emoji?: string }>
  }
}

// Configuration
const BOT_TOKEN =
  process.env.BOT_TOKEN || '8289496866:AAE61B49NRbmMCZFbK2yalmNgvPoq1LxB5o'
const TRACKED_EMOJIS: string[] = ['👍', '❤️', '🔥', '👎', '😂']

const ALLOWED_CHATS: string[] = [
  // Add your specific chat IDs here
  // '-1001234567890',
  // '-1009876543210',
  '-1002110374869',
  '8289496866',
  '-1002697206987',
  '1002697206987',
]

const DEBUG_MODE: boolean = true

// Initialize bot
const bot = new Telegraf(BOT_TOKEN)
function isChatAllowed(chatId: string | number): boolean {
  if (ALLOWED_CHATS.length === 0) {
    console.warn('⚠️  No allowed chats configured!')
    return false
  }
  return ALLOWED_CHATS.includes(chatId.toString())
}

// Debug function to log chat information
function logChatInfo(context: Context | MessageReactionContext): void {
  if (DEBUG_MODE) {
    const chat = context.chat
    console.log(`📍 Chat Info: ID: ${chat?.id}, Type: ${chat?.type}`)
  }
}

bot.on('message_reaction', async (context: MessageReactionContext) => {
  const chat = context.chat
  const messageId = context.messageReaction.message_id
  if (!chat || !messageId) return

  try {
    logChatInfo(context)
    if (!isChatAllowed(context.chat.id)) {
      if (DEBUG_MODE) {
        console.log(`🚫 Ignoring reaction from non-tracked chat: ${chat}`)
      }
      return
    }

    let messageContent = ''

    const forwardedMessage = (await context.telegram.forwardMessage(
      chat.id,
      chat.id,
      messageId,
      { disable_notification: true },
    )) as any

    messageContent =
      forwardedMessage.text ||
      forwardedMessage.caption ||
      forwardedMessage.sticker?.emoji ||
      '[Media/Other content]'

    await context.telegram.deleteMessage(chat.id, forwardedMessage.message_id)

    const parsed = parseMessage(messageContent)

    const output = {
      messageOwnerUsername: context.messageReaction.user.username || 'unknown',
      reactionEmoji:
        context.messageReaction.new_reaction
          .map((r) => r.emoji)
          .filter(Boolean)
          .join(', ') || 'none',
      link: `https://t.me/c/${context.chat.id}/${context.messageReaction.message_id}`,
      reactorUsername: context.messageReaction.user.username || 'unknown',
      messageDate: new Date(context.messageReaction.date * 1000).toISOString(),
      messageId: context.messageReaction.message_id,
      whitelabel: {
        id: parsed.whitelabel,
        name: parsed.merchant.toString(),
      },
      title: messageContent.slice(0, 26) + '...',
      assignee: {
        id: '',
        name: '',
      },
      priority: 3,
      status: 1,
      category: { id: '', name: 'Uncategorized' },
      description: messageContent,
    }

    xior.post('http://localhost:3000/stream/issue', output)
  } catch (error) {
    console.error('Error processing reaction:', error)
  }
})

// Command to get current chat ID
bot.command('chatid', (context: Context) => {
  const chatId = context.chat?.id?.toString()
  if (!chatId) return

  const isAllowed = isChatAllowed(chatId)
  const message = `🆔 Chat ID: \`${chatId}\`\nTracking: ${isAllowed ? '✅' : '❌'}`
  context.reply(message, { parse_mode: 'Markdown' })
})

// Handle any message to log chat info
bot.on('message', (context: Context) => {
  if (DEBUG_MODE) {
    logChatInfo(context)
  }
})

// Start the bot
async function startBot(): Promise<void> {
  try {
    await bot.launch({
      allowedUpdates: ['message', 'message_reaction', 'message_reaction_count'],
    })
    console.log('🚀 Bot started!')
    console.log(`📊 Tracking: ${TRACKED_EMOJIS.join(' ')}`)
    console.log(
      `🎯 Allowed chats: ${ALLOWED_CHATS.length > 0 || 'None configured'}`,
    )
  } catch (error) {
    console.error('❌ Error starting bot:', error)
  }
}

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

await startBot()
