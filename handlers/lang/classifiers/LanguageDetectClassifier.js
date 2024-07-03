import LanguageDetect from "languagedetect";
import Classifier from "./Classifier.js";

class LanguageDetectClassifier extends Classifier {
    constructor() {
        super();
        
        this.lngDetector = new LanguageDetect();
    }

    isEnglish(str) {
        const classification = this.lngDetector.detect(str).map(([lang, accuracy]) => {
            return {
                lang: lang,
                accuracy: accuracy
            }
        });
        
        if (classification.filter(e => e.accuracy > 0.2).length > 0) {
            const english = classification.find(e => e.lang === "english");
            
            return english !== undefined && english.accuracy >= 0.2;
        } else {
            return true;
        }
    }
}

export default LanguageDetectClassifier;