import Handler from "../Handler.js";
import Bouncer from "./Bouncer.js";

function formatLangBounceReply(detectionLines) {
    return `This chat is English only. Your previous message was automatically deleted because the naive statistical classifiers used thought that it might not be that.

Detection results:
${detectionLines}

The code of this automod bot is open source and can be found at: https://github.com/Hypfer/easterwave`;
}

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

    async handleMessage({ctx, metadata}) {
        const message = ctx.update.message || ctx.update.edited_message;
        let text;

        if (typeof message?.text === "string") {
            text = message.text;
        } else if (typeof message?.caption === "string") {
            text = message.caption;
        }

        if (
            message?.from?.id?.toString() !== undefined &&
            this.uidWhitelist.includes(message.from.id.toString())
        ) {
            return false;
        }

        if (!this.bouncer.check(text)) {
            try {
                console.log(`${new Date().toISOString()} - Deleting message with text "${text}"`);

                await ctx.tg.deleteMessage(ctx.chat.id, message.message_id)

                const detections = this.bouncer.getDetections(text);
                const detectionLines = detections.map(d => {
                    const top = d.detections.slice(0, 3);
                    const details = top.map(det => `${det.lang} (${(det.accuracy * 100).toFixed(1)}%)`).join(", ");
                    return `${d.classifier}: ${details}`;
                }).join("\n");

                // noinspection JSCheckFunctionSignatures
                await ctx.tg.sendMessage(
                    ctx.chat.id,
                    formatLangBounceReply(detectionLines),
                    { receiver_user_id: message.from.id }
                );

                this.nonsenseCounter.increment();
            } catch(e) {
                console.warn(`${new Date().toISOString()} - Error while deleting message`, e);
            }
            metadata.moderationActionTaken = true;
            return true;
        }
    }
}

export default LangHandler;
