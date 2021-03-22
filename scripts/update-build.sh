#!/bin/sh
build_hash_dir=public/build_number
build_hash=`cat "$build_hash_dir"`

build_hash_split=(${build_hash//-/ })
build_number=(${build_hash_split[0]})
build_commit_hash=$(git rev-parse --short HEAD)

echo "$build_number-$build_commit_hash" > "$build_hash_dir"
echo "Current build number: $build_number-$build_commit_hash"
