import Handler from "../Handler.js";

/*
    El cheapo mod commands. Might be improved in the future. Might also forever stay like this
 */

const MOD_COMMAND_REGEX = /!(?<command>mute|ban)\s+(?<duration>\d+)\s*(?<multiplier>[hdwmy])/;

class ModHandler extends Handler {
    /**
     *
     * @param {object} options
     * @param {Array<number>} options.uidWhitelist
     */
    constructor(options) {
        super();

        this.uidWhitelist = options.uidWhitelist;
    }

    async handleMessage(ctx) {
        if (
            (ctx.update.message?.from?.id?.toString() !== undefined && this.uidWhitelist.includes(ctx.update.message?.from.id.toString())) &&
            typeof ctx.update.message?.text === "string" && ctx.update.message.reply_to_message?.from?.id !== undefined
        ) {
            const match = MOD_COMMAND_REGEX.exec(ctx.update.message.text);

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
                }

                const duration = parseInt(match.groups.duration) * multiplier;


                try {
                    switch(match.groups.command) {
                        case "mute":
                            await ctx.tg.restrictChatMember(
                                ctx.chat.id,
                                ctx.update.message.reply_to_message.from.id,
                                {
                                    until_date: Math.floor(Date.now()/1000) + duration
                                }
                            );
                            await ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id)
                            break;
                        case "ban":
                            await ctx.tg.banChatMember(
                                ctx.chat.id,
                                ctx.update.message.reply_to_message.from.id,
                                Math.floor(Date.now()/1000) + duration
                            );
                            await ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id)
                            break;
                    }
                } catch(e) {
                    console.warn(`${new Date().toISOString()} - Error while executing mod command`, e);
                }
            } else if (ctx.update.message.text.includes("!kick")) {
                try {
                    await ctx.tg.banChatMember(
                        ctx.chat.id,
                        ctx.update.message.reply_to_message.from.id,
                        Math.floor(Date.now()/1000) + 60 // If for whatever reason the unban fails, it should expire after a minute
                    );

                    await ctx.tg.unbanChatMember(
                        ctx.chat.id,
                        ctx.update.message.reply_to_message.from.id
                    );

                    await ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id)
                } catch(e) {
                    console.warn(`${new Date().toISOString()} - Error while executing mod command`, e);
                }
            }
        }
    }
}

export default ModHandler;
