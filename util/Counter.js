/*
    A daily-resetting counter with no persistence
 */

class Counter {
    constructor() {
        this.reset();
    }
    
    reset() {
        this._counter = 0;
        
        this._lastReset = getToday();
    }
    
    increment() {
        if (this._lastReset !== getToday()) {
            this.reset();
        }
        
        this._counter++;
    }
    
    get counter() {
        if (this._lastReset !== getToday()) {
            this.reset();
        }
        
        return this._counter;
    }
    
    get lastReset() {
        return this._lastReset;
    }
}

function getToday() {
    return new Date().toISOString().split("T")[0];
}

export default Counter;