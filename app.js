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

const parseFederationIds = (envVar) => {
    if (!envVar) return [];

    return envVar.split(",")
        .map(id => parseInt(id.trim()))
        .filter(id => {
            const valid = !isNaN(id) && id !== 0;
            if (!valid) console.warn(`Invalid federation ID found: ${id}`);
            return valid;
        });
};

const validateFederation = async (bot, federationIds) => {
    if (federationIds.length === 0) {
        console.log('\nNo federation configured.');
        return federationIds;
    }

    console.log('\nValidating federation configuration...');

    const results = await Promise.allSettled(
        federationIds.map(async (chatId) => {
            try {
                const chat = await bot.telegram.getChat(chatId);
                return {
                    chatId,
                    name: chat.title,
                    type: chat.type,
                    accessible: true
                };
            } catch (e) {
                return {
                    chatId,
                    error: e.message,
                    accessible: false
                };
            }
        })
    );

    console.log('\nFederation status:');
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.accessible) {
            console.log(`✅  ${result.value.chatId}: ${result.value.name} (${result.value.type})`);
        } else {
            console.log(`❌  ${result.value.chatId}: Not accessible - ${result.value.error}`);
        }
    });
    console.log(''); // Empty line for readability

    const accessibleCount = results.filter(r => r.status === 'fulfilled' && r.value.accessible).length;
    if (accessibleCount < federationIds.length) {
        console.warn(`⚠️  Warning: Only ${accessibleCount} out of ${federationIds.length} federation chats are accessible`);
    }

    return federationIds;
};

const uidWhitelist = process.env.UID_WHITELIST ? process.env.UID_WHITELIST.split(",") : [];
const bot = new telegraf.Telegraf(process.env.BOT_TOKEN);

const nonsenseCounter = new Counter();

// Initialize federation and handlers
async function initializeBot() {
    const federation = await validateFederation(
        bot,
        parseFederationIds(process.env.FEDERATION)
    );

    const handlers = [
        new UserHandler({uidWhitelist: uidWhitelist, nonsenseCounter: nonsenseCounter}),
        new ModHandler({uidWhitelist: uidWhitelist, federation: federation, nonsenseCounter: nonsenseCounter}),
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
}

// Start the bot
initializeBot().catch(error => {
    console.error('Failed to initialize bot:', error);
    process.exit(1);
});