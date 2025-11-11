#!/bin/sh

# simple health check script
curl -f http://localhost:80/ || exit 1