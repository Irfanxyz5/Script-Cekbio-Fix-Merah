import { isAllowed } from './helpers.js';
import { allowedIds, saveAllowed } from '../database.js';
import { VERIFICATION_GROUP_ID } from '../config.js';

export default function registerCallbackHandler(bot) {
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    if (query.data === 'check_verification') {
      try {
        await bot.answerCallbackQuery(query.id);
        const member = await bot.getChatMember(VERIFICATION_GROUP_ID, userId);
        if (member.status === 'member' || member.status === 'administrator' || member.status === 'creator') {
          if (!allowedIds.includes(userId)) {
            allowedIds.push(userId);
            saveAllowed();
            await bot.sendMessage(chatId, '✅ Verifikasi berhasil! Sekarang Anda bisa menggunakan semua fitur.');
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: query.message.message_id });
          } else {
            await bot.sendMessage(chatId, '✅ Anda sudah terverifikasi sebelumnya.');
          }
        } else {
          await bot.sendMessage(chatId, '❌ Anda belum join grup verifikasi.');
        }
      } catch (error) {
        console.error('Error verifikasi:', error);
        await bot.sendMessage(chatId, '❌ Gagal verifikasi, coba lagi nanti.');
      }
    }
  });
}