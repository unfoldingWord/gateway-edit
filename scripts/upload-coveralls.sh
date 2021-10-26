#!/bin/bash

ENV_FILE=".env"

if [[ -z "${COVERALLS_REPO_TOKEN}" ]]; then
  echo "COVERALLS_REPO_TOKEN is not set in environment, reading"
  export $(grep -v '^#' .env | xargs)
fi

if [[ -z "${COVERALLS_REPO_TOKEN}" ]]; then
  echo "COVERALLS_REPO_TOKEN could not be found"
fi

yarn upload
