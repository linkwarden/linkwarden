#! /bin/sh
set -e

# Fix permissions for non-root users (excluding mounted volume /data/data and
# large directories like node_modules).
find /data \
     -path /data/data -prune -o \
     -path '*/node_modules' -prune -o \
     -type d -exec chmod 777 {} + 2>/dev/null || true

# Drop privileges if PUID/PGID are set.
if [ -n "$PUID" ] && [ -n "$PGID" ]; then
    exec gosu "$PUID:$PGID" env HOME=/data/home "$@"
else
    exec "$@"
fi
