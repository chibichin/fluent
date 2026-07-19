# FluentLoop Local Working Build v1.3

**AI Feedback & Learning Memory**

V1.3 keeps the recording and local-data foundation from V1.2, then adds a secure local AI connector. The browser never contains the AI API key.

## What works

- Press-and-hold microphone recording
- Original-audio playback and IndexedDB persistence
- Recording Library, individual download/delete, and ZIP archive export
- Browser speech-to-text when supported
- AI Conversation feedback through the local Node server
- AI sentence feedback in Learning Library
- Retry comparison for `Say it again`
- Structured corrections with category, correction, explanation, and severity
- Learning Memory for repeated grammar, word-choice, collocation, and naturalness patterns
- Local rule-based fallback when AI is unavailable
- Clear source labels: `AI feedback`, `Test feedback`, or `Local fallback`
- Real-data Progress and Status pages

## Important distinction

- **AI feedback** means the local Node server successfully contacted the configured model.
- **Test feedback** is deterministic integration-test output. It is not semantic AI.
- **Local fallback** uses a small set of browser rules. It is not full AI understanding.

## Start the app

Read [START_HERE.md](START_HERE.md).

### OpenAI mode

macOS/Linux:

```bash
./start-openai.sh
```

Windows:

```bat
start-openai.bat
```

Then open:

```text
http://127.0.0.1:4173
```

The default model is `gpt-5-mini`. Override it with the `OPENAI_MODEL` environment variable. OpenAI API usage may incur charges on the API account.

### Offline mode

```bash
./start-offline.sh
```

or on Windows:

```bat
start-offline.bat
```

### Interface test mode

```bash
./start-test.sh
```

or:

```bat
start-test.bat
```

Test mode is prominently labelled and must not be used to judge language-feedback quality.

## Data storage

| Data | Location |
|---|---|
| Progress, transcripts, feedback, Learning Memory | Browser Local Storage |
| Original recordings | Browser IndexedDB (`FluentLoopAudioDB`) |
| API key | Local Node process environment only |
| Exported recordings | User-selected Downloads folder as audio or ZIP |

## AI feedback structure

Conversation and sentence feedback use the same structure:

- content response
- strengths
- natural version
- up to three important corrections
- target-expression usage
- reusable Learning Memory items
- follow-up question for a normal Conversation turn
- before/after comparison for a retry

## Known limitations

- A transcript is required for grammar and meaning analysis.
- Browser transcription support varies.
- V1.3 does not score pronunciation, stress, rhythm, or linking.
- There is no account, cloud sync, or multi-device audio sync.
- The OpenAI path was integration-tested without a live account key; run **Status → Check AI connection** after configuring your own key.

## Tests

```bash
npm test
```

This starts the server in labelled test mode and validates:

- health endpoint
- Conversation structured feedback
- retry comparison
- sentence feedback
- static-app serving

See [TESTING.md](TESTING.md) and [TEST_REPORT.json](TEST_REPORT.json).
