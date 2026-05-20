import { isAllowed, checkCooldown } from './helpers.js';
import { getWhatsAppSock, isConnected } from '../whatsapp.js';
import fs from 'fs';

export default function registerCekrange(bot) {
  bot.onText(/\/cekrange/, async (msg) => {
    const chatId = msg.chat.id, userId = msg.from.id;
    if (!isAllowed(userId)) return bot.sendMessage(chatId, '❌ Belum terverifikasi.');
    const cd = checkCooldown(userId);
    if (!cd.allowed) return bot.sendMessage(chatId, `⏰ Tunggu ${cd.remaining} detik.`);
    if (!isConnected()) return bot.sendMessage(chatId, '❌ WhatsApp tidak terhubung.');

    const args = msg.text.replace('/cekrange','').trim().split(/\s+/);
    if (args.length < 3) return bot.sendMessage(chatId, '❌ Format: /cekrange <prefix> <start> <end> (max 300)');
    const prefix = args[0].replace(/\D/g,'');
    const start = parseInt(args[1]), end = parseInt(args[2]);
    if (isNaN(start) || isNaN(end) || start > end) return bot.sendMessage(chatId, '❌ Range tidak valid.');
    const range = end - start + 1;
    if (range > 300) return bot.sendMessage(chatId, `❌ Maksimal 300, kamu minta ${range}`);

    const numbers = [];
    for (let i=start; i<=end; i++) numbers.push('62' + prefix + i);
    const sock = getWhatsAppSock();
    let reg = [], notReg = [];
    for (let i=0; i<numbers.length; i+=20) {
      const batch = numbers.slice(i,i+20);
      const results = await Promise.all(batch.map(async num => {
        try {
          const jid = num + '@s.whatsapp.net';
          const [wa] = await sock.onWhatsApp(jid);
          return wa?.exists ? 'reg' : 'not';
        } catch { return 'not'; }
      }));
      results.forEach((r, idx) => {
        if (r === 'reg') reg.push(batch[idx]);
        else notReg.push(batch[idx]);
      });
    }

    let content = `Range: ${prefix}${start}-${end}\n\n✅ Terdaftar: ${reg.length}\n❌ Tidak Terdaftar: ${notReg.length}\n\n`;
    if (reg.length) content += 'Terdaftar:\n' + reg.join('\n') + '\n\n';
    if (notReg.length) content += 'Tidak Terdaftar:\n' + notReg.join('\n');
    const file = `range_${Date.now()}.txt`;
    fs.writeFileSync(file, content);
    await bot.sendDocument(chatId, file, { caption: `<b>Hasil Cek Range</b>`, parse_mode:'HTML' });
    setTimeout(()=> fs.unlinkSync(file), 5000);
  });
}