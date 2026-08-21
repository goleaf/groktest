#!/usr/bin/env bash

set -Eeuo pipefail

readonly deploy_user='borrowed-deploy'
readonly site_root='/www/wwwroot/borrowed.miniserver.fun'
readonly deploy_root="$site_root/deploy"
readonly vhost='/www/server/panel/vhost/nginx/borrowed.miniserver.fun.conf'

fail() {
    printf 'bootstrap-aapanel-server: %s\n' "$*" >&2
    exit 1
}

public_key_file=''
nginx_config_file=''

while [[ $# -gt 0 ]]; do
    case "$1" in
        --public-key-file)
            [[ $# -ge 2 ]] || fail 'missing value for --public-key-file'
            public_key_file=$2
            shift 2
            ;;
        --nginx-config-file)
            [[ $# -ge 2 ]] || fail 'missing value for --nginx-config-file'
            nginx_config_file=$2
            shift 2
            ;;
        *) fail "unknown argument: $1" ;;
    esac
done

[[ $(id -u) -eq 0 ]] || fail 'must run as root'
[[ -f $public_key_file ]] || fail 'public key file does not exist'
[[ -f $nginx_config_file ]] || fail 'Nginx configuration file does not exist'
[[ -f $vhost ]] || fail 'aaPanel vhost does not exist'

public_key=$(tr -d '\r\n' < "$public_key_file")
[[ $public_key =~ ^ssh-ed25519[[:space:]][A-Za-z0-9+/=]+([[:space:]].*)?$ ]] || \
    fail 'public key must be one Ed25519 key'
grep -Fq 'server_name borrowed.miniserver.fun;' "$nginx_config_file" || \
    fail 'Nginx configuration has the wrong server name'
grep -Fq 'root /www/wwwroot/borrowed.miniserver.fun/deploy/current;' "$nginx_config_file" || \
    fail 'Nginx configuration has the wrong document root'

if ! id "$deploy_user" >/dev/null 2>&1; then
    useradd --create-home --shell /bin/bash --user-group "$deploy_user"
fi
[[ $(id -u "$deploy_user") -ne 0 ]] || fail 'deployment user cannot be root'
passwd --lock borrowed-deploy >/dev/null

deploy_home=$(getent passwd "$deploy_user" | cut -d: -f6)
[[ $deploy_home == "/home/$deploy_user" ]] || fail 'deployment user has an unexpected home directory'
install -d -o "$deploy_user" -g "$deploy_user" -m 0700 "$deploy_home/.ssh"
authorized_keys="$deploy_home/.ssh/authorized_keys"
install -o "$deploy_user" -g "$deploy_user" -m 0600 /dev/null "$authorized_keys"
printf 'restrict %s\n' "$public_key" > "$authorized_keys"
chown "$deploy_user:$deploy_user" "$authorized_keys"
chmod 0600 "$authorized_keys"

install -d -o root -g root -m 0755 "$site_root"
install -d -o "$deploy_user" -g www -m 0755 "$deploy_root"
install -d -o "$deploy_user" -g www -m 0755 "$deploy_root/releases"
install -d -o "$deploy_user" -g www -m 0755 "$deploy_root/shared"
install -d -o "$deploy_user" -g www -m 0755 "$deploy_root/shared/incoming"

bootstrap_release="$deploy_root/releases/bootstrap"
install -d -o "$deploy_user" -g www -m 0755 "$bootstrap_release"
if [[ -f "$site_root/index.html" && ! -L "$site_root/index.html" ]]; then
    install -o "$deploy_user" -g www -m 0644 "$site_root/index.html" "$bootstrap_release/index.html"
else
    printf '<!doctype html><title>Borrowed deployment bootstrap</title>\n' > "$bootstrap_release/index.html"
    chown "$deploy_user:www" "$bootstrap_release/index.html"
    chmod 0644 "$bootstrap_release/index.html"
fi
printf '{"sha":"bootstrap"}\n' > "$bootstrap_release/release.json"
chown "$deploy_user:www" "$bootstrap_release/release.json"
chmod 0644 "$bootstrap_release/release.json"

bootstrap_link="$deploy_root/.current.bootstrap.$$"
ln -s releases/bootstrap "$bootstrap_link"
mv -Tf "$bootstrap_link" "$deploy_root/current"
chown -h "$deploy_user:www" "$deploy_root/current"

backup_suffix=$(date -u +%Y%m%dT%H%M%SZ)
vhost_backup="${vhost}.borrowed-backup-${backup_suffix}"
cp -a "$vhost" "$vhost_backup"

restore_vhost() {
    cp -a "$vhost_backup" "$vhost"
    nginx -t >/dev/null 2>&1 || true
    nginx -s reload >/dev/null 2>&1 || true
}

install -o root -g root -m 0644 "$nginx_config_file" "$vhost"
if ! nginx -t; then
    restore_vhost
    fail "Nginx validation failed; restored $vhost_backup"
fi
if ! nginx -s reload; then
    restore_vhost
    fail "Nginx reload failed; restored $vhost_backup"
fi

printf 'Provisioned %s; vhost backup: %s\n' "$deploy_user" "$vhost_backup"
