echo "Initializing database"
echo "---------------------"
node dist/db-setup/db-init.script.js
node dist/test/setup.script.js
echo ""

echo "Starting micro-services"
echo "-----------------------"
node dist/db-interactor/db-interaction.service.js &
dbi_pid=$!
node dist/lo-suggestion/lo-suggestion.service.js &
los_pid=$!

sleep 1.5
echo ""

if [ "$1" ]
then script=$1
else script="*"
fi

echo "Running tests"
echo "-------------"
for file in dist/test/$script.tape.js
do
    if ! node $file
    then fail="darn"
    fi
done

echo "Cleaning up..."
kill $los_pid # lo-suggestion
kill $dbi_pid # db-interactor

if [ "$fail" ]
then exit 1
fi
