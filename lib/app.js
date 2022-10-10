"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const node_cluster_1 = __importDefault(require("node:cluster"));
const routes_1 = __importDefault(require("./routes"));
const whatsapp_1 = require("./whatsapp");
// get env file data
dotenv.config();
let host = (_a = process.env.HOST) !== null && _a !== void 0 ? _a : '127.0.0.1';
let port = (_b = process.env.PORT) !== null && _b !== void 0 ? _b : '8881';
let NUMBER_CPU = (_c = process.env.NUMBER_CPU) !== null && _c !== void 0 ? _c : '1';
// start express Configuration express & Use API Routes
let app = (0, express_1.default)();
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use('/', routes_1.default);
if (node_cluster_1.default.isPrimary) {
    console.log(`Primary ${process.pid} is running`);
    for (let i = 0; i < parseInt(NUMBER_CPU); i++) {
        node_cluster_1.default.fork();
    }
    node_cluster_1.default.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        node_cluster_1.default.fork();
    });
}
else {
    app.listen(port, host, () => {
        (0, whatsapp_1.init)();
        console.log(`Server is listening on ${process.pid} https://${host}:${port}`);
    });
}
exports.default = app;
