const Classifier = require("./Classifier");
const tinyLD = require("tinyld");

class TinyLDClassifier extends Classifier {
    isEnglish(str) {
        const classification = tinyLD.detectAll(str);

        if (classification.filter(e => e.accuracy > 0.70).length > 0) {
            const english = classification.find(e => e.lang === "en");
            
            return english !== undefined && english.accuracy >= 0.35;
        } else {
            return true;
        }
    }
}

module.exports = TinyLDClassifier;