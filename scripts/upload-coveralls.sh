#!/bin/bash

ENV_FILE=".env"

if [[ -z "${COVERALLS_REPO_TOKEN}" ]]; then
  echo "COVERALLS_REPO_TOKEN is not set in environment, reading"
  export $(grep -v '^#' .env | xargs)
fi

if [[ -z "${CYPRESS_TEST_USERNAME}" ]]; then
  echo "CYPRESS_TEST_USERNAME found: ${CYPRESS_TEST_USERNAME}"
fi

if [[ -z "${env.COVERALLS_REPO_TOKEN}" ]]; then
  echo "env.COVERALLS_REPO_TOKEN found: ${env.COVERALLS_REPO_TOKEN}"
  export COVERALLS_REPO_TOKEN=${env.COVERALLS_REPO_TOKEN}
fi

if [[ -z "${secret.CYPRESS_TEST_USERNAME}" ]]; then
  echo "secret.CYPRESS_TEST_USERNAME found: ${secret.CYPRESS_TEST_USERNAME}"
  export COVERALLS_REPO_TOKEN=${secret.COVERALLS_REPO_TOKEN}
fi

if [[ -z "${COVERALLS_REPO_TOKEN}" ]]; then
  echo "COVERALLS_REPO_TOKEN could not be found"
fi

yarn upload
