/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { eq, and, ne } from 'drizzle-orm'
import moment from 'moment'
import { Telegraf, Context } from 'telegraf'
import xior from 'xior'

import { db } from '@/db/database'
import { issues } from '@/db/schema'

import { whitelabels, whitelabelsById } from './constants/whitelabels'
import { parseSingleLinedMessage } from './utils/functions'
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
    old_reaction: any
    new_reaction: any
  }
}

// Configuration
const BOT_TOKEN =
  process.env.BOT_TOKEN || '8150617589:AAEnNAIxf-x8WK18sWnnJmYVVJWbH89SJBw'
const TRACKED_EMOJIS: string[] = ['🔥']

const pendingClosures = new Map()

const SEND_TO = process.env.SEND_TO || '-1002878153211'

const ALLOWED_CHATS: string[] = [process.env.CHAT_ID || '']

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

bot.on('message_reaction', async (context: any) => {
  const chat = context.chat
  const messageId = context.messageReaction.message_id
  const newReactions = context.messageReaction.new_reaction
  console.log(newReactions)

  // Return early if basic requirements aren't met
  if (!chat || !messageId) return

  // Check if this is an un-reaction (no new reactions or empty reactions)
  if (!newReactions || newReactions.length === 0) {
    if (DEBUG_MODE) {
      console.log('🚫 Message un-reacted, ignoring...')
    }
    return
  }

  // Check if any of the new reactions contain tracked emojis
  const hasTrackedEmoji = newReactions.some(
    (reaction: any) =>
      reaction.emoji && TRACKED_EMOJIS.includes(reaction.emoji),
  )

  if (!hasTrackedEmoji) {
    if (DEBUG_MODE) {
      console.log('🚫 No tracked emojis in reaction, ignoring...')
    }
    return
  }

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

    const parsed = parseSingleLinedMessage(messageContent)
    const merchant = whitelabels.find(
      (wl) => wl.id === parsed.merchant.toString(),
    )
    console.log(messageContent)

    console.log(parsed)

    if (!whitelabels.some((wl) => wl.id === parsed.merchant.toString()))
      return console.error('Whitelabel not found.')

    const originalChatId = context.messageReaction.chat.id
    const originalMessageId = context.messageReaction.message_id
    let cleanChatId = String(originalChatId)
    if (cleanChatId.startsWith('-100')) {
      cleanChatId = cleanChatId.slice(4)
    }
    const threadId = context.messageReaction.message_thread_id

    const messageLink = threadId
      ? `https://t.me/c/${cleanChatId}/${threadId}/${originalMessageId}`
      : `https://t.me/c/${cleanChatId}/${originalMessageId}`

    const output = {
      messageOwnerUsername: context.messageReaction.user.username || 'unknown',
      reactionEmoji:
        context.messageReaction.new_reaction
          .map((r: any) => r.emoji)
          .filter(Boolean)
          .join(', ') || 'none',
      link: messageLink,
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
        let cleanChatId = String(originalChatId)
        if (cleanChatId.startsWith('-100')) {
          cleanChatId = cleanChatId.slice(4) // Remove '-100' prefix
        }

        const threadId = context.messageReaction.message_thread_id

        const messageLink = threadId
          ? `https://t.me/c/${cleanChatId}/${threadId}/${originalMessageId}`
          : `https://t.me/c/${cleanChatId}/${originalMessageId}`

        const outputFormatted = `<u><b>New Ticket Created</b></u>
<b>ℹ️ID:</b> #${response.data.issueId}\n
<b>🔗Link:</b> <a href="${messageLink}">Message</a>
<b>🏢Whitelabel:</b> ${output.whitelabel.name} - merchant ${output.whitelabel.id}
<b>👤Reported by:</b> @${output.messageOwnerUsername}
<b>🗓️Date:</b> ${moment(output.messageDate).format('YYYY-MM-DD HH:mm:ss')}
<b>Status:</b> OPEN⌛
    `

        bot.telegram
          .sendMessage(SEND_TO, outputFormatted, {
            parse_mode: 'HTML',
            reply_markup: keyboard,
          })
          .then(async () => {
            let ticketQueueOutput = ``
            const issueList = await db
              .select()
              .from(issues)
              .where(
                and(eq(issues.status, 1), ne(issues.id, response.data.issueId)),
              )
            issueList.map((issue) => {
              ticketQueueOutput += `#${issue.id} WL ${whitelabelsById[Number(issue.whitelabelId)]} MERCHANT ${issue.whitelabelId}\n${issue.link}\n• ${moment(issue.createdAt).format('YYYY-MM-DD HH:mm:ss')}\n\n`
            })

            ticketQueueOutput += `#${response.data.issueId} WL ${output.whitelabel.name} MERCHANT ${output.whitelabel.id} (OPEN)\n${messageLink}\n• ${moment(output.messageDate).format('YYYY-MM-DD HH:mm:ss')}`

            bot.telegram.sendMessage(SEND_TO, ticketQueueOutput, {
              parse_mode: 'HTML',
            })
          })
      })
  } catch (error) {
    console.error('Error processing reaction:', error)
  }
})

