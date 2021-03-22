#!/bin/sh
ENV_FILE=".env.local"
BUILD_NUMBER=$(cat public/build_number)

echo "NEXT_PUBLIC_BUILD_NUMBER=$BUILD_NUMBER" > $ENV_FILE
