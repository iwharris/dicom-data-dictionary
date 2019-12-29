# dicom-data-dictionary

dictionary of DICOM data elements, built directly from the published standard at dicom.nema.org

## Installation

To install the latest version of the dictionary (ie. latest specification from dicom.nema.org):

```bash
npm install @iwharris/dicom-data-dictionary
```

To install a specific revision (eg. 2016c):

```bash
npm install @iwharris/dicom-data-dictionary@2016c
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

1. Check out `master` and create a new branch, naming it `revision/<REVISION_STRING>`. For example:

```bash
git checkout master
git pull
git checkout -b revision/2020a
```

1. Push the branch.

```bash
git push origin revision/2020a
```

1. Follow the build steps from the previous section, fetching the latest spec and generating the dictionary module.

```bash
# dicom.nema.com labels the latest spec as 'current' instead of a revision string like '2020a'.
# The following step assumes that 'current' is pointing to the '2020a' revision.
npm run fetch current
npm run build downloaded/2020a/part06.xml
```

1. Commit the new `src/index.ts` module to the branch.

```bash
git add src/index.ts
git commit -m "revision 2020a"
```

1. Increment the package version for the new revision. Each new revision should be a new minor release.

```bash
npm version minor
```

1. Add a git tag that points to the revision.

```
git tag -f 2020a
git push --tags
```

1. Publish the package to NPM and update the `current` and `latest` tags to point to this version.

```bash
npm publish --tag 2020a --access public
npm dist-tag add @iwharris/dicom-data-dictionary@<VERSION_NUMBER> current
npm dist-tag add @iwharris/dicom-data-dictionary@<VERSION_NUMBER> latest
```

1. Check the dist-tags on the package to make sure that they are pointing to the correct versions.

```bash
npm dist-tag ls
```

1. Merge the branch back into master to ensure that it has the latest revision.

```bash
git checkout master
git merge 2020a
git push
```
