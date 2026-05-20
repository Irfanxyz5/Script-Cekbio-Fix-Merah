import { isAllowed, isAdmin, isOwner } from './helpers.js';
import { getUser } from '../database.js';
import { GROUP_LINK } from '../config.js';

export default function registerStart(bot) {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id, userId = msg.from.id;
    const user = getUser(userId);
    let text = `╭───── ⧼ 𝑰 𝒏 𝒇 𝒐 - 𝑩 𝒐 𝒕 𝒔 ⧽\n│ᴄʀᴇᴀᴛᴏʀ : @Zallgtng X ℌ𝔞𝔫𝔵𝔵𝔠𝔬𝔬𝔩\n│ᴠᴇʀsɪ : ᴠ13.0\n│ᴛʏᴘᴇ : Case\n╰─────\n`;
    text += `╭───── ⧼ 𝑺 𝒕 𝒂 𝒕 𝒖 𝒔 - 𝑼 𝒔 𝒆 𝒓 ⧽\n┃ <b>Owner</b> : ${isOwner(userId)?'✅':'❌'}\n┃ <b>Admin</b> : ${isAdmin(userId)&&!isOwner(userId)?'✅':'❌'}\n┃ <b>Premium</b> : ${user.status==='premium'?'✅':'❌'}\n╰─────\n ═══════════[ 𝙈𝙀𝙉𝙐 ]═══════════\n\n`;
    if (isAllowed(userId)) {
      text += `┃ /cekbio (nomor)\n┃ /cekbiofile (reply file)\n┃ /banding (nomor)\n┃ /ceknomorterdaftar\n┃ /cekrange\n┃ /cekrepe\n┃ /fix (nomor)\n\n`;
      if (isAdmin(userId)) {
        text += `══════════[ 𝘼𝘿𝙈𝙄𝙉 ]══════════\n┃ /addkacung\n┃ /addallkacung\n┃ /listkacung\n\n`;
        if (isOwner(userId)) {
          text += `══════════[ 𝙊𝙒𝙉𝙀𝙍 ]══════════\n┃ /delkacung\n┃ /addadmin\n┃ /unadmin\n┃ /listadmin\n┃ /getqr\n┃ /getpairing\n┃ /backup\n┃ /installnpm\n┃ /addgmail\n┃ /delgmail\n┃ /listgmail\n┃ /addlimit\n┃ /dellimit\n┃ /listlimit\n\n`;
        }
      }
    } else text += `❌ Belum terverifikasi!\nJoin grup: ${GROUP_LINK}`;
    text += `JANGAN LUPA SHOLAT 💌\n\n© ℌ𝔞𝔫𝔵𝔵𝔠𝔬𝔬𝔩`;

    const kb = [];
    if (!isAllowed(userId)) kb.push([{text:"✅ Join", url:GROUP_LINK}], [{text:"🔍 Cek Verifikasi", callback_data:"check_verification"}]);
    const tmp = await bot.sendMessage(chatId, '🔄 Memuat...');
    try {
      await bot.editMessageText(text, { chat_id:chatId, message_id:tmp.message_id, parse_mode:'HTML', reply_markup:kb.length?{inline_keyboard:kb}:undefined });
    } catch(e) {
      await bot.sendMessage(chatId, text, { parse_mode:'HTML', reply_markup:kb.length?{inline_keyboard:kb}:undefined });
    }
  });
}