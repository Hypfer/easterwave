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
        if (typeof ctx.update.message?.text === "string") {
            if (
                [
                    // messages or paragraphs ending with an ellipsis to let everyone know just how unhappy the user is about something
                    /(\.{3,}|…)(\n|$)/.test(ctx.update.message.text),
                    // messages or paragraphs ending with the see-no-evil emoji. Mild case but still annoying
                    /🙈(\n|$)/u.test(ctx.update.message.text),
                    // messages containing two or more tears of joy emoji in a row. 100% idiot marker
                    /([😂🤣]){2,}/u.test(ctx.update.message.text),
                    // messages or paragraphs ending with fake niceness cranked up to 11
                    /😊(\n|$)/u.test(ctx.update.message.text),
                    // People not using any punctuation at all are unpleasant to read
                    isVoiceInput(ctx.update.message.text),
                    // Zalgo-style stacked diacritics trying to escape the boundary of the message and rendering on top of others
                    /\p{M}{5,}/u.test(ctx.update.message.text)
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

    return wordCount > 21 && (punctuationCount === 0 || wordCount / Math.max(2, punctuationCount) > 21);
}

export default BadwordHandler;
