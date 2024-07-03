import Classifier from "./Classifier.js";
import lande from 'lande';

class LandeClassifier extends Classifier {
    isEnglish(str) {
        const classification = lande(str).map(([lang, accuracy]) => {
            return {
                lang: lang,
                accuracy: accuracy
            }
        });
        
        if (classification.filter(e => e.accuracy > 0.7).length > 0) {
            const english = classification.find(e => e.lang === "eng");
            
            return english !== undefined && english.accuracy >= 0.35;
        } else {
            return true;
        }
    }
}

export default LandeClassifier;