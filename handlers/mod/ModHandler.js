import Handler from "../Handler.js";
import {sleep} from "../../util/tools.js";

const MOD_COMMAND_REGEX = /!(?<command>mute|ban|pmute|pban|smute|sban)\s+(?<duration>\d+)\s*(?<multiplier>[hdwmy]?)/;

const TIME_MULTIPLIERS = {
    h: 60 * 60,
    d: 60 * 60 * 24,
    w: 60 * 60 * 24 * 7,
    m: 60 * 60 * 24 * 30,
    y: 60 * 60 * 24 * 365,
    '': 60 // default to minutes
};

const COMMANDS = {
    mute: {
        action: 'restrict',
        federated: true,
        deleteCommand: false,
        deleteTarget: false
    },
    ban: {
        action: 'ban',
        federated: true,
        deleteCommand: false,
        deleteTarget: false
    },
    pmute: {
        action: 'restrict',
        federated: true,
        deleteCommand: true,
        deleteTarget: true
    },
    pban: {
        action: 'ban',
        federated: true,
        deleteCommand: true,
        deleteTarget: true
    },
    smute: {
        action: 'restrict',
        federated: true,
        deleteCommand: true,
        deleteTarget: false
    },
    sban: {
        action: 'ban',
        federated: true,
        deleteCommand: true,
        deleteTarget: false
    }
};

class ModHandler extends Handler {
    /**
     * @param {object} options
     * @param {Array<string>} options.uidWhitelist
     * @param {Array<number>} options.federation
     * @param {import("../util/Counter")} options.nonsenseCounter
     */
    constructor(options) {
        super();
        this.uidWhitelist = options.uidWhitelist;
        this.federation = options.federation;
        this.nonsenseCounter = options.nonsenseCounter;
    }

    async restrictMember(ctx, chatId, userId, duration) {
        return ctx.tg.restrictChatMember(
            chatId,
            userId,
            {
                until_date: Math.floor(Date.now()/1000) + duration
            }
        );
    }

    async banMember(ctx, chatId, userId, duration) {
        return ctx.tg.banChatMember(
            chatId,
            userId,
            Math.floor(Date.now()/1000) + duration
        );
    }

    async handleKick(ctx, message, deleteCommand, deleteTarget) {
        try {
            await ctx.tg.banChatMember(
                ctx.chat.id,
                message.reply_to_message.from.id,
                Math.floor(Date.now()/1000) + 60  // If for whatever reason the unban fails, it should expire after a minute
            );

            await ctx.tg.unbanChatMember(
                ctx.chat.id,
                message.reply_to_message.from.id
            );

            if (deleteTarget) {
                await ctx.tg.deleteMessage(ctx.chat.id, message.reply_to_message.message_id);
            }

            if (deleteCommand) {
                await ctx.tg.deleteMessage(ctx.chat.id, message.message_id);
            } else {
                await ctx.tg.setMessageReaction(
                    ctx.chat.id,
                    message.message_id,
                    [{type: "emoji", emoji: "🫡"}],
                    false
                );
            }

            this.nonsenseCounter.increment();
        } catch(e) {
            console.warn(`${new Date().toISOString()} - Error while executing kick command`, e);
        }
    }

    async executeModCommand(ctx, message, command, duration) {
        const commandConfig = COMMANDS[command];
        const actionFunc = commandConfig.action === 'restrict' ? this.restrictMember : this.banMember;

        try {
            await actionFunc.call(
                this,
                ctx,
                ctx.chat.id,
                message.reply_to_message.from.id,
                duration
            );

            if (commandConfig.deleteTarget) {
                await ctx.tg.deleteMessage(ctx.chat.id, message.reply_to_message.message_id);
            }

            if (commandConfig.deleteCommand) {
                await ctx.tg.deleteMessage(ctx.chat.id, message.message_id);
            } else {
                await ctx.tg.setMessageReaction(
                    ctx.chat.id,
                    message.message_id,
                    [{type: "emoji", emoji: "🫡"}],
                    false
                );
            }

            this.nonsenseCounter.increment();

            if (commandConfig.federated) {
                for (const fedId of this.federation.filter(fedId => fedId !== ctx.chat.id)) {
                    try {
                        await actionFunc(ctx, fedId, message.reply_to_message.from.id, duration);
                        await sleep(1000);
                    } catch (e) {
                        console.warn(
                            `${new Date().toISOString()} - Federation action failed for ${fedId}:`,
                            e
                        );
                    }
                }
            }
        } catch(e) {
            console.warn(`${new Date().toISOString()} - Error while executing mod command`, e);
        }
    }

    async handleMessage(ctx) {
        const message = ctx.update.message || ctx.update.edited_message;

        if (
            !(message?.from?.id?.toString() !== undefined &&
                this.uidWhitelist.includes(message.from.id.toString()) &&
                typeof message?.text === "string" &&
                message.reply_to_message?.from?.id !== undefined)
        ) {
            return;
        }

        const match = MOD_COMMAND_REGEX.exec(message.text);

        if (match) {
            const multiplier = TIME_MULTIPLIERS[match.groups.multiplier] || TIME_MULTIPLIERS[''];
            const duration = parseInt(match.groups.duration) * multiplier;

            await this.executeModCommand(ctx, message, match.groups.command, duration);
        } else if (message.text.includes("!kick")) {
            await this.handleKick(ctx, message, false, false);
        } else if (message.text.includes("!pkick")) {
            await this.handleKick(ctx, message, true, true);
        } else if (message.text.includes("!skick")) {
            await this.handleKick(ctx, message, true, false)
        }
    }
}

export default ModHandler;