bot.command('issues', async (context: Context) => {
  const chatId = context.chat?.id?.toString()
  if (!chatId) return

  let outputMessage = ``
  const issueList = await db.select().from(issues).where(eq(issues.status, 1))
  issueList.map((issue) => {
    outputMessage += `#${issue.id} WL ${whitelabelsById[Number(issue.whitelabelId)]} MERCHANT ${issue.whitelabelId}\n${issue.link}\n• ${moment(issue.createdAt).format('YYYY-MM-DD HH:mm:ss')}\n\n`
  })
  context.reply(
    outputMessage.length > 0 ? outputMessage : 'No ongoing issues!',
    { parse_mode: 'HTML' },
  )
})

bot.command('wl', (context: Context) => {
  const chatId = context.chat?.id?.toString()
  if (!chatId) return

  let outputMessage = `<b>Merchant - Whitelabel - Total Tickets</b>\n`
  whitelabels.map((wl) => {
    outputMessage += `${wl.id} - ${wl.name} - ${0}\n`
  })
  context.reply(outputMessage, { parse_mode: 'HTML' })
})

// Command to get current chat ID
bot.command('chatid', (context: Context) => {
  const chatId = context.chat?.id?.toString()
  if (!chatId) return

  const isAllowed = isChatAllowed(chatId)
  const message = `🆔 Chat ID: \`${chatId}\`\nTracking: ${isAllowed ? '✅' : '❌'}\n${context?.message?.message_thread_id}`
  context.reply(message, { parse_mode: 'Markdown' })
})

// Command to get current chat ID
bot.command('close', async (context: Context) => {
  const chatId = context.chat?.id?.toString()
  if (!chatId) return

  // Get the command arguments
  const arguments_ = (context.message as any)?.text?.split(' ') || []

  // Check if we have the required arguments: /close #TS1 link
  if (arguments_.length < 3) {
    await context.reply(
      'Usage: /close #ticketId messageLink\nExample: /close #TS1 https://t.me/c/...',
      { parse_mode: 'HTML' },
    )
    return
  }

  // Extract ticket ID and message link
  let ticketIdArgument = arguments_[1]
  const messageLink = arguments_[2]

  // Remove the # if present
  if (ticketIdArgument.startsWith('#')) {
    ticketIdArgument = ticketIdArgument.slice(1)
  }

  const ticketId = ticketIdArgument

  try {
    const existingTicket = await db
      .select()
      .from(issues)
      .where(eq(issues.id, ticketId.toString()))
      .limit(1)

    if (existingTicket.length === 0) {
      await context.reply(`Ticket #${ticketId} not found.`)
      return
    }

    if (existingTicket[0].status !== 1) {
      await context.reply(
        `Ticket #${ticketId} is not open (current status: ${existingTicket[0].status}).`,
      )
      return
    }

    // Close the ticket
    await xior.post('http://localhost:3000/status', {
      status: 3,
      ticketId: ticketId,
      messageLink: messageLink,
    })

    const user = context.from

    const outputFormatted = `<u><b>Ticket Closed</b></u>
<b>ℹ️ID:</b> #${ticketId}

<b>👤Closed By:</b> @${user?.username || 'unknown'}
<b>🗓️Closed At:</b> ${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}
<b>🔗Link:</b> ${messageLink}
<b>Status:</b> CLOSED✅`

    await context.reply(outputFormatted, { parse_mode: 'HTML' })

    // Send updated queue to the main channel
    let ticketQueueOutput = ``
    const issueList = await db.select().from(issues).where(eq(issues.status, 1))

    issueList.map((issue) => {
      ticketQueueOutput += `#${issue.id} WL ${whitelabelsById[Number(issue.whitelabelId)]} MERCHANT ${issue.whitelabelId}\n${issue.link}\n• ${moment(issue.createdAt).format('YYYY-MM-DD HH:mm:ss')}\n\n`
    })

    ticketQueueOutput += `#${existingTicket[0].id} WL ${whitelabelsById[Number(existingTicket[0].whitelabelId)]} MERCHANT ${existingTicket[0].whitelabelId} (CLOSED)\n${existingTicket[0].link}\n• ${moment(existingTicket[0].createdAt).format('YYYY-MM-DD HH:mm:ss')}`

    bot.telegram.sendMessage(SEND_TO, ticketQueueOutput, {
      parse_mode: 'HTML',
    })
  } catch (error) {
    console.error('Error closing ticket:', error)
    await context.reply(`Error closing ticket #${ticketId}. Please try again.`)
  }
})

