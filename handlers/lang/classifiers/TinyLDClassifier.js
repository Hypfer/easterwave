import * as tinyLD from "tinyld";
import Classifier from "./Classifier.js";

class TinyLDClassifier extends Classifier {
    getName() {
        return "TinyLD";
    }

    detect(str) {
        return tinyLD.detectAll(str);
    }

    isEnglish(str) {
        const classification = this.detect(str);

        if (classification.filter(e => e.accuracy > 0.65).length > 0) {
            const english = classification.find(e => e.lang === "en");
            
            return english !== undefined && english.accuracy >= 0.35;
        } else {
            return true;
        }
    }
}

export default TinyLDClassifier;
