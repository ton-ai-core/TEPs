# TON Enhancement Proposals (TEPs) TypeScript Library

A TypeScript library for working with TON blockchain contracts that implement standard interfaces defined in TON Enhancement Proposals (TEPs).

## Installation

```bash
npm install @ton-ai-core/teps
```

## Usage

```typescript
import { Address } from '@ton/core';
import { Blockchain } from '@ton/sandbox';
import { TEPs } from '@ton-ai-core/teps';

async function example() {
  // Create a blockchain instance
  const blockchain = await Blockchain.create();
  
  // Example address
  const address = Address.parse('EQBInPs62kcCSGDwnCTx0FLzgNpu_t6sTca-mOXInYPBISzT');
  
  // Check what standards are implemented
  const isNft = await TEPs.IsNftItemStandard(blockchain, address);
  const isCollection = await TEPs.IsNftCollectionStandard(blockchain, address);
  const isSbt = await TEPs.IsSbtStandard(blockchain, address);
  
  console.log(`Is NFT: ${isNft}`);
  console.log(`Is Collection: ${isCollection}`);
  console.log(`Is SBT: ${isSbt}`);
  
  // Automatically create the right type of wrapper
  const wrapper = await TEPs.createFromAddress(blockchain, address);
  
  if (wrapper) {
    console.log(`Created wrapper of type: ${wrapper.constructor.name}`);
    
    // Now you can use the wrapper methods based on its type
    if (await TEPs.IsNftItemStandard(blockchain, address)) {
      // Access NFT item data
      const data = await wrapper.get_nft_data();
      console.log('NFT Data:', data);
    }
    
    if (await TEPs.IsNftCollectionStandard(blockchain, address)) {
      // Access NFT collection data
      const collectionData = await wrapper.get_collection_data();
      console.log('Collection Data:', collectionData);
    }
  }
}
```

## Supported Standards

- NFT Collection (TEP-62)
- NFT Item (TEP-62)
- SBT (TEP-62)
- Editable
- NFT Item Simple

## Core Features

- Automatic detection of contract standards
- Type-safe wrapper generation
- Support for all standard methods
- Simple interface to interact with different contract types

## Development

To build the library:

```bash
npm run build
```

To regenerate wrappers from ABI definitions:

```bash
npm run generate
```

## License

MIT 