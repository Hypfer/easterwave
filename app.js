import telegraf from "telegraf";
import LangHandler from "./handlers/lang/LangHandler.js";
import ModHandler from "./handlers/mod/ModHandler.js";
import FunHandler from "./handlers/fun/FunHandler.js";
import BadwordHandler from "./handlers/badword/BadwordHandler.js";
import UserHandler from "./handlers/user/UserHandler.js";
import NonsenseHandler from "./handlers/nonsense/NonsenseHandler.js";
import Counter from "./util/Counter.js";

if (!process.env.BOT_TOKEN) {
    console.error("Missing BOT_TOKEN env variable");

    process.exit(1);
}

const uidWhitelist = process.env.UID_WHITELIST ? process.env.UID_WHITELIST.split(",") : [];
const bot = new telegraf.Telegraf(process.env.BOT_TOKEN);

const nonsenseCounter = new Counter();

const handlers = [
    new UserHandler({uidWhitelist: uidWhitelist, nonsenseCounter: nonsenseCounter}),
    new ModHandler({uidWhitelist: uidWhitelist, nonsenseCounter: nonsenseCounter}),
    new LangHandler({uidWhitelist: uidWhitelist, nonsenseCounter: nonsenseCounter}),
    new FunHandler({nonsenseCounter: nonsenseCounter}),
    new BadwordHandler({uidWhitelist: uidWhitelist, nonsenseCounter: nonsenseCounter}),
    new NonsenseHandler({nonsenseCounter: nonsenseCounter})
];

// noinspection JSCheckFunctionSignatures
bot.on(["message", "edited_message"], (ctx) => {
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
