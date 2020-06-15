#!/bin/sh
set -euo pipefail
IFS=$'\n\t'
[ "${VERBOSE:-}" != true ]|| set -x
cd /vts/vts-engine
echo "***********************************************"
echo "* Starting..."
echo "***********************************************"
echo ""
export NODE_ENV=production
node index.js -port $PORT -id $ID -route $ROUTE -email me@place.com -mongo_connection $MONGO_CONNECTION -logpath /logs
echo ""
echo "###############################################"
echo "##            VTS up and running             ##"
echo "###############################################"