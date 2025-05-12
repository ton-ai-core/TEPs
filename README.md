# TON Enhancement Proposals (TEPs) TypeScript Library

A TypeScript library for working with TON blockchain contracts that implement standard interfaces defined in TON Enhancement Proposals (TEPs).

## Features

- Automatically generates TypeScript interfaces and wrapper classes from XML ABI definitions
- Provides methods to detect if contracts implement specific standards (NFT Collection, NFT Item, SBT, etc.)
- Creates appropriate wrapper instances for each standard
- Handles inheritance relationships between standards
- Tests all available methods when checking contract compatibility

## Installation

```bash
npm install
```

## Usage

### Generate Wrappers

```bash
npx ts-node generate_wrappers.ts
```

This will create TypeScript wrapper classes in the `generated` directory based on the XML ABI definitions.

### Using the TEPs Class

```typescript
import { Address } from '@ton/core';
import { Blockchain } from '@ton/sandbox';
import { TEPs } from './TEPs';

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
    
    // Now you can use the wrapper methods based on the wrapper type
    if (await TEPs.IsNftItemStandard(blockchain, address)) {
      const { NftItem } = await import('./generated/nft_item');
      
      // Check if the wrapper is an NftItem instance
      if (wrapper instanceof NftItem) {
        const data = await wrapper.get_nft_data();
        console.log('NFT Data:', data);
      }
    }
  }
}
```

## License

MIT 