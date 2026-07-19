import Handler from "../Handler.js";

function formatEphemeralReply() {
    return `Unfortunately, I am just a few hundred lines of JavaScript, so I have no idea what you've just said.

My creator wanted to add a funny easter egg here but so far has failed to come up with something.`;
}

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
                    formatEphemeralReply(),
                    { receiver_user_id: message.from.id }
                );
            } catch (e) {
                console.warn(`${new Date().toISOString()} - Error while handling ephemeral reply`, e);
            }
        }
    }
}

export default EphemeralReplyHandler;
