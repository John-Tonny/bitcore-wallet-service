"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ClientError = (function () {
    function ClientError() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        switch (args.length) {
            case 0:
                this.code = 'BADREQUEST';
                this.message = 'Bad request';
                break;
            case 1:
                this.code = 'BADREQUEST';
                this.message = args[0];
                break;
            default:
            case 2:
                this.code = args[0];
                this.message = args[1];
                break;
        }
        this.name = this.code;
    }
    ClientError.prototype.toString = function () {
        return '<ClientError:' + this.code + ' ' + this.message + '>';
    };
    return ClientError;
}());
exports.ClientError = ClientError;
//# sourceMappingURL=clienterror.js.map