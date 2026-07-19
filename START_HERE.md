# FluentLoop v1.3 — Start here

## Requirements

- Node.js 18 or newer
- Chrome or Edge for the best recording and browser-transcription support

## Real AI mode

### macOS / Linux

Run:

```bash
./start-openai.sh
```

### Windows

Double-click or run:

```bat
start-openai.bat
```

Paste the API key when prompted. Then open:

```text
http://127.0.0.1:4173
```

The API key is passed to the local Node process. It is not written into `index.html`, Local Storage, IndexedDB, or exported backups.

## Offline mode

Use `start-offline.sh` or `start-offline.bat`. Recording, vocabulary, sentence history and local fallback feedback continue to work, but results are explicitly marked `Local fallback`.

## Test mode

Use `start-test.sh` or `start-test.bat`. This mode is deterministic and intended only for checking the interface. It is labelled `Test mode` and is not semantic AI.

## Verify the build

Run:

```bash
npm test
```

In the app, also open **Status → Run self-test**.
