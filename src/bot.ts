/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import moment from 'moment'
import { Telegraf, Context } from 'telegraf'
import xior from 'xior'

import { whitelabels } from './constants/whitelabels'
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
  '-1002878153211',
]

const DEBUG_MODE: boolean = true

// Initialize bot
const bot = new Telegraf(BOT_TOKEN)

const botInfo = await bot.telegram.getMe()
console.log('🤖 Bot Info:', botInfo.username)

// bot.telegram.getUpdates({ timeout: 1 }).then((updates) => {
//   if (updates.length > 0) {
//     const lastUpdateId = updates.at(-1).update_id
//     // bot.telegram.getUpdates({ offset: lastUpdateId + 1, timeout: 1 })
//     console.log(`Skipped ${updates.length} old updates`)
//   }
// })

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
    const merchant = whitelabels.find(
      (wl) => wl.id === parsed.merchant.toString(),
    )

    if (!whitelabels.some((wl) => wl.id === parsed.merchant.toString()))
      return console.error('Whitelabel not found.')

    const output = {
      messageOwnerUsername: context.messageReaction.user.username || 'unknown',
      reactionEmoji:
        context.messageReaction.new_reaction
          .map((r) => r.emoji)
          .filter(Boolean)
          .join(', ') || 'none',
      link: `https://t.me/c/${context.messageReaction.chat.id}/${context.messageReaction.message_id}`,
      reactorUsername: context.messageReaction.user.username || 'unknown',
      messageDate: new Date(context.messageReaction.date * 1000).toISOString(),
      messageId: context.messageReaction.message_id,
      whitelabel: {
        id: merchant?.id.toString(),
        name: merchant?.name,
      },
      title: messageContent.slice(0, 26) + '...',
      priority: 3,
      status: 1,
      description: messageContent,
    }

    xior
      .post('http://localhost:3000/stream/issue', output)
      .then(async (response) => {
        const closeButton = {
          text: 'Done✅',
          callback_data: `close_${response.data.issueId}`,
        }
        const skipButton = {
          text: 'Skip❌',
          callback_data: `skip_${response.data.issueId}`,
        }

        const keyboard = {
          inline_keyboard: [[skipButton, closeButton]],
        }

        const originalChatId = context.messageReaction.chat.id
        const originalMessageId = context.messageReaction.message_id
        const cleanChatId = String(originalChatId).replace('-100', '')

        const outputFormatted = `<u><b>New Ticket Created</b></u>
<b>ℹ️ID:</b> #${response.data.issueId}\n
<b>🔗Link:</b> <a href="https://t.me/c/${cleanChatId}/${originalMessageId}">View Message</a>
<b>🏢Whitelabel:</b> ${output.whitelabel.name} - merchant ${output.whitelabel.id}
<b>👤Reported by:</b> @${output.messageOwnerUsername}
<b>🗓️Date:</b> ${moment(output.messageDate).format('YYYY-MM-DD HH:mm:ss')}
<b>Status:</b> OPEN⌛
    `

        bot.telegram.sendMessage('-1002878153211', outputFormatted, {
          message_thread_id: 2,
          parse_mode: 'HTML',
          reply_markup: keyboard,
        })
      })
  } catch (error) {
    console.error('Error processing reaction:', error)
  }
})

// Command to get current chat ID
bot.command('chatid', (context: Context) => {
  const chatId = context.chat?.id?.toString()
  if (!chatId) return

  const isAllowed = isChatAllowed(chatId)
  const message = `🆔 Chat ID: \`${chatId}\`\nTracking: ${isAllowed ? '✅' : '❌'}\n${context?.message?.message_thread_id}`
  context.reply(message, { parse_mode: 'Markdown' })
})

// Handle any message to log chat info
bot.on('message', (context: Context) => {
  if (DEBUG_MODE) {
    logChatInfo(context)
  }
})

bot.on('callback_query', async (context: Context) => {
  const callbackData = context?.callbackQuery?.data
  const user = context?.callbackQuery?.from

  if (callbackData.startsWith('close_')) {
    const issueId = callbackData.split('_')[1]

    xior.post('http://localhost:3000/status', {
      status: 3,
      ticketId: issueId,
    })

    await context.answerCbQuery('Ticket is being closed...')

    const chatId = context.callbackQuery?.message?.chat.id
    const messageThreadId = context.callbackQuery?.message?.message_thread_id

    const outputFormatted = `<u><b>Ticket Closed</b></u>
<b>ℹ️ID:</b> #${issueId}\n
<b>👤Closed By:</b> @${user.username}
<b>🗓️Closed At:</b> ${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}
<b>Status:</b> CLOSED✅
    `

    await context.telegram.sendMessage(chatId, outputFormatted, {
      message_thread_id: messageThreadId,
      parse_mode: 'HTML',
    })
  }
  if (callbackData.startsWith('skip_')) {
    const issueId = callbackData.split('_')[1]

    xior.post('http://localhost:3000/status', {
      status: 4,
      ticketId: issueId,
    })

    await context.answerCbQuery('Ticket is being skipped...')

    const chatId = context.callbackQuery?.message?.chat.id
    const messageThreadId = context.callbackQuery?.message?.message_thread_id

    const outputFormatted = `<u><b>Ticket Skipped</b></u>
<b>ℹ️ID:</b> #${issueId}\n
<b>👤Skipped By:</b> @${user.username}
<b>🗓️Skipped At:</b> ${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}
<b>Status:</b> SKIPPED❌
    `

    await context.telegram.sendMessage(chatId, outputFormatted, {
      message_thread_id: messageThreadId,
      parse_mode: 'HTML',
    })
  }
})

// Start the bot
async function startBot(): Promise<void> {
  try {
    await bot.launch({
      allowedUpdates: [
        'message',
        'message_reaction',
        'message_reaction_count',
        'callback_query',
      ],
      dropPendingUpdates: true,
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
