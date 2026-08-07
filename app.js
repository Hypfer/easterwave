import telegraf from "telegraf";
import LangHandler from "./handlers/lang/LangHandler.js";
import ModHandler from "./handlers/mod/ModHandler.js";
import BadwordHandler from "./handlers/badword/BadwordHandler.js";
import UserHandler from "./handlers/user/UserHandler.js";
import NonsenseHandler from "./handlers/nonsense/NonsenseHandler.js";
import WeirdnessHandler from "./handlers/weirdness/WeirdnessHandler.js";
import EphemeralReplyHandler from "./handlers/ephemeral/EphemeralReplyHandler.js";
import UidHeadObserver from "./processors/uid/UidHeadObserver.js";
import TagPostProcessor from "./processors/tag/TagPostProcessor.js";
import HeadStore from "./util/HeadStore.js";
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
const uidNewDelta = parseInt(process.env.UID_NEW_DELTA) || 500_000;
const uidNewBaseline = parseInt(process.env.UID_NEW_ACCOUNT_BASELINE) || 8_963_604_127;
const bot = new telegraf.Telegraf(process.env.BOT_TOKEN);

const nonsenseCounter = new Counter();
const headStore = new HeadStore("./data", uidNewBaseline);

async function initializeBot() {
    const botInfo = await bot.telegram.getMe();
    console.log(`Starting bot: ${botInfo.first_name} (@${botInfo.username})`);

    const federation = await validateFederation(
        bot,
        parseFederationIds(process.env.FEDERATION)
    );

    const preProcessors = [
        new UidHeadObserver({headStore}),
    ];

    const moderationHandlers = [
        new EphemeralReplyHandler(botInfo.id),
        new UserHandler({uidWhitelist: uidWhitelist, nonsenseCounter: nonsenseCounter}),
        new ModHandler({uidWhitelist: uidWhitelist, federation: federation, nonsenseCounter: nonsenseCounter}),
        new LangHandler({uidWhitelist: uidWhitelist, nonsenseCounter: nonsenseCounter}),
        new BadwordHandler({uidWhitelist: uidWhitelist, nonsenseCounter: nonsenseCounter}),
        new WeirdnessHandler({}),
        new NonsenseHandler({nonsenseCounter: nonsenseCounter}),
    ];

    const postProcessors = [
        new TagPostProcessor({uidWhitelist, uidNewDelta}),
    ];

    // noinspection JSCheckFunctionSignatures
    bot.on(["message", "edited_message"], async (ctx) => {
        const metadata = {
            isEdit: !!ctx.update.edited_message,
            moderationActionTaken: false,
        };
        const envelope = {ctx, metadata};

        for (const preProcessor of preProcessors) {
            try {
                await preProcessor.preProcess(envelope);
            } catch (err) {
                const name = preProcessor.constructor.name || "UnknownPreProcessor";
                console.error(`${new Date().toISOString()} - Error in ${name}`, err);
            }
        }

        for (const handler of moderationHandlers) {
            try {
                const handled = await handler.handleMessage(envelope);

                if (handled) {
                    break;
                }
            } catch (err) {
                const handlerName = handler.constructor.name || "UnknownHandler";
                console.error(`${new Date().toISOString()} - Error in ${handlerName}`, err);

                // We intentionally don't return here.
                // If one handler crashes, we log it and let the next handlers in the chain try.
            }
        }

        // 3. Post-processors always run, regardless of whether moderation caught the message
        for (const postProcessor of postProcessors) {
            try {
                await postProcessor.postProcess(envelope);
            } catch (err) {
                const name = postProcessor.constructor.name || "UnknownPostProcessor";
                console.error(`${new Date().toISOString()} - Error in ${name}`, err);
            }
        }
    });

    await bot.launch();

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

initializeBot().catch(error => {
    console.error('Failed to initialize bot:', error);
    process.exit(1);
});
