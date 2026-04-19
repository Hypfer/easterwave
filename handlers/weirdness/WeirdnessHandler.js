import Handler from "../Handler.js";

/*
 * This handler cleans up weirdness relating to Telegram. Naming is hard
 */

class WeirdnessHandler extends Handler {
    /**
     *
     * @param {object} options
     */
    constructor(options) {
        super();
    }

    async handleMessage(ctx) {
        const message = ctx.update.message || ctx.update.edited_message;

        if (typeof message?.text === "string") {
            if (
                [
                    /^\/[a-zA-Z0-9_-]+\s*$/.test(message.text),
                ].includes(true)
            ) {
                try {
                    await ctx.tg.deleteMessage(ctx.chat.id, message.message_id);
                } catch(e) {
                    console.warn(`${new Date().toISOString()} - Error while cleaning up`, e);
                }
            }
        }
    }
}

export default WeirdnessHandler;
