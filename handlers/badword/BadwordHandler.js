import Handler from "../Handler.js";

class BadwordHandler extends Handler {
    /**
     *
     * @param {object} options
     * @param {Array<string>} options.uidWhitelist
     */
    constructor(options) {
        super();

        this.uidWhitelist = options.uidWhitelist;
    }

    async handleMessage(ctx) {
        if (typeof ctx.update.message?.text === "string") {
            if(
                [
                    /(\.{3,})(\n|$)/.test(ctx.update.message.text), //messages or paragraphs ending with ...
                ].includes(true)
            ) {
                if (
                    ctx.update.message?.from?.id?.toString() !== undefined &&
                    this.uidWhitelist.includes(ctx.update.message?.from.id.toString())
                ) {
                    return;
                }

                try {
                    await ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id)
                } catch(e) {
                    console.warn(`${new Date().toISOString()} - Error while ensuring community standards`, e);
                }
            }
        }
    }
}

export default BadwordHandler;
