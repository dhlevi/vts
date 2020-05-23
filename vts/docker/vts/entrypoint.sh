#!/bin/sh
set -euo pipefail
IFS=$'\n\t'
[ "${VERBOSE:-}" != true ]|| set -x
cd /vts
echo "***********************************************"
echo "* NPM install log"
echo "***********************************************"
echo ""
cd /vts/vts
npm install
echo ""
echo "***********************************************"
echo "* Starting..."
echo "***********************************************"
echo ""
node index.js -port $PORT -admin admin -password password -email me@place.com -mongo_connection $MONGO_CONNECTION -logpath ./logs
echo ""
echo "###############################################"
echo "##            VTS up and running             ##"
echo "###############################################"