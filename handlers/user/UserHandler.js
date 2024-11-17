import Handler from "../Handler.js";
import {sleep} from "../../util/tools.js";

class UserHandler extends Handler {
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

        this.antifloodCache = [];
        this.antifloodTimeout = undefined;
    }

    async handleMessage(ctx) {
        if (ctx.message?.new_chat_members === undefined && ctx.message.from && userIsInvalid(ctx.message.from)) {
            try {
                await ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id)
            } catch(e) {
                console.warn(`${new Date().toISOString()} - Error while ensuring community standards`, e);
            }

            this.nonsenseCounter.increment();
        }

        if (Array.isArray(ctx.message?.new_chat_members)) {
            for (const member of ctx.message.new_chat_members) {
                if (!member.is_bot) {
                    if (userIsInvalid(member)) {
                        // Kick the user
                        await ctx.tg.banChatMember(
                            ctx.chat.id,
                            member.id,
                            Math.floor(Date.now()/1000) + 60 // If for whatever reason the unban fails, it should expire after a minute
                        );

                        await ctx.tg.unbanChatMember(
                            ctx.chat.id,
                            member.id
                        );

                        this.nonsenseCounter.increment();
                    } else {
                        // Mute every new member for a few minutes to encourage them to think before posting
                        await ctx.tg.restrictChatMember(
                            ctx.chat.id,
                            member.id,
                            {
                                until_date: Math.floor(Date.now()/1000) + 3 * 60
                            }
                        );
                    }
                } else {
                    if (!this.uidWhitelist.includes(ctx.message.from.id.toString())) {
                        // Ban the bot and whoever added it
                        await ctx.tg.banChatMember(
                            ctx.chat.id,
                            member.id,
                        );
                        await ctx.tg.banChatMember(
                            ctx.chat.id,
                            ctx.message.from.id,
                        );

                        this.nonsenseCounter.increment();
                    }
                }

                this.antifloodCache.push({id: member.id, chat_id: ctx.chat.id, at: Date.now(), removed: false});

                clearTimeout(this.antifloodTimeout);
                this.antifloodTimeout = setTimeout(() => {
                    this.evaluateAntiflood(ctx).catch(e => {
                        console.error("Antiflood failed", e);
                    });
                }, 30_000);
            }
        }
    }

    async evaluateAntiflood(ctx) {
        const now = Date.now();

        this.antifloodCache = this.antifloodCache.filter(e => e.at > (now - 5*60*1000));

        const membersPerGroup = {};
        this.antifloodCache.forEach(e => {
            if (!membersPerGroup[e.chat_id]) {
                membersPerGroup[e.chat_id] = [];
            }

            membersPerGroup[e.chat_id].push(e);
        });

        for (const groupMembers of Object.values(membersPerGroup)) {
            if (groupMembers.length >= 10) {
                for (const botUser of groupMembers) {
                    await ctx.tg.banChatMember(
                        botUser.chat_id,
                        botUser.id,
                        Math.floor(now/1000) + 60 // Use an expiring ban to not permaban false positives
                    );

                    botUser.removed = true;
                    await sleep(300);
                }
            }
        }

        this.antifloodCache = this.antifloodCache.filter(e => e.removed !== true);
    }
}

function userIsInvalid(user) {
    const stringsToCheck = [
        user.first_name,
        user.last_name,
    ].filter(e => e !== undefined);
    let result = false;

    for (const str in stringsToCheck) {
        result = result || [
            // Zalgo-style stacked diacritics trying to escape the boundary of the message and rendering on top of others
            /\p{M}{5,}/u.test(str),
            // No name at all
            /^\p{White_Space}$/u.test(str),
            str === "", // (How) is this even possible?
            // Weird invisible non-whitespace characters
            /[\uFFA0|\u3164]/.test(str)
        ].includes(true)
    }

    // People need a somewhat proper name for the search and other moderation tools to work
    if (user.username === undefined) {
        result = result || [
            user.first_name.length < 2 && (
                user.last_name === undefined ||
                SYMBOLS_ONLY_REGEX.test(user.last_name)
            ),

            SYMBOLS_ONLY_REGEX.test(user.first_name) && (
                user.last_name === undefined ||
                SYMBOLS_ONLY_REGEX.test(user.last_name) ||
                user.last_name.length < 2
            )
        ].includes(true)
    }


    return result;
}

const SYMBOLS_ONLY_REGEX = /^[\p{P}\p{S}]+$/u

export default UserHandler;
