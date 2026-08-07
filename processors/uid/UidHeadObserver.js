import {PreProcessor} from "../../handlers/Handler.js";

class UidHeadObserver extends PreProcessor {
    constructor({headStore}) {
        super();

        this.headStore = headStore;
    }

    async preProcess({ctx, metadata}) {
        const message = ctx.update.message || ctx.update.edited_message;

        if (!message?.from || message.from.is_bot) {
            return;
        }

        this.headStore.observe(message.from.id);

        metadata.uidHead = this.headStore.uidHead;
    }
}

export default UidHeadObserver;
