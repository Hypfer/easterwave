import Handler from "../Handler.js";

/*
 * This handler tries to catch common abusive patterns usually relating to trying to aggressively let people know about their emotions,
 * do emotional damage or otherwise have an emotional component that has no business being part of the support chat
 *
 * Unfortunately, this also comes with some false-positives but what can you do.
 * At the very least, people playing taboo with the filter could end up with interesting linguistic results
 */

class BadwordHandler extends Handler {
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
        const message = ctx.update.message || ctx.update.edited_message;

        if (typeof message?.text === "string") {
            if (
                [
                    // messages or paragraphs ending with an ellipsis to let everyone know just how unhappy the user is about something
                    /(\.{3,}|…)(\n|$)/.test(message.text),
                    // messages or paragraphs ending with the see-no-evil emoji. Mild case but still annoying
                    /🙈(\n|$)/u.test(message.text),
                    // messages containing two or more tears of joy emoji in a row. 100% idiot marker
                    /([😂🤣]){2,}/u.test(message.text),
                    // messages or paragraphs ending with fake niceness cranked up to 11
                    /😊(\n|$)/u.test(message.text),
                    // People not using any punctuation at all are unpleasant to read
                    isVoiceInput(message.text),
                    // Zalgo-style stacked diacritics trying to escape the boundary of the message and rendering on top of others
                    /\p{M}{5,}/u.test(message.text),
                    // People do not stop asking for these even _after_ having read the docs explicitly stating that they should not be asking for these or any other robots
                    /qrevo|maxv|switchbot|saros|eufy/i.test(message.text),
                    // Another one of those markers of unsolicited opinions
                    /missing feature/i.test(message.text),
                    // More markers of default communication
                    /(hello|hi|hey) (dear )?(valetudo )?(community|team|friends|people)/i.test(message.text),
                    // /anyone (has|have|here|tried|tries|ever|knows|know)/i.test(message.text), // Disabled due to false positives
                    // No hello
                    /^(hello|hi|hey)\s*(community|everyone|team|all|friends|friend|people)?$/i.test(message.text)
                ].includes(true)
            ) {
                if (
                    message?.from?.id?.toString() !== undefined &&
                    this.uidWhitelist.includes(message.from.id.toString())
                ) {
                    return;
                }

                try {
                    await ctx.tg.deleteMessage(ctx.chat.id, message.message_id);
                } catch(e) {
                    console.warn(`${new Date().toISOString()} - Error while ensuring community standards`, e);
                }

                this.nonsenseCounter.increment();
            }
        }
    }
}

function isVoiceInput(text) {
    const words = text.match(/\b\w+\b/g) || [];
    const punctuation = text.match(/[\p{P}\p{S}\n\t]/gu) || [];

    const wordCount = words.length;
    const punctuationCount = punctuation.filter(e => e !== "%").length;

    return wordCount > 32 && (punctuationCount === 0 || wordCount / Math.max(2, punctuationCount) > 32);
}

export default BadwordHandler;
