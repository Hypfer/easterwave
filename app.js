import telegraf from "telegraf";
import Bouncer from "./Bouncer.js";

if (!process.env.BOT_TOKEN) {
    console.error("Missing BOT_TOKEN env variable");
    
    process.exit(1);
}

const uidWhitelist = process.env.UID_WHITELIST ? process.env.UID_WHITELIST.split(",") : [];

const bot = new telegraf.Telegraf(process.env.BOT_TOKEN);

const bouncer = new Bouncer();

bot.on("message", (ctx) => {
    let text;

    if (typeof ctx.update.message?.text === "string") {
        text = ctx.update.message.text;
    } else if (typeof ctx.update.message?.caption === "string") {
        text = ctx.update.message.caption;
    }
    
    if (uidWhitelist.includes(ctx.update.message?.from?.id?.toString())) {
        return;
    }

    if (!bouncer.check(text)) {
        try {
            console.log(`${new Date().toISOString()} - Deleting message with text "${text}"`);

            ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id)
        } catch(e) {
            console.warn(`${new Date().toISOString()} - Error while deleting message`, e);
        }
    }
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));