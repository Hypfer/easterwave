import {PostProcessor} from "../../handlers/Handler.js";

/*
    Telegram UIDs are a monotonically increasing int, so checking it against the newest one we saw tells us if it is a new account
    That may not mean anything, but it may also mean tourist or burner account
 */
const NEW_ACCOUNT_TAG = "✦";

/*
    Contrary to what you see in a forum, this is not a "rank" but an ephemeral "new" indicator that eventually vanishes.
    If you add ranks, you also add an incentive for people to do virtual dick measuring based on those ranks 
    + all sorts of other in-group nonsense that harms SNR. 
    
    The goal is to have no tag and with that be normal.
 */
const ACTIVITY_LADDER = ["⟡", "⟐", "◈", "◆", "❖"];
const ACTIVITY_PROGRESS_CHANCE = 0.4;

/*
    It should be obvious without manually checking the modlog that a user has been persistently hitting the automod
 */
const TRANSGRESSION_LADDER = ["⊙", "⊚", "⊖", "⊘", "⊗"];
const TRANSGRESSION_DECAY_CHANCE = 0.3;

class TagPostProcessor extends PostProcessor {
    constructor({uidWhitelist, uidNewDelta}) {
        super();

        this.uidWhitelist = uidWhitelist;
        this.uidNewDelta = uidNewDelta;
    }

    async postProcess({ctx, metadata}) {
        const message = ctx.update.message || ctx.update.edited_message;

        if (ctx.chat?.type === "private") {
            return;
        }

        const newChatMembers = message?.new_chat_members;

        if (Array.isArray(newChatMembers)) {
            for (const member of newChatMembers) {
                if (member.is_bot) {
                    continue;
                }

                if (this.uidWhitelist.includes(member.id.toString())) {
                    continue;
                }

                if (metadata.removedMemberIds?.has(member.id)) {
                    continue;
                }

                const desiredTag = this.computeJoinTag(member, metadata.uidHead);
                await this.setTag(ctx, member.id, desiredTag);
            }
        } else {
            const user = message?.from;

            if (!user || user.is_bot) {
                return;
            }

            if (this.uidWhitelist.includes(user.id.toString())) {
                return;
            }

            const currentTag = message.sender_tag ?? "";
            const desiredTag = this.computeDesiredTag(message, metadata, currentTag);

            if (desiredTag !== currentTag) {
                await this.setTag(ctx, user.id, desiredTag.length > 0 ? desiredTag : null);
            }
        }
    }

    async setTag(ctx, userId, tag) {
        try {
            await ctx.tg.callApi("setChatMemberTag", {
                chat_id: ctx.chat.id,
                user_id: userId,
                tag: tag,
            });
        } catch (e) {
            console.warn(`${new Date().toISOString()} - Error while updating tag`, e);
        }
    }

    computeJoinTag(user, uidHead) {
        const glyphs = new Set();

        const distance = uidHead - user.id;
        if (distance <= this.uidNewDelta) {
            glyphs.add(NEW_ACCOUNT_TAG);
        }

        glyphs.add(ACTIVITY_LADDER[0]);

        return [...glyphs].join("");
    }

    computeDesiredTag(message, metadata, currentTag) {
        const glyphs = new Set();

        const isEdit = !!metadata?.isEdit;
        const moderationActionTaken = !!metadata?.moderationActionTaken;

        const distance = metadata.uidHead - message.from.id;
        if (distance <= this.uidNewDelta) {
            glyphs.add(NEW_ACCOUNT_TAG);
        }

        let actIdx = ACTIVITY_LADDER.findIndex(g => currentTag.includes(g));

        if (!isEdit && !moderationActionTaken) {
            if (actIdx >= 0 && Math.random() < ACTIVITY_PROGRESS_CHANCE) {
                if (actIdx < ACTIVITY_LADDER.length - 1) {
                    actIdx += 1;
                } else {
                    actIdx = -1;
                }
            }
        }

        if (actIdx !== -1) {
            glyphs.add(ACTIVITY_LADDER[actIdx]);
        }

        let transIdx = TRANSGRESSION_LADDER.findIndex(g => currentTag.includes(g));

        if (moderationActionTaken) {
            transIdx = transIdx === -1 ? 0 : Math.min(transIdx + 1, TRANSGRESSION_LADDER.length - 1);
        } else if (transIdx !== -1 && !isEdit) {
            if (Math.random() < TRANSGRESSION_DECAY_CHANCE) {
                transIdx -= 1;
            }
        }

        if (transIdx >= 0) {
            glyphs.add(TRANSGRESSION_LADDER[transIdx]);
        }

        return [...glyphs].join("");
    }
}

export default TagPostProcessor;
