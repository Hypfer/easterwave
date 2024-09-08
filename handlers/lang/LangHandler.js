import Handler from "../Handler.js";
import Bouncer from "./Bouncer.js";

class LangHandler extends Handler {
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

        this.bouncer = new Bouncer();
    }

    async handleMessage(ctx) {
        let text;

        if (typeof ctx.update.message?.text === "string") {
            text = ctx.update.message.text;
        } else if (typeof ctx.update.message?.caption === "string") {
            text = ctx.update.message.caption;
        }

        if (this.uidWhitelist.includes(ctx.update.message?.from?.id?.toString())) {
            return;
        }

        if (!this.bouncer.check(text)) {
            try {
                console.log(`${new Date().toISOString()} - Deleting message with text "${text}"`);

                await ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id)
                this.nonsenseCounter.increment();
            } catch(e) {
                console.warn(`${new Date().toISOString()} - Error while deleting message`, e);
            }
        }
    }
}

export default LangHandler;
