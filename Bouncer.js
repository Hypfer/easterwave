import TinyLDClassifier from "./classifiers/TinyLDClassifier.js";
import LanguageDetectClassifier from "./classifiers/LanguageDetectClassifier.js";
import LandeClassifier from "./classifiers/LandeClassifier.js";
import EldClassifier from "./classifiers/EldClassifier.js";

const classifiers = [
    new TinyLDClassifier(),
    new EldClassifier(),
]

class Bouncer {

    /**
     * 
     * @param text
     * @returns {boolean} whether the text passed the classifiers
     */
    check(text) {
        if (text !== undefined && text.length >= 10) {
            const hits = classifiers.map((classifier) => {
                // noinspection UnnecessaryLocalVariableJS
                const result = classifier.isEnglish(text);
                
                return result;
            }).filter(e => e === true);

            return hits.length >= classifiers.length / 2;
        } else {
            return true;
        }
    }
}

export default Bouncer;