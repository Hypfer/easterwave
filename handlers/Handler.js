class Handler {
    /**
     * @param {{ctx: any, metadata: object}} envelope
     * @returns {Promise<boolean>} resolves to `true` if the handler took action and the pipeline should abort, `false` otherwise
     */
    async handleMessage({ctx}) {
        throw new Error("Not Implemented");
    }
}

class PreProcessor {
    /**
     * @param {{ctx: any, metadata: object}} envelope
     * @returns {Promise<void>}
     */
    async preProcess({ctx}) {
        throw new Error("Not Implemented");
    }
}

class PostProcessor {
    /**
     * @param {{ctx: any, metadata: object}} envelope
     * @returns {Promise<void>}
     */
    async postProcess({ctx}) {
        throw new Error("Not Implemented");
    }
}

export default Handler;
export {Handler, PreProcessor, PostProcessor};
