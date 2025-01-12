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
        const message = ctx.update.message || ctx.update.edited_message;
        let text;

        if (typeof message?.text === "string") {
            text = message.text;
        } else if (typeof message?.caption === "string") {
            text = message.caption;
        }

        if (this.uidWhitelist.includes(message?.from?.id?.toString())) {
            return;
        }

        if (!this.bouncer.check(text)) {
            try {
                console.log(`${new Date().toISOString()} - Deleting message with text "${text}"`);

                await ctx.tg.deleteMessage(ctx.chat.id, message.message_id)
                this.nonsenseCounter.increment();
            } catch(e) {
                console.warn(`${new Date().toISOString()} - Error while deleting message`, e);
            }
        }
    }
}

export default LangHandler;
