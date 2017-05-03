#!/bin/sh

set -e

version=v0.6.4
os=`uname | tr '[:upper:]' '[:lower:]'`

curl -OL https://github.com/subosito/snowboard/releases/download/${version}/snowboard-${version}.${os}-amd64.tar.gz
tar -zxvf snowboard-${version}.${os}-amd64.tar.gz

./snowboard html -i docker/docker.apib -o web/api.html

rm snowboard-${version}.${os}-amd64.tar.gz snowboard
