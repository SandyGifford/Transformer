"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventDelegate = (function () {
    function EventDelegate() {
        this.listeners = [];
    }
    EventDelegate.prototype.addEventListener = function (listener) {
        if (this.listeners.indexOf(listener) === -1)
            this.listeners.push(listener);
        else
            console.warn("Listner was already added.");
    };
    EventDelegate.prototype.removeEventListener = function (listener) {
        var index = this.listeners.indexOf(listener);
        if (index !== -1)
            this.listeners.splice(index, 1);
    };
    EventDelegate.prototype.trigger = function (data) {
        this.listeners.forEach(function (listener) { return listener(data); });
    };
    EventDelegate.prototype.getListenerCount = function () {
        return this.listeners.length;
    };
    EventDelegate.prototype.hasListeners = function () {
        return this.listeners.length !== 0;
    };
    return EventDelegate;
}());
exports.default = EventDelegate;
//# sourceMappingURL=EventDelegate.js.map