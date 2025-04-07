#!/bin/bash

for container in $(docker ps -q); do
    timeout_label=$(docker inspect --format='{{ index .Config.Labels "timeout" }}' "$container")
    if [[ -z "$timeout_label" ]] || [[ "$timeout_label" -eq -1 ]]; then
        continue
    fi

    started_at=$(docker inspect --format='{{.State.StartedAt}}' "$container")
    container_start_time=$(date -d "$started_at" +%s)
    current_time=$(date +%s)
    running_time=$(( current_time - container_start_time ))
    if (( running_time > timeout_label )); then
        echo "Removing container $container which ran for $running_time seconds (> $timeout_label seconds timeout)."
        docker rm -f "$container"
    fi
done

psql -h localhost -U postgres -d atlas_db -c '\x' -c "DELETE FROM atlas_backend_container where (created_at < now() - interval '10 minutes');"
