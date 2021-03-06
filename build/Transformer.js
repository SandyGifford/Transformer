"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var event_delegate_1 = require("event-delegate");
var Transformer = (function () {
    function Transformer(data, transfoermerKey) {
        var _this = this;
        this.data = data;
        this.transfoermerKey = transfoermerKey;
        this.eventDelegate = new event_delegate_1.default();
        this.batchUpdateStackSize = 0;
        this.addDataChangedListener = function (listener) {
            _this.eventDelegate.addEventListener(listener);
        };
        this.removeDataChangedListener = function (listener) {
            _this.eventDelegate.removeEventListener(listener);
        };
        this.batchUpdate = function (action) {
            var originalStackSize = _this.batchUpdateStackSize;
            _this.batchUpdateStackSize++;
            action();
            _this.batchUpdateStackSize--;
            if (_this.batchUpdateStackSize !== originalStackSize)
                throw "Batch update ended with an unexpected stack size!";
            _this.triggerDataChanged();
        };
        this.getData = function (context) {
            if (context !== _this.transfoermerKey)
                throw "Attempted to access data directly from transformer without proper key.";
            else
                return _this.data;
        };
        this.setData = function (data) {
            _this.data = data;
            _this.triggerDataChanged();
        };
    }
    Transformer.prototype.mergeDataDeep = function (data) {
        this.data = this.data.mergeDeep(data);
        this.triggerDataChanged();
    };
    Transformer.prototype.concatAfter = function (path) {
        var items = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            items[_i - 1] = arguments[_i];
        }
        var list = this.getListAtPath(path);
        this.setDataIn(path, list.concat(Immutable.fromJS((_a = Array.prototype).concat.apply(_a, items))));
        var _a;
    };
    Transformer.prototype.concatBefore = function (path) {
        var items = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            items[_i - 1] = arguments[_i];
        }
        var list = this.getListAtPath(path);
        this.setDataIn(path, Immutable.fromJS((_a = Array.prototype).concat.apply(_a, items)).concat(list));
        var _a;
    };
    Transformer.prototype.pushData = function (path) {
        var items = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            items[_i - 1] = arguments[_i];
        }
        var list = this.getListAtPath(path);
        this.setDataIn(path, list.push.apply(list, items));
    };
    Transformer.prototype.unshiftData = function (path) {
        var items = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            items[_i - 1] = arguments[_i];
        }
        var list = this.getListAtPath(path);
        this.setDataIn(path, list.unshift.apply(list, items));
    };
    Transformer.prototype.insertDataAtIndex = function (path, index, data) {
        var list = this.getListAtPath(path);
        this.setDataIn(path, list.insert(index, data));
    };
    Transformer.prototype.setDataIn = function (path, value) {
        this.data = this.data.setIn(path, Immutable.fromJS(value));
        this.triggerDataChanged();
    };
    Transformer.prototype.deleteDataIn = function (path) {
        var basePath = path.slice(0, path.length - 1);
        var baseObject = this.data.getIn(basePath);
        if (Immutable.List.isList(baseObject)) {
            var index = path[path.length - 1];
            this.setDataIn(basePath, baseObject.splice(index, 1));
        }
        else {
            this.data = this.data.deleteIn(path);
            this.triggerDataChanged();
        }
    };
    Transformer.prototype.spliceDataIn = function (path, index, count) {
        var values = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            values[_i - 3] = arguments[_i];
        }
        var list = this.getListAtPath(path);
        this.setDataIn(path, list.splice.apply(list, [index, count].concat(values)));
        this.triggerDataChanged();
    };
    Transformer.prototype.moveEntryInList = function (path, fromIndex, toIndex) {
        var list = this.getListAtPath(path);
        var entry = list.get(fromIndex);
        list = list.splice(fromIndex, 1);
        this.setDataIn(path, list.insert(toIndex, entry));
    };
    Transformer.prototype.triggerDataChanged = function () {
        if (this.batchUpdateStackSize === 0)
            this.eventDelegate.trigger(this.data);
    };
    Transformer.prototype.getListAtPath = function (path) {
        var list = this.data.getIn(path);
        if (Immutable.List.isList(list))
            return list;
        else
            throw "object at path was not a list";
    };
    return Transformer;
}());
exports.default = Transformer;
//# sourceMappingURL=Transformer.js.map