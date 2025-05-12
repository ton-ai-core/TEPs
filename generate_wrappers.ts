import * as fs from 'fs';
import * as path from 'path';
import { parseAbiXml, loadAndParseAbiFromUrl, ParsedAbi } from './abi_parser';
import { createTonAbiFromObject, TonAbi } from './abi_wrapper';
import * as https from 'https';

/**
 * Interface for ABI source configuration
 */
interface AbiSource {
  type: 'url' | 'file';
  path: string;
  outputDir?: string;
}

/**
 * Interface for ABI sources configuration file
 */
interface AbiSourcesConfig {
  sources: AbiSource[];
  defaultOutputDir?: string;
}

/**
 * Checks and creates a directory if it doesn't exist
 * @param dirPath Path to the directory
 */
function ensureDirectoryExists(dirPath: string): void {
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
export async function generateWrappersFromUrl(
  url: string,
  outputDir: string = 'generated'
): Promise<string[]> {
  console.log(`Loading and parsing ABI from ${url}...`);
  
  try {
    // Load and parse ABI from URL
    const parsedAbi = await loadAndParseAbiFromUrl(url);
    
    return generateWrappersFromObject(parsedAbi, outputDir);
  } catch (error) {
    console.error('Error generating wrappers from URL:', error);
    throw error;
  }
}

/**
 * Save parsed ABI to JSON file for debugging
 * @param abi Parsed ABI object
 * @param outputPath Path to save the JSON file
 */
function saveAbiToJson(abi: ParsedAbi, outputPath: string): void {
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
  } catch (error) {
    console.error('Error saving ABI to JSON:', error);
  }
}

/**
 * Generate TypeScript wrapper files from ABI file
 * @param filePath Path to ABI XML file
 * @param outputDir Output directory for generated files
 * @returns Promise that resolves when all files are generated
 */
export async function generateWrappersFromFile(
  filePath: string,
  outputDir: string = 'generated'
): Promise<string[]> {
  console.log(`Loading and parsing ABI from file ${filePath}...`);
  
  try {
    // Read and parse ABI from file
    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    const parsedAbi = parseAbiXml(xmlContent);
    
    return generateWrappersFromObject(parsedAbi, outputDir);
  } catch (error) {
    console.error('Error generating wrappers from file:', error);
    throw error;
  }
}

/**
 * Generate wrapper files and TEPs utility class
 * @param abiObject Parsed ABI object
 * @param outputDir Output directory
 * @returns Array of generated file paths
 */
export function generateWrappersFromObject(
  abiObject: ParsedAbi,
  outputDir: string = 'generated'
): string[] {
  const tonAbi = createTonAbiFromObject(abiObject);
  const generatedFiles: string[] = [];
  
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
  
  // Generate TEPs utility class
  const tepsCode = tonAbi.generateTEPsClass(outputDir);
  const tepsPath = path.join('.', 'TEPs.ts');
  fs.writeFileSync(tepsPath, tepsCode);
  console.log(`TEPs utility class generated: ${tepsPath}`);
  generatedFiles.push(tepsPath);
  
  console.log(`\nTotal files generated: ${generatedFiles.length}\n`);
  return generatedFiles;
}

/**
 * Generate wrappers from a sources configuration file
 * @param configPath Path to the sources configuration file
 * @returns Promise that resolves when all sources are processed
 */
export async function generateWrappersFromConfig(configPath: string): Promise<void> {
  console.log(`Loading ABI sources configuration from ${configPath}...`);
  
  try {
    // Read and parse the configuration file
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent) as AbiSourcesConfig;
    
    // Process each source
    for (const source of config.sources) {
      const outputDir = source.outputDir || config.defaultOutputDir || './generated';
      
      console.log(`\nProcessing source: ${source.path} (${source.type})`);
      
      try {
        if (source.type === 'url') {
          await generateWrappersFromUrl(source.path, outputDir);
        } else if (source.type === 'file') {
          await generateWrappersFromFile(source.path, outputDir);
        } else {
          console.error(`Unknown source type: ${(source as any).type}`);
        }
      } catch (error) {
        console.error(`Error processing source ${source.path}:`, error);
        // Continue with next source
      }
    }
    
    console.log('\nAll sources processed.');
  } catch (error) {
    console.error('Error processing sources configuration:', error);
    throw error;
  }
}

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
    // Check if the source is a JSON configuration file with multiple sources
    if (source.endsWith('.json')) {
      // Try to parse as a sources configuration file
      try {
        const configContent = fs.readFileSync(source, 'utf-8');
        const config = JSON.parse(configContent);
        
        if (config.sources && Array.isArray(config.sources)) {
          await generateWrappersFromConfig(source);
          console.log('\nWrapper generation from multiple sources completed successfully!');
          return;
        }
      } catch (configError) {
        // If not a configuration file, treat as a regular ABI JSON file
        console.log("JSON file doesn't contain a valid sources configuration. Treating as a single ABI source.");
      }
    }
    
    // Determine if it's a URL or local file
    if (source.startsWith('http://') || source.startsWith('https://')) {
      await generateWrappersFromUrl(source, outputDir);
    } else if (source.endsWith('.json')) {
      // If it's a .json file, load it as an ABI object
      const jsonContent = fs.readFileSync(source, 'utf8');
      const abiObject = JSON.parse(jsonContent) as ParsedAbi;
      generateWrappersFromObject(abiObject, outputDir);
    } else {
      // Otherwise assume it's an XML file
      await generateWrappersFromFile(source, outputDir);
    }
    
    console.log('\nWrapper generation completed successfully!');
  } catch (error) {
    console.error('\nError generating wrappers:', error);
    process.exit(1);
  }
}

// Run main function if file is executed directly
if (require.main === module) {
  main();
} 