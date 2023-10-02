#!/bin/bash

# Wait for the MySQL database to become available
echo "Waiting for MySQL database to become available..."
sleep 30

# Continue with the Express app startup
exec "$@"