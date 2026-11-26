#!/bin/bash
# Rebuilds ../cheerpj/harness.jar — the in-browser test runner used by the Java practice problems.
# Needs a JDK 17+ on your machine. The site only needs the built jar, not this script.
set -e
cd "$(dirname "$0")"
rm -rf build && mkdir -p build ../cheerpj
javac --release 17 -nowarn -d build src/reviewer/*.java
jar --create --file ../cheerpj/harness.jar -C build .
rm -rf build
echo "Built cheerpj/harness.jar ($(wc -c < ../cheerpj/harness.jar | tr -d ' ') bytes)"
