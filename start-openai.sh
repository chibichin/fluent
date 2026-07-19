#!/usr/bin/env sh
printf 'OpenAI API key (input hidden): '
stty -echo
read OPENAI_API_KEY
stty echo
printf '\n'
export OPENAI_API_KEY
export AI_PROVIDER=openai
export OPENAI_MODEL="${OPENAI_MODEL:-gpt-5-mini}"
node server.mjs
