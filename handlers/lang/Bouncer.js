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
     * @param text
     * @returns {boolean} whether the text passed the classifiers
     */
    check(text) {
        if (text !== undefined && text.length >= 10) {
            const hits = classifiers.map((classifier) => {
                const result = classifier.isEnglish(text);
                return result;
            }).filter(e => e === true);

            return hits.length >= classifiers.length / 2;
        } else {
            return true;
        }
    }

    /**
     * @param text
     * @returns {{classifier: string, detections: {lang: string, accuracy: number}[]}[]} detection results per classifier
     */
    getDetections(text) {
        if (text !== undefined && text.length >= 10) {
            return classifiers.map((classifier) => {
                return {
                    classifier: classifier.getName(),
                    detections: classifier.detect(text).sort((a, b) => b.accuracy - a.accuracy)
                };
            });
        } else {
            return [];
        }
    }
}

export default Bouncer;
