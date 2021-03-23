#!/bin/bash

# make sure we have latest build hash in public/build_number
source ./scripts/update-build.sh

ENV_FILE=".env.local"
BUILD_NUMBER=$(cat public/build_number)

echo "NEXT_PUBLIC_BUILD_NUMBER=$BUILD_NUMBER" > $ENV_FILE
echo "Setting environment variable: NEXT_PUBLIC_BUILD_NUMBER=$BUILD_NUMBER"
