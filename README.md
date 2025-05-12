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
  try {
    await TEPs.IsNftItemStandard(blockchain, address);
    console.log('Contract implements NFT Item standard');
  } catch (error) {
    console.log('Contract does not implement NFT Item standard:', error.message);
  }
  
  try {
    await TEPs.IsNftCollectionStandard(blockchain, address);
    console.log('Contract implements NFT Collection standard');
  } catch (error) {
    console.log('Contract does not implement NFT Collection standard:', error.message);
  }
  
  try {
    await TEPs.IsSbtStandard(blockchain, address);
    console.log('Contract implements SBT standard');
  } catch (error) {
    console.log('Contract does not implement SBT standard:', error.message);
  }
  
  // Using in test suites
  test('Contract implements NFT Item standard', async () => {
    // This will throw an error if the standard is not implemented
    await TEPs.IsNftItemStandard(blockchain, contractAddress);
  });
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
- Throws exceptions when standards are not implemented

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