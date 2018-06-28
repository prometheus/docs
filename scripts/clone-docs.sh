#!/bin/bash

REPOS=(prometheus)

ROOT=$(git rev-parse --show-toplevel)

TMP_DIR=$(mktemp -d)

for repo in $REPOS; do
    git clone https://github.com/prometheus/$repo $TMP_DIR/$repo

    LATEST=$(cat ${ROOT}/versions.json | jq -r ".${repo}.latest")
    VERSIONS=$(cat ${ROOT}/versions.json | jq -r ".${repo}.all | .[]")
    
    cd $TMP_DIR/$repo

    git checkout release-${LATEST}
    cp -rf docs $ROOT/content/docs/prometheus/latest

    for version in $VERSIONS; do
        echo "Copying docs for ${repo} version $version"
        git checkout release-$version
        git status
        cp -rf $TMP_DIR/prometheus/docs $ROOT/content/docs/prometheus/$version
        echo "Finished copying docs for ${repo} version $version"
    done
done