// Handle any message to log chat info
bot.on('message', async (context: Context) => {
  const message = context.message as any

  // Check if this is a reply to our message link prompt
  if (message?.reply_to_message && message.text) {
    const replyText = message.reply_to_message.text

    // Check if the replied message is asking for a message link
    if (replyText?.includes('Please enter the message link for ticket')) {
      const userId = message.from.id

      // Retrieve the pending closure info
      const pendingClosure = pendingClosures.get(userId)

      if (pendingClosure) {
        const { issueId, user, chatId, messageThreadId } = pendingClosure
        const messageLink = message.text

        console.log(messageLink)

        // Now close the ticket with the message link
        xior.post('http://localhost:3000/status', {
          status: 3,
          ticketId: issueId,
          messageLink: messageLink, // Include the message link in your API call
        })

        const outputFormatted = `<u><b>Ticket Closed</b></u>\n<b>ℹ️ID:</b> #${issueId}\n\n<b>👤Closed By:</b> @${user.username}\n<b>🗓️Closed At:</b> ${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')} <b>\n🔗Link:</b> ${messageLink}\n<b>Status:</b> CLOSED✅`

        await context.telegram.sendMessage(chatId, outputFormatted, {
          message_thread_id: messageThreadId,
          parse_mode: 'HTML',
        })

        // Clean up the pending closure
        pendingClosures.delete(userId)

        // Delete the user's reply message
        try {
          await context.deleteMessage()
          const currentIssue: {
            id: string
            title: string
            description: string
            link: string
            status: number
            whitelabelId: string
            categoryId: string | null
            reporterId: string
            assigneeId: string | null
            priority: number
            createdAt: Date
            updatedAt: Date
            finishedAt: Date | null
          }[] = await db
            .select()
            .from(issues)
            .where(eq(issues.id, issueId))
            .limit(1)
          let ticketQueueOutput = ``
          const issueList = await db
            .select()
            .from(issues)
            .where(eq(issues.status, 1))
          issueList.map((issue) => {
            ticketQueueOutput += `#${issue.id}. WL ${whitelabelsById[Number(issue.whitelabelId)]} MERCHANT ${issue.whitelabelId}\n${issue.link}\n• ${moment(issue.createdAt).format('YYYY-MM-DD HH:mm:ss')}\n\n`
          })

          ticketQueueOutput += `#${currentIssue[0].id} WL ${whitelabelsById[Number(currentIssue[0].whitelabelId)]} MERCHANT ${currentIssue[0].whitelabelId} (CLOSED)\n${currentIssue[0].link}\n• ${moment(currentIssue[0].createdAt).format('YYYY-MM-DD HH:mm:ss')}`

          bot.telegram.sendMessage(SEND_TO, ticketQueueOutput, {
            parse_mode: 'HTML',
          })
        } catch (error) {
          console.error('Failed to delete user reply:', error)
        }

        // Delete the bot's prompt message
        try {
          await context.telegram.deleteMessage(
            chatId,
            message.reply_to_message.message_id,
          )
        } catch (error) {
          console.error('Failed to delete bot prompt message:', error)
        }
      }
    }
  }
})

bot.on('callback_query', async (context: Context) => {
  const callbackData = (context?.callbackQuery as any)?.data
  const user = context?.callbackQuery?.from

  if (callbackData.startsWith('close_')) {
    const issueId = callbackData.split('_')[1]

    await context.editMessageReplyMarkup({
      // @ts-expect-error Object literal may only specify known properties
      reply_markup: { inline_keyboard: [] },
    })

    await context.answerCbQuery('Please enter the message link...')

    // Send a prompt message asking for the message link
    const chatId = context.callbackQuery?.message?.chat.id
    const messageThreadId = (context.callbackQuery?.message as any)
      ?.message_thread_id

    await context.telegram.sendMessage(
      chatId as unknown as string,
      `Please enter the message link for ticket #${issueId}:`,
      {
        message_thread_id: messageThreadId,
        reply_markup: {
          force_reply: true,
          input_field_placeholder: 'Enter message link here...',
        },
      },
    )

    // Store the issueId and user info for later use
    // You'll need to implement a way to track this state
    // For example, using a Map or database to store pending closures
    pendingClosures.set(user?.id, { issueId, user, chatId, messageThreadId })
    return
  }

  if (callbackData.startsWith('skip_')) {
    const issueId = callbackData.split('_')[1]

    await context.editMessageReplyMarkup({
      // @ts-expect-error Object literal may only specify known properties
      reply_markup: { inline_keyboard: [] },
    })

    xior.post('http://localhost:3000/status', {
      status: 4,
      ticketId: issueId,
    })

    await context.answerCbQuery('Ticket is being skipped...')

    const chatId = context.callbackQuery?.message?.chat.id
    const messageThreadId = (context.callbackQuery?.message as any)
      ?.message_thread_id

    const outputFormatted = `<u><b>Ticket Skipped</b></u> <b>ℹ️ID:</b> #${issueId}\n <b>👤Skipped By:</b> @${user?.username} <b>🗓️Skipped At:</b> ${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')} <b>Status:</b> SKIPPED❌`

    await context.telegram.sendMessage(
      chatId as unknown as any,
      outputFormatted,
      {
        message_thread_id: messageThreadId,
        parse_mode: 'HTML',
      },
    )
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
