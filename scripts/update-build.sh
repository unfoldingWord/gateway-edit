#!/bin/bash
build_hash_dir=public/build_number
build_commit_hash=$(git rev-parse --short HEAD)
echo "$build_commit_hash" > "$build_hash_dir"
echo "Setting current build hash: $build_commit_hash"

build_context_dir=public/build_context
echo "$CONTEXT" > "$build_context_dir"
echo "Setting build CONTEXT: $CONTEXT"

build_branch_dir=public/build_branch
echo "$BRANCH" > "$build_branch_dir"
echo "Setting build BRANCH: $BRANCH"
