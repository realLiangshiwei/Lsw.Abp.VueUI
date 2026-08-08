#!/usr/bin/env bash
# Capture the framework endpoint responses used as CI fixtures.
# Run against a live test backend, then commit the result.
set -euo pipefail

HOST="${ABP_BACKEND_URL:-https://localhost:44384}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/e2e/fixtures"

if ! curl -sk --max-time 5 -o /dev/null "$HOST/api/abp/api-definition"; then
  echo "Backend not reachable at $HOST"
  echo "  docker start abpvue-mongo"
  echo "  cd e2e/backend/BookStore/src/BookStore.HttpApi.Host && dotnet run"
  exit 1
fi

mkdir -p "$OUT"

capture() {
  curl -sk "$HOST/api/abp/$1" | python3 -m json.tool > "$OUT/$2"
  echo "  $2  $(wc -c < "$OUT/$2" | tr -d ' ') bytes"
}

capture "application-configuration?includeLocalizationResources=false" application-configuration.json
capture "application-localization?cultureName=en&onlyDynamics=false"    application-localization.en.json
capture "api-definition?includeTypes=true"                              api-definition.json
