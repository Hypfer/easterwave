import Handler from "../Handler.js";

/*
 * This handler tries to catch common abusive patterns usually relating to trying to aggressively let people know about their emotions,
 * do emotional damage or otherwise have an emotional component that has no business being part of the support chat
 *
 * Unfortunately, this also comes with some false-positives but what can you do.
 * At the very least, people playing taboo with the filter could end up with interesting linguistic results
 */

const BAD_PATTERNS = [
    {
        reason: "Possibly passive-aggressive and/or emotional metadata embedded in message",
        patterns: [
            // messages or paragraphs ending with an ellipsis to let everyone know just how unhappy the user is about something
            /(\.{3,}|…)(\n|$)/,
            // some more passive aggressiveness (though can be a generational thing, but usually isn't)
            /(😉|;\))(\n|$)/,
            // messages or paragraphs ending with the see-no-evil emoji. Mild case but still annoying
            /🙈(\n|$)/u,
            // messages or paragraphs ending with fake niceness cranked up to 11
            /😊(\n|$)/u,
        ]
    },
    {
        reason: "/([😂🤣]){2,}/",
        patterns: [
            // messages containing two or more tears of joy emoji in a row. 100% idiot marker
            /([😂🤣]){2,}/u,
        ]
    },
    {
        reason: "Unstructured stream-of-consciousness",
        patterns: [
            // people not using any punctuation at all are unpleasant to read
            (text) => isVoiceInput(text),
            /[^\n]{600,}/
        ]
    },
    {
        reason: "Zalgo-style stacked diacritics",
        patterns: [
            // Zalgo-style stacked diacritics trying to escape the boundary of the message and rendering on top of others
            /\p{M}{5,}/u,
        ]
    },
    {
        reason: "Possibly AI-generated text",
        patterns: [
            /—/, // No human in existence uses the em dash in a casual telegram chat
        ]
    },
    {
        reason: "Asking for unsupported robots",
        patterns: [
            // people do not stop asking for these even _after_ having read the docs explicitly stating that they should not be asking for these or any other robots
            /qrevo|maxv|switchbot|saros|eufy/i,
        ]
    },
    {
        reason: "Possible metaquestion with unclear intent",
        patterns: [
            /\baccept(ing|ed)?( (a|as a))? (pull[- ]request|pr)s?\b/i,
        ]
    },
    {
        reason: "Unsolicited unqualified opinions",
        patterns: [
            // another one of those markers of unsolicited opinions
            /missing feature/i,
            /is there (?:a |any |some )?(?:particular )?reason/i,
        ]
    },
    {
        reason: "Possibly bargaining or looking for shortcuts",
        patterns: [
            /is there (?:any |an)?other way/i,
            /is there (?:a|an|any) ?(?:other )?(?:easier way|trick|hack|workaround|shortcut|bypass)/i,
        ]
    },
    {
        reason: "Not a commercial project",
        patterns: [
            /are there any plans/i,
            /is there a plan/i,
            /is there any interest/i,
            /the roadmap/i,
            /\b(is|are)(?:\s+\S+){1,4}\s+planned(?:\s+\S+){0,3}\s*\?/i,
            /\b(future plans|plans for the future)\b/i,
        ]
    },
    {
        reason: "Default communication boilerplate",
        patterns: [
            // more markers of default communication
            /(hello|hi|hey) (dear )?(valetudo )?(community|team|friends|people)/i,
            // disabled due to false positives: /anyone (has|have|here|tried|tries|ever|knows|know)/i,
            // no hello
            /^(hello|hi|hey)\s*(community|everyone|team|all|friends|friend|people)?$/i,
        ]
    },
    {
        reason: "Your identity is not relevant here",
        patterns: [
            // irrelevant metadata/label attached to a message. Usually in hopes of masking the actual payload that happens to be breaking rules/culture/etc.
            /\b(newbie|newby)\b/i,
            /\b(i am|i'm|i’m|im|i m) new here\b/i,
            /\b(i am|i'm|i’m|im|i m) new to(?: all)?(?: of)? this\b/i
        ]
    },
    {
        reason: "Possible meta-question",
        patterns: [
            /the right place to ask/i,
            /the right place to (seek|get) (help|support)/i,
            /is it allowed to ask/i
        ]
    },
    {
        reason: "Contradictory request metadata",
        patterns: [
            /(i am|i'm|i’m|im|i m) sorry to bother you/i,
            /(breaking|break) any rules/i
        ]
    },
    {
        reason: "Artificially collapsed solution space",
        patterns: [
            /my only (other )?option/i
        ]
    }
];

function formatBadwordReply(reason) {
    return `Your previous message was automatically deleted.

Reason:
${reason}

The code of this automod bot is open source and can be found at: https://github.com/Hypfer/easterwave`;
}

function getBadwordReason(text) {
    for (const entry of BAD_PATTERNS) {
        for (const pattern of entry.patterns) {
            if (pattern instanceof RegExp ? pattern.test(text) : pattern(text)) {
                return entry.reason;
            }
        }
    }
    return null;
}

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

    async handleMessage({ctx, metadata}) {
        const message = ctx.update.message || ctx.update.edited_message;
        const text = message?.text || message?.caption;

        if (typeof text !== "string") {
            return false;
        }

        const reason = getBadwordReason(text);

        if (!reason) {
            return false;
        }

        if (
            message?.from?.id?.toString() !== undefined &&
            this.uidWhitelist.includes(message.from.id.toString())
        ) {
            return false;
        }

        try {
            await ctx.tg.deleteMessage(ctx.chat.id, message.message_id);

            // noinspection JSCheckFunctionSignatures
            await ctx.tg.sendMessage(
                ctx.chat.id,
                formatBadwordReply(reason),
                { receiver_user_id: message.from.id }
            );
        } catch(e) {
            console.warn(`${new Date().toISOString()} - Error while ensuring community standards`, e);
        }

        metadata.moderationActionTaken = true;
        this.nonsenseCounter.increment();
        return true;
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
