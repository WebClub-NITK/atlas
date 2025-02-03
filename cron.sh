#!/bin/bash

if [ -z "$1" ]; then
  MINUTES=$1
else
  MINUTES=$"{DEFAULT_DOCKER_STOP_TIMEOUT:-60}"
fi


CURRENT_TIME=$(date +%s)

docker ps --format '{{.ID}}' | while read -r CONTAINER_ID; do
  STARTED_AT=$(docker inspect --format '{{.State.StartedAt}}' "$CONTAINER_ID")
  STARTED_TIME=$(date --date="$STARTED_AT" +%s 2>/dev/null)
  RUNNING_TIME=$(( (CURRENT_TIME - STARTED_TIME) / 60 ))

  # TODO: Add container specific timeout
  # CONTAINER_SPECIFIC_VAR_NAME=DOCKER_STOP_TIMEOUT_$CONTAINER_ID
  # CONTAINER_SPECIFIC_TIMEOUT=${!CONTAINER_SPECIFIC_VAR_NAME:-$MINUTES}

  if [ "$RUNNING_TIME" -gt "$MINUTES" ]; then
    CONTAINER_NAME=$(docker inspect --format '{{.Name}}' "$CONTAINER_ID" | sed 's/^\///')
    echo "Stopping container $CONTAINER_NAME (ID: $CONTAINER_ID) running for $RUNNING_TIME minutes..."
    docker stop "$CONTAINER_ID"
  fi
done