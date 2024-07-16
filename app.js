import telegraf from "telegraf";
import LangHandler from "./handlers/lang/LangHandler.js";
import ModHandler from "./handlers/mod/ModHandler.js";
import FunHandler from "./handlers/fun/FunHandler.js";
import BadwordHandler from "./handlers/badword/BadwordHandler.js";

if (!process.env.BOT_TOKEN) {
    console.error("Missing BOT_TOKEN env variable");

    process.exit(1);
}

const uidWhitelist = process.env.UID_WHITELIST ? process.env.UID_WHITELIST.split(",") : [];
const bot = new telegraf.Telegraf(process.env.BOT_TOKEN);

const handlers = [
    new ModHandler({uidWhitelist: uidWhitelist}),
    new LangHandler({uidWhitelist: uidWhitelist}),
    new FunHandler({}),
    new BadwordHandler({uidWhitelist: uidWhitelist})
];

bot.on("message", (ctx) => {
    Promise.all(
        handlers.map(handler => handler.handleMessage(ctx))
    ).catch(err => {
        console.warn(`${new Date().toISOString()} - Error while handling message`, err);
    });
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
