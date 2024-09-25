import Handler from "../Handler.js";

/*
    Lol. lmao even
 */

class FunHandler extends Handler {
    /**
     *
     * @param {object} options
     */
    constructor(options) {
        super();
    }

    async handleMessage(ctx) {
        return; // Disabled for now due to too many people clicking on it by accident
        
        if (typeof ctx.update.message?.text === "string") {

            if (
                [
                    "/kickme",
                    "/teachme",
                    "/timeout",
                    "/self_destruct",
                    "/premium",
                    "/premium-support",
                    "/multi_floor",
                    "/multifloor",
                    "/camera"
                ].includes(ctx.update.message.text)
            ) {
                try {
                    await ctx.tg.banChatMember(
                        ctx.chat.id,
                        ctx.update.message.from.id,
                        Math.floor(Date.now()/1000) + 60 // If for whatever reason the unban fails, it should expire after a minute
                    );

                    await ctx.tg.unbanChatMember(
                        ctx.chat.id,
                        ctx.update.message.from.id
                    );

                    await ctx.tg.setMessageReaction(
                        ctx.chat.id,
                        ctx.message.message_id,
                        [{type: "emoji", emoji: "🫡"}],
                        false
                    );
                } catch(e) {
                    console.warn(`${new Date().toISOString()} - Error while serving instant justice`, e);
                }
            }
        }
    }
}

export default FunHandler;
