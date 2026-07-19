import Handler from "../Handler.js";

const INITIAL_REPLY = `Unfortunately, I am just a few hundred lines of JavaScript, so I have no idea what you've just said.

My creator wanted to add a funny easter egg here but so far has failed to come up with something.`;

const FOLLOWUP_RESPONSES = [
    `Nothing here.`,
    `Still nothing here.`,
    `Nope.`,
    `No sir.`,
    `Nothing at all.`,
    `Nuh-uh.`,
    `¯\\_(ツ)_/¯`,
];

class EphemeralReplyHandler extends Handler {
    /**
     * @param {number} botUserId
     */
    constructor(botUserId) {
        super();
        this.botUserId = botUserId;
    }

    async handleMessage(ctx) {
        const message = ctx.update.message;

        if (
            message &&
            message.message_id === 0 &&
            message.ephemeral_message_id &&
            message.receiver_user &&
            message.receiver_user.id === this.botUserId
        ) {
            try {
                await ctx.tg.sendMessage(
                    ctx.chat.id,
                    this.getReply(message),
                    { receiver_user_id: message.from.id }
                );
                return true;
            } catch (e) {
                console.warn(`${new Date().toISOString()} - Error while handling ephemeral reply`, e);
            }
        }

        return false;
    }

    getReply(message) {
        const reply = message.reply_to_message;
        if (!reply) {
            return INITIAL_REPLY;
        }

        let replyText;
        if (typeof reply?.text === "string") {
            replyText = reply.text;
        } else if (typeof reply?.caption === "string") {
            replyText = reply.caption;
        }

        if (replyText === undefined) {
            return INITIAL_REPLY;
        }

        const currentIndex = FOLLOWUP_RESPONSES.indexOf(replyText);
        if (currentIndex === -1) {
            return replyText === INITIAL_REPLY
                ? FOLLOWUP_RESPONSES[0]
                : INITIAL_REPLY;
        }

        const nextIndex = Math.min(currentIndex + 1, FOLLOWUP_RESPONSES.length - 1);
        return FOLLOWUP_RESPONSES[nextIndex];
    }
}

export default EphemeralReplyHandler;
