# staging or prod
MODE=$1
WEBSITE_DIR=`pwd`

# clean up dist directory
rm ./build.js

# build script
webpack -p --env.prod

