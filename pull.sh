#!/bin/bash

set -u

LOCAL_PATH="."

mkdir -p ${LOCAL_PATH}/webapp/node/
rsync -avr isu1:~/webapp/node/ "${LOCAL_PATH}/webapp/node/"
mkdir -p ${LOCAL_PATH}/webapp/sql/
rsync -avr isu1:~/webapp/sql/ "${LOCAL_PATH}/webapp/sql/"
rsync -avr isu1:~/env.sh "${LOCAL_PATH}/"

for i in $(seq 1 3); do
  host="isu${i}"
  mkdir -p ${LOCAL_PATH}/${host}/etc/systemd/system/
  rsync -avr ${host}:/etc/hosts "${LOCAL_PATH}/${host}/etc/"
  rsync -avr ${host}:/etc/systemd/system/isupipe-node.service "${LOCAL_PATH}/${host}/etc/systemd/system/"
  mkdir -p ${LOCAL_PATH}/${host}/etc/mysql/
  rsync -avr ${host}:/etc/mysql/ "${LOCAL_PATH}/${host}/etc/mysql/"
  mkdir -p ${LOCAL_PATH}/${host}/etc/pdns/
  rsync -avr ${host}:/etc/powerdns/ "${LOCAL_PATH}/${host}/etc/powerdns/"
  mkdir -p ${LOCAL_PATH}/${host}/etc/nginx/
  rsync -avr ${host}:/etc/nginx/ "${LOCAL_PATH}/${host}/etc/nginx/"
done


