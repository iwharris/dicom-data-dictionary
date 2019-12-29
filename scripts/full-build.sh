#!/bin/bash

# Terminate on any error
set -e

# DICOM revision; eg. "2014a" (default: "current")
REVISION=${1:-current}
BASE_DIR="./downloaded"
OUT_DIR="${BASE_DIR}/${REVISION}"
XML_NAME="part06.xml"

# Download file
scripts/fetch.sh "${REVISION}" "${BASE_DIR}"

# Parse file and generate ts module
npm run -s build ${OUT_DIR}/${XML_NAME}

# Run tests and lint
npm run -s prettier
npm test

# Compile typescript
npm run compile