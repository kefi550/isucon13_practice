#!/bin/bash

set -eu

LOCAL_PATH="."

for i in $(seq 1 3); do
  host="isu${i}"
  rsync -avr --exclude='node_modules' "${LOCAL_PATH}/webapp/node/" ${host}:~/webapp/node/ 
  rsync -avr "${LOCAL_PATH}/webapp/sql/" ${host}:~/webapp/sql/
  rsync -avr "${LOCAL_PATH}/env.sh" ${host}:~/
  ssh ${host} 'bash -l -c "cd ~/webapp/node/; npm exec tsc; sudo systemctl restart isupipe-node;"'
done
