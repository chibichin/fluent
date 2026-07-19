@echo off
set /p OPENAI_API_KEY=Paste your OpenAI API key: 
set AI_PROVIDER=openai
if "%OPENAI_MODEL%"=="" set OPENAI_MODEL=gpt-5-mini
node server.mjs
