# dicom-data-dictionary

dictionary of DICOM data elements, built directly from the published standard at dicom.nema.org

## Installation

```bash
npm install @iwharris/dicom-data-dictionary
```

## Usage

```typescript
const dictionary = require('@iwharris/dicom-data-dictionary');

console.log(dictionary.revision);
// '2014b'
// This depends on which dictionary revision is installed

console.log(dictionary.tags.SeriesNumber);
// '(0020,0011)'

console.log(dictionary.elements('(0020,0011')));
//{
//   tag: '(0020,0011)',
//   name: 'Series Number',
//   keyword: 'SeriesNumber',
//   vr: 'IS',
//   vm: '1',
//   note: '',
//   isRetired: false
//}

console.log(dictionary.get_element('SeriesNumber'));
// Same as above

console.log(dictionary.get_element('00200011'));
// Same as above

console.log(dictionary.get_element('0020,0011'));
// Same as above
```

## Development

The dictionary is built directly from the DICOM specification, section 3.6.

Clone and install dev dependencies:

```bash
# Check out the latest source and install dependencies
git clone git@github.com:iwharris/dicom-data-dictionary.git

cd dicom-data-dictionary

npm install
```

Build the dictionary module with one command:

```bash
npm run full-build <revision>
```

Replace `<revision>` with the desired specification revision, eg. "2014b". If omitted, the script will pull the `current` revision.

Alternately, you can run the build steps individually:

```bash

# Fetch the desired revision
npm run fetch 2014b

# Build the .ts module
npm run build downloaded/2014b/part06.xml --ignore-errors

# Lint the generated module
npm run prettier

# Run unit tests on the generated module
npm test

# Compile Typescript (useful for publishing to npm)
npm run compile
```

## Publishing a new revision

-   Follow the build steps from the previous section
-   Commit `src/index.ts` to source control if changed
-   TODO
