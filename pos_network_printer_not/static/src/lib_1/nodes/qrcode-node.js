"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xml_node_1 = require("../xml-node");
const buffer_builder_1 = require("../buffer-builder");
class QRcodeNode extends xml_node_1.XMLNode {
    constructor(node) {
        super(node);
    }
    open(bufferBuilder) {
        let version, errorCorrectionLevel, componentTypes;
        if (/\d+/.test(this.attributes.version)) {
            version = parseInt(this.attributes.version);
        }
        else {
            version = 1;
        }
        switch (this.attributes.ecl) {
            case 'L':
                errorCorrectionLevel = buffer_builder_1.QR_EC_LEVEL.L;
                break;
            case 'M':
                errorCorrectionLevel = buffer_builder_1.QR_EC_LEVEL.M;
                break;
            case 'Q':
                errorCorrectionLevel = buffer_builder_1.QR_EC_LEVEL.Q;
                break;
            case 'H':
                errorCorrectionLevel = buffer_builder_1.QR_EC_LEVEL.H;
                break;
            default:
                errorCorrectionLevel = buffer_builder_1.QR_EC_LEVEL.H;
        }
        if (/\d+/.test(this.attributes.componentTypes)) {
            componentTypes = parseInt(this.attributes.componentTypes);
        }
        else {
            componentTypes = 8;
        }
        if (this.content) {
            bufferBuilder.printQRcode(this.content, version, errorCorrectionLevel, componentTypes);
        }
        return bufferBuilder;
    }
    close(bufferBuilder) {
        return bufferBuilder;
    }
}
exports.default = QRcodeNode;
