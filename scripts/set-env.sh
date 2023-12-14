#!/bin/bash

# make sure we have latest build hash in public/build_number
source ./scripts/update-build.sh

# Set the name of the environment file and the key to update
ENV_FILE=".env.local"

# Get the current build number from the public/build_number file
BUILD_NUMBER=$(cat public/build_number)

# Define a function to set a variable in a .env file
set_env_var() {
  local env_file=$1
  local key=$2
  local value=$3

  echo "Setting environment variable: $key=$value"
  if ! grep -R "^[#]*\s*${key}=.*" $env_file > /dev/null; then
    echo "APPENDING because '$key' not found"
    echo "$key=$value" >> $env_file
  else
    echo "SETTING because '$key' found already"
    # use sed command to performs an in-place replacement of this variable assignment in the script file
    sed -ir "s/^[#]*\s*${key}=.*/$key=$value/" $env_file
  fi
}

# Call the function to set the environment variables
set_env_var $ENV_FILE VITE_PUBLIC_BUILD_NUMBER $BUILD_NUMBER
set_env_var $ENV_FILE VITE_PUBLIC_BUILD_BRANCH $BRANCH
set_env_var $ENV_FILE VITE_PUBLIC_BUILD_CONTEXT $CONTEXT

echo "Environment file new contents: $(cat $ENV_FILE)"

function semMajorVersion() {
  sed -Ee 's/^v([0-9]+)\..*$/\1/'
}

function nodeOptions() {
  nodeMajorVersion=$(node --version | semMajorVersion)

  maxOldSpaceSize="--max_old_space_size=4096"
  openSSLLegacyProvider="--openssl-legacy-provider"

  if [[ $nodeMajorVersion -gt "16" ]]; then
    echo "$maxOldSpaceSize $openSSLLegacyProvider"
  else
    echo "$maxOldSpaceSize"
  fi
}

# NOTE: This code and its transcient dependencies will
# not be needed once we upgrade node verions universally.

# export these variable so that the process executed
# in the package.json.scripts file will inherit them
export NODE_OPTIONS="$(nodeOptions)"

