#!/bin/bash

# make sure we have latest build hash in public/build_number
source ./scripts/update-build.sh

ENV_FILE=".env.local"
KEY="NEXT_PUBLIC_BUILD_NUMBER"
BUILD_NUMBER=$(cat public/build_number)

echo "Setting environment variable: NEXT_PUBLIC_BUILD_NUMBER=$BUILD_NUMBER"
if ! grep -R "^[#]*\s*${KEY}=.*" $ENV_FILE > /dev/null; then
  echo "APPENDING because '${KEY}' not found"
  echo "$KEY=$BUILD_NUMBER" >> $ENV_FILE
else
  echo "SETTING because '${KEY}' found already"
  sed -ir "s/^[#]*\s*${KEY}=.*/$KEY=$BUILD_NUMBER/" $ENV_FILE
fi

KEY="NEXT_PUBLIC_BUILD_CONTEXT"
BUILD_CONTEXT=$(cat public/build_context)

echo "Setting environment variable: NEXT_PUBLIC_BUILD_CONTEXT=$BUILD_CONTEXT"
if ! grep -R "^[#]*\s*${KEY}=.*" $ENV_FILE > /dev/null; then
  echo "APPENDING because '${KEY}' not found"
  echo "$KEY=$BUILD_CONTEXT" >> $ENV_FILE
else
  echo "SETTING because '${KEY}' found already"
  sed -ir "s/^[#]*\s*${KEY}=.*/$KEY=$BUILD_CONTEXT/" $ENV_FILE
fi

KEY="NEXT_PUBLIC_BUILD_BRANCH"
BUILD_BRANCH=$(cat public/build_branch)

echo "Setting environment variable: NEXT_PUBLIC_BUILD_BRANCH=$BUILD_BRANCH"
if ! grep -R "^[#]*\s*${KEY}=.*" $ENV_FILE > /dev/null; then
  echo "APPENDING because '${KEY}' not found"
  echo "$KEY=$BUILD_BRANCH" >> $ENV_FILE
else
  echo "SETTING because '${KEY}' found already"
  sed -ir "s/^[#]*\s*${KEY}=.*/$KEY=$BUILD_BRANCH/" $ENV_FILE
fi

echo "Environment file: $(cat $ENV_FILE)"
