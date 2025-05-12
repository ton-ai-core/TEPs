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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAndParseAbiFromUrl = exports.parseAbiXml = void 0;
const https = __importStar(require("https"));
const xmldom_1 = require("xmldom");
/**
 * Parses the internal message definition string, handling multi-line definitions
 */
function parseInternalMessageString(text) {
    // Normalize multi-line text into a single line, removing unnecessary spaces and linebreaks
    const normalizedText = text.replace(/\s+/g, ' ').trim();
    // Regular expression to extract name, opcode, parameters and return type
    const basicRegex = /(\w+)#([0-9a-fA-F]+)\s+(.*?)\s+=\s+(\w+);/;
    const noParamsRegex = /(\w+)#([0-9a-fA-F]+)\s+=\s+(\w+);/;
    let match = normalizedText.match(basicRegex);
    if (!match) {
        match = normalizedText.match(noParamsRegex);
        if (match) {
            // Case with no parameters
            const [_, name, opcode, return_type] = match;
            return {
                definition_name: name,
                opcode: `0x${opcode}`,
                params: [],
                return_type
            };
        }
        else {
            console.warn(`Warning: Could not parse internal message string: ${text}`);
            return {
                error: "Could not parse",
                original: text
            };
        }
    }
    const [_, name, opcode, params_str, return_type] = match;
    const params = [];
    if (params_str.trim()) {
        // Parse parameter section
        let remaining = params_str.trim();
        // Loop through all parameters
        while (remaining.length > 0) {
            // Find the parameter name and type delimiter
            const colonIndex = remaining.indexOf(':');
            if (colonIndex === -1)
                break;
            // Extract parameter name
            const paramName = remaining.substring(0, colonIndex).trim();
            remaining = remaining.substring(colonIndex + 1);
            // Extract parameter type
            let paramType = '';
            let depth = 0;
            let i = 0;
            let inType = true;
            // Process each character
            for (i = 0; i < remaining.length; i++) {
                const char = remaining[i];
                // Track nesting level of parentheses
                if (char === '(')
                    depth++;
                else if (char === ')')
                    depth--;
                // If we hit a space at the top level, it might be the end of this parameter
                if (char === ' ' && depth === 0) {
                    // Check if the next part is a new parameter (has a colon)
                    const nextPart = remaining.substring(i + 1);
                    if (nextPart.includes(':')) {
                        inType = false;
                        break;
                    }
                }
            }
            // Extract the type based on what we found
            if (inType) {
                // We reached the end of the string, so the type is everything remaining
                paramType = remaining.trim();
                remaining = '';
            }
            else {
                // We found the end of this parameter, extract the type and update remaining
                paramType = remaining.substring(0, i).trim();
                remaining = remaining.substring(i + 1).trim();
            }
            // Add the parameter to our list
            params.push({
                name: paramName,
                type: paramType
            });
        }
    }
    return {
        definition_name: name,
        opcode: `0x${opcode}`,
        params,
        return_type
    };
}
/**
 * Main XML parsing function
 */
function parseAbiXml(xmlString) {
    const parser = new xmldom_1.DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const parsed = {
        interfaces: [],
        get_methods: [],
        internal_messages: []
    };
    // Get the root element
    const root = xmlDoc.documentElement;
    // Process all child elements of the root
    for (let i = 0; i < root.childNodes.length; i++) {
        const element = root.childNodes[i];
        // Skip nodes that are not elements (e.g., text nodes or comments)
        if (element.nodeType !== 1)
            continue;
        const nodeName = element.nodeName;
        if (nodeName === 'interface') {
            const interfaceData = {
                name: element.getAttribute('name') || '',
                inherits: element.getAttribute('inherits'),
                code_hash: null,
                get_methods_ref: [],
                messages_in_ref: [],
                messages_out_ref: []
            };
            // Process all child elements of the interface
            for (let j = 0; j < element.childNodes.length; j++) {
                const child = element.childNodes[j];
                if (child.nodeType !== 1)
                    continue;
                const childName = child.nodeName;
                if (childName === 'code_hash') {
                    interfaceData.code_hash = child.textContent ? child.textContent.trim() : null;
                }
                else if (childName === 'get_method') {
                    const methodName = child.getAttribute('name');
                    if (methodName)
                        interfaceData.get_methods_ref.push(methodName);
                }
                else if (childName === 'msg_in') {
                    // Process all internal messages inside msg_in
                    for (let k = 0; k < child.childNodes.length; k++) {
                        const internalNode = child.childNodes[k];
                        if (internalNode.nodeType !== 1 || internalNode.nodeName !== 'internal')
                            continue;
                        const msgName = internalNode.getAttribute('name');
                        if (msgName)
                            interfaceData.messages_in_ref.push(msgName);
                    }
                }
                else if (childName === 'msg_out') {
                    // Process all internal messages inside msg_out
                    for (let k = 0; k < child.childNodes.length; k++) {
                        const internalNode = child.childNodes[k];
                        if (internalNode.nodeType !== 1 || internalNode.nodeName !== 'internal')
                            continue;
                        const msgName = internalNode.getAttribute('name');
                        if (msgName)
                            interfaceData.messages_out_ref.push(msgName);
                    }
                }
            }
            parsed.interfaces.push(interfaceData);
        }
        else if (nodeName === 'get_method') {
            const methodData = {
                name: element.getAttribute('name') || '',
                inputs: [],
                outputs: []
            };
            // Look for input and output sections
            for (let j = 0; j < element.childNodes.length; j++) {
                const section = element.childNodes[j];
                if (section.nodeType !== 1)
                    continue;
                const sectionName = section.nodeName;
                if (sectionName === 'input' || sectionName === 'output') {
                    const paramList = sectionName === 'input' ? methodData.inputs : methodData.outputs;
                    // Process all parameters in the section
                    for (let k = 0; k < section.childNodes.length; k++) {
                        const param = section.childNodes[k];
                        if (param.nodeType !== 1)
                            continue;
                        paramList.push({
                            param_category: param.nodeName,
                            name: param.getAttribute('name') || '',
                            type: param.textContent ? param.textContent.trim() : null
                        });
                    }
                }
            }
            parsed.get_methods.push(methodData);
        }
        else if (nodeName === 'internal') {
            const internalData = {
                xml_name: element.getAttribute('name') || ''
            };
            // Get text content and parse it
            const textContent = element.textContent;
            if (textContent && textContent.trim()) {
                const parsedStringData = parseInternalMessageString(textContent);
                Object.assign(internalData, parsedStringData);
            }
            parsed.internal_messages.push(internalData);
        }
    }
    return parsed;
}
exports.parseAbiXml = parseAbiXml;
/**
 * Loads and parses ABI from the specified URL
 */
function loadAndParseAbiFromUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            // Process data reception
            response.on('data', (chunk) => {
                data += chunk;
            });
            // When all data is received - parse XML
            response.on('end', () => {
                try {
                    const parsedData = parseAbiXml(data);
                    resolve(parsedData);
                }
                catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}
exports.loadAndParseAbiFromUrl = loadAndParseAbiFromUrl;
// Add CommonJS support
module.exports = {
    parseInternalMessageString,
    loadAndParseAbiFromUrl,
    ParsedAbi: {} // Type for TypeScript
};
