#!/bin/bash
 
NODE_ENV=${NODE_ENV:-production}

yarn prisma migrate deploy

exec "$@"
