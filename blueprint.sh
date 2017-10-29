#!/usr/bin/env sh

set -e

version=v1.1.0
os=`uname | tr '[:upper:]' '[:lower:]'`

curl -OL https://github.com/subosito/snowboard/releases/download/${version}/snowboard-${version}.${os}-amd64.tar.gz
tar -zxvf snowboard-${version}.${os}-amd64.tar.gz

mkdir -p doc
./snowboard html -o doc/api.html api.apib
