#!/bin/bash

set -u

LOCAL_PATH="."

mkdir -p ${LOCAL_PATH}/webapp/node/
mkdir -p ${LOCAL_PATH}/isu1/etc/systemd/system/
rsync -avr isu1:~/webapp/node/ "${LOCAL_PATH}/webapp/node/"
rsync -avr isu1:~/env.sh "${LOCAL_PATH}/isu1/"
rsync -avr isu1:/etc/systemd/system/isupipe-node.service "${LOCAL_PATH}/isu1/etc/systemd/system/"

