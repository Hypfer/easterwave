import * as fs from "fs";

import TinyLDClassifier from "../../handlers/lang/classifiers/TinyLDClassifier.js";
import EldClassifier from "../../handlers/lang/classifiers/EldClassifier.js";

const ham = JSON.parse(fs.readFileSync("../res/ham.json").toString())
const spam = JSON.parse(fs.readFileSync("../res/spam.json").toString())

const classifiers = [
    new TinyLDClassifier(),
    new EldClassifier()
]


classifiers.forEach(classifier => {
    console.log(classifier.constructor.name);
    
    let hamResult = 0;
    ham.forEach(text => {
        const result = classifier.isEnglish(text);

        //console.log(result === true, text);

        if (result === true) {
            hamResult++;
        }
    })
    console.log(`Ham Result: ${hamResult/ham.length}`);

    let spamResult = 0;
    spam.forEach(text => {
        const result = classifier.isEnglish(text);

        //console.log(result === false, text);

        if (result === false) {
            spamResult++;
        }
    })
    console.log(`Spam Result: ${spamResult/spam.length}\n`);

})


