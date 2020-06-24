# staging or prod
MODE=$1
WEBSITE_DIR=`pwd`

# clean up dist directory
rm -rf ./dist
mkdir dist

# copy static assets
cp -r ./img dist
cp ./index.html dist/

# build script
webpack -p --env.prod

