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
exports.generateWrappersFromObject = exports.generateWrappersFromFile = exports.generateWrappersFromUrl = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const abi_parser_1 = require("./abi_parser");
const abi_wrapper_1 = require("./abi_wrapper");
/**
 * Checks and creates a directory if it doesn't exist
 * @param dirPath Path to the directory
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
/**
 * Generate TypeScript wrapper files from ABI URL
 * @param url URL to ABI XML file
 * @param outputDir Output directory for generated files
 * @returns Promise that resolves when all files are generated
 */
async function generateWrappersFromUrl(url, outputDir = 'generated') {
    console.log(`Loading and parsing ABI from ${url}...`);
    try {
        // Load and parse ABI from URL
        const parsedAbi = await (0, abi_parser_1.loadAndParseAbiFromUrl)(url);
        return generateWrappersFromObject(parsedAbi, outputDir);
    }
    catch (error) {
        console.error('Error generating wrappers from URL:', error);
        throw error;
    }
}
exports.generateWrappersFromUrl = generateWrappersFromUrl;
/**
 * Save parsed ABI to JSON file for debugging
 * @param abi Parsed ABI object
 * @param outputPath Path to save the JSON file
 */
function saveAbiToJson(abi, outputPath) {
    try {
        // Create directory if needed
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Convert to JSON with formatting
        const jsonContent = JSON.stringify(abi, null, 2);
        fs.writeFileSync(outputPath, jsonContent);
        console.log(`Debug: Saved parsed ABI to ${outputPath}`);
    }
    catch (error) {
        console.error('Error saving ABI to JSON:', error);
    }
}
/**
 * Generate TypeScript wrapper files from ABI file
 * @param filePath Path to ABI XML file
 * @param outputDir Output directory for generated files
 * @returns Promise that resolves when all files are generated
 */
async function generateWrappersFromFile(filePath, outputDir = 'generated') {
    console.log(`Loading and parsing ABI from file ${filePath}...`);
    try {
        // Read and parse ABI from file
        const xmlContent = fs.readFileSync(filePath, 'utf-8');
        const parsedAbi = (0, abi_parser_1.parseAbiXml)(xmlContent);
        return generateWrappersFromObject(parsedAbi, outputDir);
    }
    catch (error) {
        console.error('Error generating wrappers from file:', error);
        throw error;
    }
}
exports.generateWrappersFromFile = generateWrappersFromFile;
/**
 * Generate TypeScript wrapper files from ABI object
 * @param abiObject Parsed ABI object
 * @param outputDir Output directory for generated files
 * @returns Array of generated file paths
 */
function generateWrappersFromObject(abiObject, outputDir = 'generated') {
    const tonAbi = (0, abi_wrapper_1.createTonAbiFromObject)(abiObject);
    const generatedFiles = [];
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    // Generate interfaces file
    const interfacesCode = tonAbi.generateAllInterfaces();
    const interfacesPath = path.join(outputDir, 'interfaces.ts');
    fs.writeFileSync(interfacesPath, interfacesCode);
    console.log(`Interfaces generated: ${interfacesPath}`);
    generatedFiles.push(interfacesPath);
    // Generate wrapper classes for each interface
    for (const iface of tonAbi.interfaces) {
        const className = tonAbi.normalizeInterfaceName(iface.name);
        const classCode = tonAbi.generateClassForInterface(iface.name);
        const filePath = path.join(outputDir, `${iface.name}.ts`);
        fs.writeFileSync(filePath, classCode);
        console.log(`Wrapper class generated: ${filePath}`);
        generatedFiles.push(filePath);
    }
    console.log(`\nTotal files generated: ${generatedFiles.length}\n`);
    return generatedFiles;
}
exports.generateWrappersFromObject = generateWrappersFromObject;
/**
 * Function for launching generation from command line
 */
async function main() {
    // Check if URL or file path was provided as argument
    const args = process.argv.slice(2);
    let source = 'https://raw.githubusercontent.com/tonkeeper/tongo/refs/heads/master/abi/schemas/nfts.xml';
    let outputDir = './generated';
    if (args.length > 0) {
        source = args[0];
    }
    if (args.length > 1) {
        outputDir = args[1];
    }
    try {
        // Determine if it's a URL or local file
        if (source.startsWith('http://') || source.startsWith('https://')) {
            await generateWrappersFromUrl(source, outputDir);
        }
        else if (source.endsWith('.json')) {
            // If it's a .json file, load it as an ABI object
            const jsonContent = fs.readFileSync(source, 'utf8');
            const abiObject = JSON.parse(jsonContent);
            generateWrappersFromObject(abiObject, outputDir);
        }
        else {
            // Otherwise assume it's an XML file
            await generateWrappersFromFile(source, outputDir);
        }
        console.log('\nWrapper generation completed successfully!');
    }
    catch (error) {
        console.error('\nError generating wrappers:', error);
        process.exit(1);
    }
}
// Run main function if file is executed directly
if (require.main === module) {
    main();
}
