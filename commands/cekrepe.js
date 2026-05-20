import { isAllowed, checkCooldown } from './helpers.js';
import { getWhatsAppSock, isConnected } from '../whatsapp.js';
import { isRepeNumber, getVerificationPercentage, createRepeResultFile } from '../functions.js';
import fs from 'fs';

export default function registerCekrepe(bot) {
  bot.onText(/\/cekrepe/, async (msg) => {
    const chatId = msg.chat.id, userId = msg.from.id;
    if (!isAllowed(userId)) return bot.sendMessage(chatId, '❌ Belum terverifikasi.');
    const cd = checkCooldown(userId);
    if (!cd.allowed) return bot.sendMessage(chatId, `⏰ Tunggu ${cd.remaining} detik.`);
    if (!isConnected()) return bot.sendMessage(chatId, '❌ WhatsApp tidak terhubung.');

    const nums = msg.text.replace('/cekrepe','').trim().split(/[\s,\n]+/).filter(n=>n);
    if (!nums.length) return bot.sendMessage(chatId, '❌ Format: /cekrepe <nomor1> ... (max 300)');
    const valid = nums.slice(0,300).map(n=>{
      let c = n.replace(/\D/g,'');
      if (c.startsWith('0')) c = '62'+c.substring(1);
      else if (c.startsWith('8')) c = '62'+c;
      return c;
    }).filter(n=>n.length>=10&&n.length<=15);
    if (!valid.length) return bot.sendMessage(chatId, '❌ Tidak ada nomor valid.');

    const sock = getWhatsAppSock();
    let regRepe=[], notRegRepe=[], regNorm=[], notRegNorm=[];
    for (let i=0; i<valid.length; i+=20) {
      const batch = valid.slice(i,i+20);
      const results = await Promise.all(batch.map(async num => {
        try {
          const jid = num + '@s.whatsapp.net';
          const [wa] = await sock.onWhatsApp(jid);
          const exists = wa?.exists;
          const repe = isRepeNumber(num);
          if (exists) return repe ? {num, type:'regRepe'} : {num, type:'regNorm'};
          else return repe ? {num, type:'notRegRepe'} : {num, type:'notRegNorm'};
        } catch { return {num, type:'error'}; }
      }));
      results.forEach(r => {
        if (r.type==='regRepe') regRepe.push({number:r.num, percentage: getVerificationPercentage(r.num)});
        else if (r.type==='notRegRepe') notRegRepe.push(r.num);
        else if (r.type==='regNorm') regNorm.push(r.num);
        else if (r.type==='notRegNorm') notRegNorm.push(r.num);
      });
    }

    const file = createRepeResultFile(regRepe, notRegRepe, {registered:regNorm, notRegistered:notRegNorm});
    await bot.sendDocument(chatId, file, {
      caption: `<b>Hasil Cek Repe</b>\nTotal: ${valid.length}\nRepe Terdaftar: ${regRepe.length}\nRepe Tidak Terdaftar: ${notRegRepe.length}`,
      parse_mode:'HTML'
    });
    setTimeout(()=> fs.unlinkSync(file), 5000);
  });
}