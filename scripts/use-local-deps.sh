#!/bin/bash

# Script to run the application with all local dependencies
# Usage: ./scripts/use-local-deps.sh

# Set all local dependencies to true
USE_LOCAL_RCL=true
USE_LOCAL_SCRIPTURE_RCL=true
USE_LOCAL_GITEA_TOOLKIT=true
USE_LOCAL_SCRIPTURE_RESOURCES_RCL=true

# Print which local dependencies are being used
echo "Using local dependencies:"
echo "- translation-helps-rcl"
echo "- single-scripture-rcl"
echo "- gitea-react-toolkit"
echo "- scripture-resources-rcl"

# Run the application with all local dependencies
VITE_USE_LOCAL_RCL=$USE_LOCAL_RCL \
VITE_USE_LOCAL_SCRIPTURE_RCL=$USE_LOCAL_SCRIPTURE_RCL \
VITE_USE_LOCAL_GITEA_TOOLKIT=$USE_LOCAL_GITEA_TOOLKIT \
VITE_USE_LOCAL_SCRIPTURE_RESOURCES_RCL=$USE_LOCAL_SCRIPTURE_RESOURCES_RCL \
yarn dev:vite
