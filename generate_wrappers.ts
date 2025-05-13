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
  
  // Note: TEPs.ts generation moved to generateTEPsUtilityClass
  
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
    
    // Collect information about all interfaces and their output directories
    const interfaceMappings: { [interfaceName: string]: string } = {};
    
    // Process each source
    for (const source of config.sources) {
      const outputDir = source.outputDir || config.defaultOutputDir || './generated';
      
      console.log(`\nProcessing source: ${source.path} (${source.type})`);
      
      try {
        let parsedAbi: ParsedAbi;
        
        if (source.type === 'url') {
          // Load and parse ABI from URL
          parsedAbi = await loadAndParseAbiFromUrl(source.path);
        } else if (source.type === 'file') {
          // Read and parse ABI from file
          const xmlContent = fs.readFileSync(source.path, 'utf-8');
          parsedAbi = parseAbiXml(xmlContent);
        } else {
          console.error(`Unknown source type: ${(source as any).type}`);
          continue;
        }
        
        // Generate wrappers from object
        const tonAbi = createTonAbiFromObject(parsedAbi);
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
        
        // Generate wrapper classes for each interface and store mappings
        for (const iface of tonAbi.interfaces) {
          const className = tonAbi.normalizeInterfaceName(iface.name);
          const classCode = tonAbi.generateClassForInterface(iface.name);
          const filePath = path.join(outputDir, `${iface.name}.ts`);
          fs.writeFileSync(filePath, classCode);
          console.log(`Wrapper class generated: ${filePath}`);
          generatedFiles.push(filePath);
          
          // Store the mapping of interface name to its output directory
          interfaceMappings[iface.name] = outputDir;
        }
        
        console.log(`\nTotal files generated: ${generatedFiles.length}\n`);
      } catch (error) {
        console.error(`Error processing source ${source.path}:`, error);
        // Continue with next source
      }
    }
    
    // Generate TEPs utility class using collected interfaces information
    generateTEPsUtilityClass(interfaceMappings);
    
    console.log('\nAll sources processed.');
  } catch (error) {
    console.error('Error processing sources configuration:', error);
    throw error;
  }
}

/**
 * Generate TEPs utility class using interface mappings
 * @param interfaceMappings Mapping of interface names to their output directories
 */
function generateTEPsUtilityClass(interfaceMappings: { [interfaceName: string]: string }): void {
  let result = '';
  
  // Add header
  result += `// Automatically generated TEPs (TON Enhancement Proposals) utility class\n\n`;
  result += `import { Address, TupleItem, beginCell, Cell } from '@ton/core';\n`;
  result += `import { Blockchain } from '@ton/sandbox';\n\n`;
  
  // Start class
  result += `/**\n * TEPs - TON Enhancement Proposals standards utility class\n * This class provides methods to check if contracts implement specific standards\n */\n`;
  result += `export class TEPs {\n`;
  
  // Process nft_collection interface if exists
  if (interfaceMappings['nft_collection']) {
    const outputDir = interfaceMappings['nft_collection'];
    result += `  /**\n   * Check if a contract implements the NftCollection standard\n   * @param blockchain Blockchain instance to use for queries\n   * @param address Address of the contract to check\n   * @throws Error if the contract doesn't implement the standard\n   */\n`;
    result += `  public static async IsNftCollectionStandard(blockchain: Blockchain, address: Address): Promise<void> {\n`;
    result += `    // Import the NftCollection class\n`;
    result += `    const { NftCollection } = await import('./${outputDir}/nft_collection');\n`;
    result += `    const instance = new NftCollection(blockchain, address);\n`;
    result += `    \n`;
    result += `    // Test all required get-methods for this interface\n`;
    result += `    await instance.testGet_collection_data();\n`;
    result += `    await instance.testGet_nft_address_by_index(0n);\n`;
    result += `    await instance.testGet_nft_content(0n, beginCell().endCell());\n`;
    result += `  }\n\n`;
  }
  
  // Process nft_item interface if exists
  if (interfaceMappings['nft_item']) {
    const outputDir = interfaceMappings['nft_item'];
    result += `  /**\n   * Check if a contract implements the NftItem standard\n   * @param blockchain Blockchain instance to use for queries\n   * @param address Address of the contract to check\n   * @throws Error if the contract doesn't implement the standard\n   */\n`;
    result += `  public static async IsNftItemStandard(blockchain: Blockchain, address: Address): Promise<void> {\n`;
    result += `    // Import the NftItem class\n`;
    result += `    const { NftItem } = await import('./${outputDir}/nft_item');\n`;
    result += `    const instance = new NftItem(blockchain, address);\n`;
    result += `    \n`;
    result += `    // Test all required get-methods for this interface\n`;
    result += `    await instance.testGet_nft_data();\n`;
    result += `    \n`;
    result += `    // Test all required send-methods for this interface\n`;
    result += `    // Create a valid test address for TON\n`;
    result += `    const testAddress = Address.parse("EQA-qlZ1_NLqTbVP8fFcxpYxBvX8uKvwzEXCw_AYXbTJV5vN");\n`;
    result += `    // This call may fail, which is expected during standard detection\n`;
    result += `    await instance.testsendTransfer(0n, testAddress, testAddress, null, 0n, beginCell().endCell());\n`;
    result += `    // This call may fail, which is expected during standard detection\n`;
    result += `    await instance.testsendGet_static_data(0n);\n`;
    result += `  }\n\n`;
  }
  
  // Process sbt_item interface if exists
  if (interfaceMappings['sbt_item']) {
    const outputDir = interfaceMappings['sbt_item'];
    result += `  /**\n   * Check if a contract implements the SbtItem standard\n   * @param blockchain Blockchain instance to use for queries\n   * @param address Address of the contract to check\n   * @throws Error if the contract doesn't implement the standard\n   */\n`;
    result += `  public static async IsSbtItemStandard(blockchain: Blockchain, address: Address): Promise<void> {\n`;
    result += `    // Import the SbtItem class\n`;
    result += `    const { SbtItem } = await import('./${outputDir}/sbt_item');\n`;
    result += `    const instance = new SbtItem(blockchain, address);\n`;
    result += `    \n`;
    result += `    // Test all required get-methods for this interface\n`;
    result += `    await instance.testGet_authority_address();\n`;
    result += `  }\n\n`;
  }
  
  // Add other interfaces as needed
  
  // Close class
  result += `}\n`;
  
  // Write TEPs.ts to file
  const tepsPath = path.join('.', 'TEPs.ts');
  fs.writeFileSync(tepsPath, result);
  console.log(`TEPs utility class generated: ${tepsPath}`);
}

/**
 * Function for launching generation from command line
 */
async function main() {
  // Check if URL or file path was provided as argument
  const args = process.argv.slice(2);
  
  // If no arguments provided, use abi_sources.json by default
  if (args.length === 0) {
    const configPath = './abi_sources.json';
    if (fs.existsSync(configPath)) {
      await generateWrappersFromConfig(configPath);
      console.log('\nWrapper generation from abi_sources.json completed successfully!');
      return;
    } else {
      console.log('abi_sources.json not found, specify source manually or create the config file');
      process.exit(1);
    }
  }
  
  // If arguments are provided, use them
  let source = args[0];
  let outputDir = args.length > 1 ? args[1] : './generated';
  
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