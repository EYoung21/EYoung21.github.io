#!/usr/bin/env bash
# Refresh contribution JSON for the skyline viewer.
set -euo pipefail

USER="${1:-EYoung21}"
OUT_DIR="$(cd "$(dirname "$0")" && pwd)/data"
mkdir -p "$OUT_DIR"

START_YEAR=$(gh api "users/${USER}" --jq '.created_at[:4]')
END_YEAR=$(date +%Y)

echo "Fetching ${USER} contributions (${START_YEAR}–${END_YEAR})…"

for y in $(seq "$START_YEAR" "$END_YEAR"); do
  gh api graphql -f query="
  query {
    user(login: \"${USER}\") {
      login
      contributionsCollection(from: \"${y}-01-01T00:00:00Z\", to: \"${y}-12-31T23:59:59Z\") {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }" --jq "{
    username: .data.user.login,
    year: ${y},
    total: .data.user.contributionsCollection.contributionCalendar.totalContributions,
    weeks: [.data.user.contributionsCollection.contributionCalendar.weeks[] | {
      days: [.contributionDays[] | {count: .contributionCount, date: .date}]
    }]
  }" > "${OUT_DIR}/${y}.json"
  echo "  ${y}: $(jq -r .total "${OUT_DIR}/${y}.json") contributions"
done

echo "Done → ${OUT_DIR}"
