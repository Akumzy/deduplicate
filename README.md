# deduplicate

[![Build Status](https://travis-ci.com/Akumzy/deduplicate.svg?branch=master)](https://travis-ci.com/Akumzy/deduplicate)
[![Coverage Status](https://coveralls.io/repos/github/Akumzy/deduplicate/badge.svg?branch=master)](https://coveralls.io/github/Akumzy/deduplicate?branch=master)

⚠️ Documentaion is very much incomplete but you can always checkout the test file for usage guide.

## Introduction

This package provides all the necessaries utility functions to implements file de-duplication ranging from splitting file content to blocks, generating hash and merging the file blocks together without corrupting the file.

## Installation

```bash
    npm install @akumzy/dd
    # Or
    yarn add @akumzy/dd
```

## Usage

```ts
import Dedupe from '@akumzy/dd`

```

- `Dedupe.deduplicate` is used for creating file blocks and hash.

```ts
Dedupe.deduplicate(
    path: string,
    chunk?: number,
    algorithm?: string
): Promise<Dedupe.HashObject>
```

- path: File absolute path.
- chunk: Block size in bytes
  - default: `500 * 1024` (500kb)
- algorithm: Algorithm to use for hash file.
  - default: `sha256`

**Example**

```js
const ONE_MAGA_BYTES = 1024 * 1024
let filePath = 'path-to-file'
let info = await deduplicate(filePath, ONE_MAGA_BYTES)
console.log(info) // =>
//  {
//     hash: 'f27a663ef8df8091e94d07ba090449a34b68461b9af5557377423057ce902484',
//     blocks: [
//       {
//         order: 1,
//         start: 0,
//         end: 281,
//         hash: '673c83b6fd07ba91954d4bc88f631bbe31bb9675b6c44b635801157c0ba94861'
//       }
//     ]
//   }
```

- `Dedupe.createBlocks` is used for writing blocks to disk.

```ts
Dedupe.createBlocks(
    options: Deduplicate.CreateBlocksOptions
): Promise<void>;
```

**Example**

```ts
await createBlocks({
  input: filePath,
  bucket: directoryToSaveBlocks,
  blocks: info.blocks
})
```
