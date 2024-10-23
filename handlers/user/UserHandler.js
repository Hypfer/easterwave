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
        if (Array.isArray(ctx.message?.new_chat_members)) {
            for (const member of ctx.message.new_chat_members) {
                if (!member.is_bot) {
                    // Mute every new member for a few minutes to encourage them to think before posting
                    await ctx.tg.restrictChatMember(
                        ctx.chat.id,
                        member.id,
                        {
                            until_date: Math.floor(Date.now()/1000) + 3 * 60
                        }
                    );
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

export default UserHandler;
