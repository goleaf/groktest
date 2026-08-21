#!/usr/bin/env bash

set -Eeuo pipefail

readonly expected_root='/www/wwwroot/borrowed.miniserver.fun'
readonly expected_url='https://borrowed.miniserver.fun'
readonly expected_user='borrowed-deploy'

fail() {
    printf 'activate-web-release: %s\n' "$*" >&2
    exit 1
}

warn() {
    printf 'activate-web-release warning: %s\n' "$*" >&2
}

site_root=''
release_sha=''
staging_directory=''
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
        --staging-dir)
            [[ $# -ge 2 ]] || fail 'missing value for --staging-dir'
            staging_directory=$2
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
incoming_root="$deploy_root/shared/incoming"
staging_prefix="$incoming_root/"
[[ $staging_directory == "$staging_prefix"* ]] || fail 'staging directory is outside deploy/shared/incoming'
staging_name=${staging_directory#"$staging_prefix"}
[[ $staging_name =~ ^[0-9a-f]{40}-[0-9]+-[0-9]+$ ]] || fail 'invalid staging directory name'
[[ -d $staging_directory ]] || fail 'staging directory does not exist'

archive_name="borrowed-web-${release_sha}.tar.gz"
archive="$staging_directory/$archive_name"
checksum="$archive.sha256"
activator="$staging_directory/activate-web-release.sh"
[[ -f $archive ]] || fail 'release archive does not exist'
[[ -f $checksum ]] || fail 'release checksum does not exist'
[[ -f $activator ]] || fail 'transferred activator does not exist'

(
    cd "$staging_directory"
    sha256sum --check "${archive_name}.sha256"
) || fail 'release archive checksum verification failed'

while IFS= read -r archive_entry; do
    normalized_entry=${archive_entry#./}
    [[ -z $normalized_entry ]] && continue
    [[ $normalized_entry != /* ]] || fail 'archive contains an absolute path'
    [[ $normalized_entry != '..' && $normalized_entry != ../* && $normalized_entry != */../* ]] || \
        fail 'archive contains parent traversal'
done < <(tar -tzf "$archive")

while IFS= read -r verbose_entry; do
    entry_type=${verbose_entry:0:1}
    [[ $entry_type != l && $entry_type != h ]] || fail 'archive contains a link entry'
done < <(tar -tvzf "$archive")

releases_directory="$deploy_root/releases"
current_link="$deploy_root/current"
mkdir -p "$releases_directory"

temporary_release=$(mktemp -d "$releases_directory/.${release_sha}.tmp.XXXXXX")
cleanup_temporary_release() {
    if [[ -n ${temporary_release:-} && -d $temporary_release ]]; then
        rm -rf -- "$temporary_release"
    fi
}
cleanup_on_exit() {
    local exit_status=$?
    cleanup_temporary_release
    exit "$exit_status"
}
trap cleanup_on_exit EXIT

tar --no-same-owner --no-same-permissions -xzf "$archive" -C "$temporary_release"

for required_file in index.html manifest.webmanifest ngsw.json ngsw-worker.js release.json; do
    [[ -f "$temporary_release/$required_file" ]] || fail "release is missing $required_file"
done
[[ $(<"$temporary_release/release.json") == "{\"sha\":\"${release_sha}\"}" ]] || \
    fail 'release marker does not match requested SHA'
grep -Fq "<meta name=\"borrowed-release\" content=\"${release_sha}\">" \
    "$temporary_release/index.html" || fail 'HTML release marker does not match requested SHA'

find "$temporary_release" -type d -exec chmod 0755 {} +
find "$temporary_release" -type f -exec chmod 0644 {} +

release_directory="$releases_directory/$release_sha"
if [[ -e $release_directory ]]; then
    [[ -d $release_directory && -f "$release_directory/release.json" ]] || \
        fail 'existing release path is invalid'
    [[ $(<"$release_directory/release.json") == "{\"sha\":\"${release_sha}\"}" ]] || \
        fail 'existing release marker does not match requested SHA'
    cleanup_temporary_release
    temporary_release=''
else
    mv "$temporary_release" "$release_directory"
    temporary_release=''
fi

previous_target=''
if [[ -L $current_link ]]; then
    previous_target=$(readlink "$current_link")
    [[ $previous_target == releases/bootstrap || $previous_target =~ ^releases/[0-9a-f]{40}$ ]] || \
        fail 'current symlink has an unexpected target'
elif [[ -e $current_link ]]; then
    fail 'current path exists but is not a symlink'
fi

switch_link="$deploy_root/.current.${release_sha}.$$"
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

health_check() {
    local release_response
    release_response=$(curl --fail --silent --show-error --location --retry 3 --retry-all-errors \
        --connect-timeout 5 --max-time 20 --header 'ngsw-bypass: true' \
        "${production_url}/release.json") || return 1
    [[ $release_response == "{\"sha\":\"${release_sha}\"}" ]] || return 1

    curl --fail --silent --show-error --location --retry 3 --retry-all-errors \
        --connect-timeout 5 --max-time 20 --header 'ngsw-bypass: true' \
        "${production_url}/index.html" | \
        grep -Fq "<meta name=\"borrowed-release\" content=\"${release_sha}\">"
}

if ! health_check; then
    warn 'health check failed; restoring the previous release'
    restore_previous_release
    exit 1
fi

cleanup_old_releases() {
    local active_release
    local kept_inactive=0
    local release_path
    active_release=$(readlink -f "$current_link")

    while IFS= read -r release_path; do
        [[ -n $release_path ]] || continue
        [[ $release_path == "$releases_directory/"* ]] || return 1
        [[ $release_path != "$active_release" ]] || continue
        if ((kept_inactive < 5)); then
            ((kept_inactive += 1))
            continue
        fi
        rm -rf -- "$release_path"
    done < <(
        find "$releases_directory" -mindepth 1 -maxdepth 1 -type d \
            -regextype posix-extended -regex '.*/[0-9a-f]{40}' -printf '%T@ %p\n' |
            sort -nr | cut -d' ' -f2-
    )
}

cleanup_old_releases || warn 'old release cleanup did not complete'
rm -rf -- "$staging_directory" || warn 'staging cleanup did not complete'

printf 'Activated release %s\n' "$release_sha"
