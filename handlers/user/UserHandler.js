import Handler from "../Handler.js";

class UserHandler extends Handler {
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
        if (Array.isArray(ctx.message?.new_chat_members)) {
            for (const member of ctx.message.new_chat_members) {
                if (!member.is_bot) {
                    // Mute every new member for a few minutes to encourage them to think before posting
                    await ctx.tg.restrictChatMember(
                        ctx.chat.id,
                        member.id,
                        {
                            until_date: Math.floor(Date.now()/1000) + 3 * 60
                        }
                    );
                } else {
                    if (!this.uidWhitelist.includes(ctx.message.from.id.toString())) {
                        // Ban the bot and whoever added it
                        await ctx.tg.banChatMember(
                            ctx.chat.id,
                            member.id,
                        );
                        await ctx.tg.banChatMember(
                            ctx.chat.id,
                            ctx.message.from.id,
                        );
                        
                        this.nonsenseCounter.increment();
                    }
                }
            }
        }
    }
}

export default UserHandler;
