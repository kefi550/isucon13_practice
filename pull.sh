#!/bin/bash

set -u

LOCAL_PATH="."

mkdir -p ${LOCAL_PATH}/webapp/node/
rsync -avr isu1:~/webapp/node/ "${LOCAL_PATH}/webapp/node/"

for i in $(seq 1 3); do
  host="isu${i}"
  mkdir -p ${LOCAL_PATH}/${host}/etc/systemd/system/
  rsync -avr ${host}:~/env.sh "${LOCAL_PATH}/${host}/"
  rsync -avr ${host}:/etc/hosts "${LOCAL_PATH}/${host}/etc/"
  rsync -avr ${host}:/etc/systemd/system/isupipe-node.service "${LOCAL_PATH}/${host}/etc/systemd/system/"
  mkdir -p ${LOCAL_PATH}/${host}/etc/mysql/
  rsync -avr ${host}:/etc/mysql/ "${LOCAL_PATH}/${host}/etc/mysql/"
done


