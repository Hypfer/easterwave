const telegraf = require("telegraf");
const TinyLDClassifier = require("./classifiers/TinyLDClassifier");
const LanguageDetectClassifier = require("./classifiers/LanguageDetectClassifier");
const LandeClassifier = require("./classifiers/LandeClassifier");

if (!process.env.BOT_TOKEN) {
    console.error("Missing BOT_TOKEN env variable");
    
    process.exit(1);
}

const uidWhitelist = process.env.UID_WHITELIST ? process.env.UID_WHITELIST.split(",") : [];

const bot = new telegraf.Telegraf(process.env.BOT_TOKEN);
const classifiers = [
    new TinyLDClassifier(),
    new LanguageDetectClassifier(),
    new LandeClassifier()
]

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
    
    if (text !== undefined && text.length >= 10) {
        const hits = classifiers.map((classifier) => {
            return classifier.isEnglish(text);
        }).filter(e => e === true);
        
        if (hits.length < classifiers.length / 2) {
            try {
                console.log(`Deleting message with text "${text}"`);
                
                ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id)
            } catch(e) {
                console.warn("Error while deleting message", e);
            }
        }
    }
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));