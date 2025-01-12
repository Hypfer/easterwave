import Handler from "../Handler.js";

/*
    El cheapo mod commands. Might be improved in the future. Might also forever stay like this
 */

const MOD_COMMAND_REGEX = /!(?<command>mute|ban|pmute|pban|smute|sban)\s+(?<duration>\d+)\s*(?<multiplier>[hdwmy]?)/;

class ModHandler extends Handler {
    /**
     *
     * @param {object} options
     * @param {Array<string>} options.uidWhitelist
     * @param {import("../util/Counter")} options.nonsenseCounter
     */
    constructor(options) {
        super();

        this.uidWhitelist = options.uidWhitelist;
        this.nonsenseCounter = options.nonsenseCounter;
    }

    async handleMessage(ctx) {
        const message = ctx.update.message || ctx.update.edited_message;

        if (
            (message?.from?.id?.toString() !== undefined && this.uidWhitelist.includes(message.from.id.toString())) &&
            typeof message?.text === "string" && message.reply_to_message?.from?.id !== undefined
        ) {
            const match = MOD_COMMAND_REGEX.exec(message.text);

            if (match) {
                let multiplier;
                switch (match.groups.multiplier) {
                    case "h":
                        multiplier = 60 * 60;
                        break;
                    case "d":
                        multiplier = 60 * 60 * 24;
                        break;
                    case "w":
                        multiplier = 60 * 60 * 24 * 7;
                        break;
                    case "m":
                        multiplier = 60 * 60 * 24 * 30;
                        break;
                    case "y":
                        multiplier = 60 * 60 * 24 * 365;
                        break;
                    default:
                        multiplier = 60;
                }

                const duration = parseInt(match.groups.duration) * multiplier;


                try {
                    switch(match.groups.command) {
                        case "mute":
                            await ctx.tg.restrictChatMember(
                                ctx.chat.id,
                                message.reply_to_message.from.id,
                                {
                                    until_date: Math.floor(Date.now()/1000) + duration
                                }
                            );

                            await ctx.tg.setMessageReaction(
                                ctx.chat.id,
                                message.message_id,
                                [{type: "emoji", emoji: "🫡"}],
                                false
                            );

                            this.nonsenseCounter.increment();
                            break;
                        case "ban":
                            await ctx.tg.banChatMember(
                                ctx.chat.id,
                                message.reply_to_message.from.id,
                                Math.floor(Date.now()/1000) + duration
                            );

                            await ctx.tg.setMessageReaction(
                                ctx.chat.id,
                                message.message_id,
                                [{type: "emoji", emoji: "🫡"}],
                                false
                            );

                            this.nonsenseCounter.increment();
                            break;
                        case "pmute":
                            await ctx.tg.restrictChatMember(
                                ctx.chat.id,
                                message.reply_to_message.from.id,
                                {
                                    until_date: Math.floor(Date.now()/1000) + duration
                                }
                            );

                            await ctx.tg.deleteMessage(ctx.chat.id, message.reply_to_message.message_id)
                            await ctx.tg.deleteMessage(ctx.chat.id, message.message_id)

                            this.nonsenseCounter.increment();
                            break;
                        case "pban": //purgeban
                            await ctx.tg.banChatMember(
                                ctx.chat.id,
                                message.reply_to_message.from.id,
                                Math.floor(Date.now()/1000) + duration
                            );

                            await ctx.tg.deleteMessage(ctx.chat.id, message.reply_to_message.message_id)
                            await ctx.tg.deleteMessage(ctx.chat.id, message.message_id)

                            this.nonsenseCounter.increment();
                            break;
                        case "smute":
                            await ctx.tg.restrictChatMember(
                                ctx.chat.id,
                                message.reply_to_message.from.id,
                                {
                                    until_date: Math.floor(Date.now()/1000) + duration
                                }
                            );

                            await ctx.tg.deleteMessage(ctx.chat.id, message.message_id)

                            this.nonsenseCounter.increment();
                            break;
                        case "sban":
                            await ctx.tg.banChatMember(
                                ctx.chat.id,
                                message.reply_to_message.from.id,
                                Math.floor(Date.now()/1000) + duration
                            );

                            await ctx.tg.deleteMessage(ctx.chat.id, message.message_id)

                            this.nonsenseCounter.increment();
                            break;
                    }
                } catch(e) {
                    console.warn(`${new Date().toISOString()} - Error while executing mod command`, e);
                }
            } else if (message.text.includes("!kick")) {
                try {
                    await ctx.tg.banChatMember(
                        ctx.chat.id,
                        message.reply_to_message.from.id,
                        Math.floor(Date.now()/1000) + 60 // If for whatever reason the unban fails, it should expire after a minute
                    );

                    await ctx.tg.unbanChatMember(
                        ctx.chat.id,
                        message.reply_to_message.from.id
                    );

                    await ctx.tg.setMessageReaction(
                        ctx.chat.id,
                        message.message_id,
                        [{type: "emoji", emoji: "🫡"}],
                        false
                    );

                    this.nonsenseCounter.increment();
                } catch(e) {
                    console.warn(`${new Date().toISOString()} - Error while executing mod command`, e);
                }
            } else if (message.text.includes("!pkick")) {
                try {
                    await ctx.tg.banChatMember(
                        ctx.chat.id,
                        message.reply_to_message.from.id,
                        Math.floor(Date.now() / 1000) + 60 // If for whatever reason the unban fails, it should expire after a minute
                    );

                    await ctx.tg.unbanChatMember(
                        ctx.chat.id,
                        message.reply_to_message.from.id
                    );

                    await ctx.tg.deleteMessage(ctx.chat.id, message.reply_to_message.message_id)
                    await ctx.tg.deleteMessage(ctx.chat.id, message.message_id)

                    this.nonsenseCounter.increment();
                } catch (e) {
                    console.warn(`${new Date().toISOString()} - Error while executing mod command`, e);
                }
            }
        }
    }
}

export default ModHandler;
