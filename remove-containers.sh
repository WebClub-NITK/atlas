#!/bin/bash

# Get the list of container IDs and names that have been running for more than 10 minutes
containers=$(sudo docker ps --filter "status=running" --format "{{.ID}} {{.Names}} {{.RunningFor}}" | grep -E '([0-9]+) (minutes|hours|days)' | awk '$3 > 10 && $4 == "minutes" {print $1, $2}')

# Check if there are any containers to delete
if [ -z "$containers" ]; then
  echo "No containers running for more than 10 minutes."
else
  # Stop and remove the containers, ignoring those whose names start with atlas_
  while read -r container; do
    container_id=$(echo $container | awk '{print $1}')
    container_name=$(echo $container | awk '{print $2}')
    if [[ $container_name != atlas_* ]]; then
      echo "Stopping and removing container $container_id ($container_name)"
      sudo docker stop $container_id
      sudo docker rm $container_id
    else
      echo "Ignoring container $container_id ($container_name)"
    fi
  done <<< "$containers"
fi
