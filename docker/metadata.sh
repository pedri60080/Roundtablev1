#!/usr/bin/env bash
IMAGE_NAME="roundtable-v1"
SERVICE_NAME="roundtable-v1"
CONTAINER_PORT="8080"
ROUTE_PREFIX="/apps/roundtable-v1/"
DATA_SUBDIR="roundtable-v1"
COMPOSE_ENV=$'      ConnectionStrings__DefaultConnection: Data Source=/app/data/roundtable.db;Foreign Keys=True\n      DemoSeedData__FilePath: /app/data/DemoSeedData.json\n'
