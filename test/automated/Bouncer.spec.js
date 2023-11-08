// noinspection ES6UnusedImports

import Bouncer from "../../Bouncer.js";
import fs from "fs";
import * as path from "path";
import should from "should";

const bouncer = new Bouncer();

const ham = JSON.parse(fs.readFileSync(path.join(path.resolve(), "./test/res/ham.json")).toString())
const spam = JSON.parse(fs.readFileSync(path.join(path.resolve(), "./test/res/spam.json")).toString())

describe("Bouncer", function () {
    it("Should allow most ham", async function() {
        let totalHamAllowed = 0;
        
        ham.forEach(text => {
            const result = bouncer.check(text)
            
            if (result === true) {
                totalHamAllowed++;
            }
        });

        (totalHamAllowed/ham.length).should.be.greaterThanOrEqual(0.9)
    });

    it("Should filter most spam", async function() {
        let totalSpamBlocked = 0;
        
        spam.forEach(text => {
            const result = bouncer.check(text);
            
            if (result === false) {
                totalSpamBlocked++;
            }
        });

        (totalSpamBlocked/spam.length).should.be.greaterThanOrEqual(0.6)
    });
});
