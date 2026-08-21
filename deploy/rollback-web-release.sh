#!/usr/bin/env bash

set -Eeuo pipefail

readonly expected_root='/www/wwwroot/borrowed.miniserver.fun'
readonly expected_url='https://borrowed.miniserver.fun'
readonly expected_user='borrowed-deploy'

fail() {
    printf 'rollback-web-release: %s\n' "$*" >&2
    exit 1
}

site_root=''
release_sha=''
production_url=''

while [[ $# -gt 0 ]]; do
    case "$1" in
        --root)
            [[ $# -ge 2 ]] || fail 'missing value for --root'
            site_root=$2
            shift 2
            ;;
        --sha)
            [[ $# -ge 2 ]] || fail 'missing value for --sha'
            release_sha=$2
            shift 2
            ;;
        --url)
            [[ $# -ge 2 ]] || fail 'missing value for --url'
            production_url=${2%/}
            shift 2
            ;;
        *) fail "unknown argument: $1" ;;
    esac
done

[[ $site_root == "$expected_root" ]] || fail 'unexpected deployment root'
[[ $production_url == "$expected_url" ]] || fail 'unexpected production URL'
[[ $release_sha =~ ^[0-9a-f]{40}$ ]] || fail 'release id must be a 40-character lowercase commit SHA'
[[ $(id -un) == "$expected_user" ]] || fail "must run as $expected_user"

deploy_root="$site_root/deploy"
releases_directory="$deploy_root/releases"
release_directory="$releases_directory/$release_sha"
current_link="$deploy_root/current"
[[ -d $release_directory && -f "$release_directory/release.json" ]] || fail 'requested release is not retained'
[[ $(<"$release_directory/release.json") == "{\"sha\":\"${release_sha}\"}" ]] || \
    fail 'requested release marker is invalid'

previous_target=''
if [[ -L $current_link ]]; then
    previous_target=$(readlink "$current_link")
    [[ $previous_target == releases/bootstrap || $previous_target =~ ^releases/[0-9a-f]{40}$ ]] || \
        fail 'current symlink has an unexpected target'
elif [[ -e $current_link ]]; then
    fail 'current path exists but is not a symlink'
fi

switch_link="$deploy_root/.current.rollback.$$"
ln -s "releases/$release_sha" "$switch_link"
mv -Tf "$switch_link" "$current_link"

restore_previous_release() {
    if [[ -n $previous_target ]]; then
        local restore_link="$deploy_root/.current.restore.$$"
        ln -s "$previous_target" "$restore_link"
        mv -Tf "$restore_link" "$current_link"
    elif [[ -L $current_link ]]; then
        unlink "$current_link"
    fi
}

release_response=$(curl --fail --silent --show-error --location --retry 3 --retry-all-errors \
    --connect-timeout 5 --max-time 20 --header 'ngsw-bypass: true' \
    "${production_url}/release.json") || {
    restore_previous_release
    fail 'rollback health check request failed; previous release restored'
}

if [[ $release_response != "{\"sha\":\"${release_sha}\"}" ]]; then
    restore_previous_release
    fail 'rollback health check returned a different release; previous release restored'
fi

printf 'Rolled back to release %s\n' "$release_sha"
