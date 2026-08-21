#!/usr/bin/env bash

set -Eeuo pipefail

fail() {
    printf 'package-web-release: %s\n' "$*" >&2
    exit 1
}

[[ $# -eq 3 ]] || fail 'usage: package-web-release.sh <sha> <build-directory> <output-directory>'

release_sha=$1
build_directory=$2
output_directory=$3

[[ $release_sha =~ ^[0-9a-f]{40}$ ]] || fail 'release id must be a 40-character lowercase commit SHA'
[[ -d $build_directory ]] || fail "build directory does not exist: $build_directory"
mkdir -p "$output_directory"
[[ -d $output_directory ]] || fail "output directory does not exist: $output_directory"

required_files=(index.html manifest.webmanifest ngsw.json ngsw-worker.js)
for required_file in "${required_files[@]}"; do
    [[ -f "$build_directory/$required_file" ]] || fail "required PWA file is missing: $required_file"
done

find "$build_directory" -maxdepth 1 -type f -name '*.js' -print -quit | grep -q . || \
    fail 'the Angular build contains no JavaScript bundle'
grep -q '<head>' "$build_directory/index.html" || fail 'index.html does not contain a head element'
grep -q 'name="borrowed-release"' "$build_directory/index.html" && \
    fail 'index.html already contains a borrowed release marker'
grep -Eiq '[[:space:]]on[a-z]+[[:space:]]*=' "$build_directory/index.html" && \
    fail 'index.html contains CSP-incompatible inline event handlers'

temporary_directory=$(mktemp -d "${TMPDIR:-/tmp}/borrowed-package.XXXXXX")
cleanup() {
    local exit_status=$?
    rm -rf -- "$temporary_directory"
    exit "$exit_status"
}
trap cleanup EXIT

package_directory="$temporary_directory/package"
mkdir -p "$package_directory"
cp -a "$build_directory/." "$package_directory/"

RELEASE_SHA=$release_sha perl -0pi -e \
    's#<head>#<head><meta name="borrowed-release" content="$ENV{RELEASE_SHA}">#' \
    "$package_directory/index.html"
printf '{"sha":"%s"}\n' "$release_sha" > "$package_directory/release.json"

archive_name="borrowed-web-${release_sha}.tar.gz"
archive="$output_directory/$archive_name"

if tar --help 2>&1 | grep -q -- '--sort'; then
    tar --sort=name --mtime='UTC 1970-01-01' --owner=0 --group=0 --numeric-owner \
        -C "$package_directory" -czf "$archive" .
else
    COPYFILE_DISABLE=1 tar -C "$package_directory" -czf "$archive" .
fi
(
    cd "$output_directory"
    sha256sum "$archive_name" > "${archive_name}.sha256"
)

printf 'Packaged %s\n' "$archive"
