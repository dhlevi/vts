#!/bin/sh
set -euo pipefail
IFS=$'\n\t'
[ "${VERBOSE:-}" != true ]|| set -x
cd /vts/vts
echo "***********************************************"
echo "* Starting..."
echo "***********************************************"
echo ""
node index.js -port $PORT -admin admin -password password -email me@place.com -mongo_connection $MONGO_CONNECTION -logpath ./logs
echo ""
echo "###############################################"
echo "##            VTS up and running             ##"
echo "###############################################"