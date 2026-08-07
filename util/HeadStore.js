import fs from "fs";
import path from "path";

class HeadStore {
    constructor(dataDir, baseline) {
        this.filePath = dataDir ? path.join(dataDir, "uid-head.json") : null;
        this.uidHead = this.readHead(baseline);
    }

    readHead(baseline) {
        if (!this.filePath) {
            return baseline;
        }

        try {
            const raw = fs.readFileSync(this.filePath, "utf8");
            const parsed = JSON.parse(raw);
            if (typeof parsed.uidHead === "number" && !isNaN(parsed.uidHead)) {
                return parsed.uidHead;
            }
        } catch (e) {
            // intentional
        }

        return baseline;
    }

    writeHead() {
        if (!this.filePath) {
            return;
        }

        try {
            fs.mkdirSync(path.dirname(this.filePath), {recursive: true});
            fs.writeFileSync(this.filePath, JSON.stringify({uidHead: this.uidHead}));
        } catch (e) {
            console.warn(`${new Date().toISOString()} - Error while persisting uid head`, e);
        }
    }

    observe(userId) {
        if (userId > this.uidHead) {
            this.uidHead = userId;
            this.writeHead();
        }
    }
}

export default HeadStore;
