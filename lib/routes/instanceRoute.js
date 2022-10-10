"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const requestValidator_1 = __importDefault(require("../Middleware/requestValidator"));
const sessionValidator_1 = __importDefault(require("../Middleware/sessionValidator"));
const Instance_1 = __importDefault(require("../Models/Instance"));
const router = (0, express_1.Router)();
router.post('/setPresence', (0, express_validator_1.query)('id').notEmpty(), (0, express_validator_1.body)('phone').notEmpty(), (0, express_validator_1.body)('presence').isIn(['unavailable', 'available', 'composing', 'recording', 'paused']).notEmpty(), requestValidator_1.default, sessionValidator_1.default, (req, res) => new Instance_1.default().setPresence(req, res));
router.post('/setDisplayPicture', (0, express_validator_1.query)('id').notEmpty(), (0, express_validator_1.body)('phone').notEmpty(), (0, express_validator_1.body)('imageURL').notEmpty(), requestValidator_1.default, sessionValidator_1.default, (req, res) => new Instance_1.default().setDisplayPicture(req, res));
router.post('/createProduct', (0, express_validator_1.query)('id').notEmpty(), (0, express_validator_1.body)('name').notEmpty(), (0, express_validator_1.body)('retailerId'), (0, express_validator_1.body)('url'), (0, express_validator_1.body)('description'), (0, express_validator_1.body)('price').isInt().notEmpty(), (0, express_validator_1.body)('currency').notEmpty(), (0, express_validator_1.body)('isHidden').isBoolean(), (0, express_validator_1.body)('images').isArray({ min: 1 }).notEmpty(), (0, express_validator_1.body)('originCountryCode'), requestValidator_1.default, sessionValidator_1.default, (req, res) => new Instance_1.default().createProduct(req, res));
router.post('/updateProduct', (0, express_validator_1.query)('id').notEmpty(), (0, express_validator_1.body)('productId').isString().notEmpty(), (0, express_validator_1.body)('name').notEmpty(), (0, express_validator_1.body)('retailerId'), (0, express_validator_1.body)('url'), (0, express_validator_1.body)('description').notEmpty(), (0, express_validator_1.body)('price').isInt().notEmpty(), (0, express_validator_1.body)('currency').notEmpty(), (0, express_validator_1.body)('isHidden').isBoolean().notEmpty(), (0, express_validator_1.body)('images').isArray({ min: 1 }).notEmpty(), requestValidator_1.default, sessionValidator_1.default, (req, res) => new Instance_1.default().updateProduct(req, res));
router.post('/deleteProduct', (0, express_validator_1.query)('id').notEmpty(), (0, express_validator_1.body)('productIds').notEmpty(), requestValidator_1.default, sessionValidator_1.default, (req, res) => new Instance_1.default().deleteProduct(req, res));
router.get('/me', (0, express_validator_1.query)('id').notEmpty(), requestValidator_1.default, sessionValidator_1.default, (req, res) => new Instance_1.default().me(req, res));
exports.default = router;
