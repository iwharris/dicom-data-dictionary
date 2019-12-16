# dicom-data-dictionary
dictionary of DICOM data elements, built directly from the published standard at dicom.nema.org

## Installation

```bash
npm install @iwharris/dicom-data-dictionary
```

## Usage

```typescript
const dictionary = require('@iwharris/dicom-data-dictionary');

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

You can build it yourself from the latest specification:

```bash
# Check out the latest source and install dependencies
git clone git@github.com:iwharris/dicom-data-dictionary.git

cd dicom-data-dictionary

npm install

# Fetch the latest specification XML (requires wget)
npm run fetch

# Build src/index.ts from the specification
npm run build

# Commit src/index.ts to source control if changed

# Compile Typescript (useful for publishing to npm)
npm run compile
```