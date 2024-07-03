import Classifier from "./Classifier.js";
import { eld } from 'eld'

class EldClassifier extends Classifier {
    isEnglish(str) {
        const detection = eld.detect(str);
        const scores = detection.getScores();
        
        const classification = Object.entries(scores).map(([lang, accuracy]) => {
            return {
                lang: lang,
                accuracy: accuracy
            }
        })

        if (classification.filter(e => e.accuracy > 0.5).length > 0) {
            const english = classification.find(e => e.lang === "en");

            return english !== undefined && english.accuracy >= 0.35;
        } else {
            return true;
        }
    }
}

export default EldClassifier;