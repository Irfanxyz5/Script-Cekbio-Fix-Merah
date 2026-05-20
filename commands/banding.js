import { isAllowed, checkCooldown } from './helpers.js';
import { getRandomName, getRandomAppealMessage, getVerificationPercentage } from '../functions.js';
import { WHATSAPP_EMAIL } from '../config.js';

export default function registerBanding(bot) {
  bot.onText(/\/banding/, async (msg) => {
    const chatId = msg.chat.id, userId = msg.from.id;
    if (!isAllowed(userId)) return bot.sendMessage(chatId, '❌ Belum terverifikasi.');
    const cd = checkCooldown(userId);
    if (!cd.allowed) return bot.sendMessage(chatId, `⏰ Tunggu ${cd.remaining} detik.`);
    const args = msg.text.replace('/banding','').trim().split(/\s+/);
    if (!args[0]) return bot.sendMessage(chatId, '❌ Format: /banding <nomor>');
    let number = args[0].replace(/[^0-9+]/g,'');
    if (number.startsWith('0')) number = '62' + number.substring(1);
    else if (number.startsWith('8')) number = '62' + number;

    const name = getRandomName();
    const appeal = getRandomAppealMessage(name, number);
    const percent = getVerificationPercentage(number);
    const text = `<b>Hasil Banding</b>\n📱 Nomor: +${number}\n👤 Nama: ${name}\n📊 Verifikasi: ${percent}%\n\n📝 <b>Pesan:</b>\n${appeal}\n\n📧 Email: ${WHATSAPP_EMAIL}`;
    await bot.sendMessage(chatId, text, { parse_mode:'HTML' });
  });
}