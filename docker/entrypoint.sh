#!/bin/bash

# Get PUID/PGID
PUID=${PUID:-911}
PGID=${PGID:-911}
BASH_SOURCE=${BASH_SOURCE:-$0}

add_user() {
    groupmod -o -g "$PGID" abc
    usermod -o -u "$PUID" abc
}

change_user() {
    if [ "$(id -u)" = $PUID ]; then
        echo "
        User uid:    $PUID
        User gid:    $PGID
        "
    elif [ "$(id -u)" = "0" ]; then
        # If container is started as root then create a new user and switch to it
        add_user
        chown -R $PUID:$PGID /data

        echo "Switching to dedicated user"
        exec gosu $PUID "$BASH_SOURCE"
    fi
}


check_postgres_connection(){
    if    [[ -n ${POSTGRES_HOST} \
          && -n ${POSTGRES_PASSWORD} \
          && -n ${POSTGRES_USER}  \
          && -z ${DATABASE_URL+x} ]];then
        export DATABASE_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/linkwarden"
    fi
}

load_secrets() {
    # All the environment variables will support a `_FILE` suffix that allows
    # for setting the environment variable through the Docker Compose secret
    # pattern.
    mapfile -t secret_supported_vars < variables_list.txt
    # If any secrets are set, prefer them over base environment variables.
    for var in "${secret_supported_vars[@]}"; do
        file_var="${var}_FILE"
        if [ -n "${!file_var}" ]; then
            export "$var=$(<"${!file_var}")"
        fi
    done
}

add_user
change_user
load_secrets
check_postgres_connection

echo "Deploying via prisma..."
npx prisma migrate deploy

echo "Starting server"
yarn start
