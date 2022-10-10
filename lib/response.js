"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let response = (res, statusCode = 200, success = false, message = '', data = {}) => {
    res.status(statusCode);
    res.json({
        success,
        message,
        data,
    });
    res.end();
};
exports.default = response;
