#!/bin/bash

# DICOM revision; eg. "2014a" (default: "current")
REVISION=${1:-current}
TEMP_DIR=./downloaded

mkdir -p "${TEMP_DIR}"

# Download the file to the temp directory
wget -N -O "${TEMP_DIR}/${REVISION}.xml" "http://dicom.nema.org/medical/dicom/${REVISION}/source/docbook/part06/part06.xml"