class Handler {
    /**
     * @param {any} ctx
     * @returns {Promise<boolean>} resolves to `true` if the handler took action and the pipeline should abort, `false` otherwise
     */
    async handleMessage(ctx) {
        throw new Error("Not Implemented");
    }
}

export default Handler;