#!/bin/bash

# DICOM revision; eg. "2014a" (default: "current")
REVISION=${1:-current}
BASE_DIR=${2:-"./downloaded"}
OUT_DIR="${BASE_DIR}/${REVISION}"

mkdir -p ${BASE_DIR}

# Download the file to the temp directory
wget -N -P ${OUT_DIR} "http://dicom.nema.org/medical/dicom/${REVISION}/source/docbook/part06/part06.xml"