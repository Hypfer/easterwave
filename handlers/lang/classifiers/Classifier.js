class Classifier {
    /**
     * @returns {string}
     */
    getName() {
        throw new Error("Not Implemented");
    }

    /**
     * @param {string} str
     * @returns {{lang: string, accuracy: number}[]}
     */
    detect(str) {
        throw new Error("Not Implemented");
    }

    /**
     * @param {string} str
     * @returns {boolean}
     */
    isEnglish(str) {
        throw new Error("Not Implemented");
    }
}

export default Classifier;
