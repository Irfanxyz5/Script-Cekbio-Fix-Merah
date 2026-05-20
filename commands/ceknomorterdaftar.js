import { isAllowed, checkCooldown } from './helpers.js';
import { getWhatsAppSock, isConnected } from '../whatsapp.js';
import fs from 'fs';

export default function registerCeknomorterdaftar(bot) {
  bot.onText(/\/ceknomorterdaftar/, async (msg) => {
    const chatId = msg.chat.id, userId = msg.from.id;
    if (!isAllowed(userId)) return bot.sendMessage(chatId, '❌ Belum terverifikasi.');
    const cd = checkCooldown(userId);
    if (!cd.allowed) return bot.sendMessage(chatId, `⏰ Tunggu ${cd.remaining} detik.`);
    if (!isConnected()) return bot.sendMessage(chatId, '❌ WhatsApp tidak terhubung.');

    const nums = msg.text.replace('/ceknomorterdaftar','').trim().split(/[\s,\n]+/).filter(n=>n);
    if (!nums.length) return bot.sendMessage(chatId, '❌ Format: /ceknomorterdaftar <nomor1> ... (max 300)');
    const valid = nums.slice(0,300).map(n=>{
      let c = n.replace(/\D/g,'');
      if (c.startsWith('0')) c = '62'+c.substring(1);
      else if (c.startsWith('8')) c = '62'+c;
      return c;
    }).filter(n=>n.length>=10&&n.length<=15);
    if (!valid.length) return bot.sendMessage(chatId, '❌ Tidak ada nomor valid.');

    const sock = getWhatsAppSock();
    let registered = [], notRegistered = [];
    for (let i=0; i<valid.length; i+=20) {
      const batch = valid.slice(i,i+20);
      const results = await Promise.all(batch.map(async num => {
        try {
          const jid = num + '@s.whatsapp.net';
          const [wa] = await sock.onWhatsApp(jid);
          return wa?.exists ? 'reg' : 'not';
        } catch { return 'not'; }
      }));
      results.forEach((r, idx) => {
        if (r === 'reg') registered.push(batch[idx]);
        else notRegistered.push(batch[idx]);
      });
    }

    let content = `Hasil Cek Status\n\n✅ Terdaftar: ${registered.length}\n❌ Tidak Terdaftar: ${notRegistered.length}\n\n`;
    if (registered.length) content += 'Terdaftar:\n' + registered.join('\n') + '\n\n';
    if (notRegistered.length) content += 'Tidak Terdaftar:\n' + notRegistered.join('\n');
    const file = `status_${Date.now()}.txt`;
    fs.writeFileSync(file, content);
    await bot.sendDocument(chatId, file, { caption: `<b>Hasil Cek Status</b>`, parse_mode:'HTML' });
    setTimeout(()=> fs.unlinkSync(file), 5000);
  });
}