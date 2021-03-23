#!/bin/bash
build_hash_dir=public/build_number

build_commit_hash=$(git rev-parse --short HEAD)

echo "$build_commit_hash" > "$build_hash_dir"
echo "Setting current build hash: $build_commit_hash"
