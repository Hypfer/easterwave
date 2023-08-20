const telegraf = require("telegraf");
const tinyLD = require("tinyld");

if (!process.env.BOT_TOKEN) {
    console.error("Missing BOT_TOKEN env variable");
    
    process.exit(1);
}

const bot = new telegraf.Telegraf(process.env.BOT_TOKEN);

bot.on("message", (ctx) => {
    let text;

    if (typeof ctx.update.message?.text === "string") {
        text = ctx.update.message.text;
    } else if (typeof ctx.update.message?.caption === "string") {
        text = ctx.update.message.caption;
    }
    
    if (text !== undefined && text.length >= 10) {
        const classification = tinyLD.detectAll(text);
        
        if (classification.filter(e => e.accuracy > 0.70).length > 0) {
            const english = classification.find(e => e.lang === "en");

            if (!english || (english && english.accuracy < 0.35)) {
                try {
                    console.log(`Deleting message with text "${text}"`);
                    
                    ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id)
                } catch(e) {
                    console.warn("Error while deleting message", e);
                }
            }
        }
    }
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));