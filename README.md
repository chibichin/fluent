# FluentLoop Local Working Build v1.1.1

Open `index.html` in a modern Chromium-based browser. Chrome or Edge is recommended for microphone and optional speech transcription.

## v1.1 working features

- Clear primary, secondary, active, disabled and recording button states
- Press-and-hold microphone recording; release to stop
- Immediate playback of the original recording
- Record again before sending
- Optional browser speech transcription with editable transcript
- Audio stored locally as Blob data in IndexedDB
- Conversation turns save recording IDs, transcript, corrections and retries
- Session summary can replay saved recordings
- Learning Library `Review now` displays read-only gray sentence history
- `Make a sentence` creates a new history item with original and locally corrected versions
- Conversation target expressions also create sentence-history entries, including audio when available
- System Status tests Local Storage, interface, schema and IndexedDB audio read/write/delete

## Important limitations

- Conversation and sentence corrections use a small local rule set, not a connected AI model.
- Browser speech transcription is optional and is not supported consistently across browsers.
- JSON export contains text/state data only. Audio remains in IndexedDB in the current browser.
- Microphone permission must be granted by the user.

## Manual v1.1 test

1. Open Status and run self-test.
2. Open Conversation Coach.
3. Hold `Hold to speak`, speak for several seconds, then release.
4. Play the original recording.
5. Edit or type the transcript and send.
6. End the session and replay the saved recording in the summary.
7. Open Learning Library and make a sentence with a target expression.
8. Open `Review now`; confirm entries are gray and cannot be edited.


## v1.1.1 介面調整

- Learn 頁移除 `Simplify one level`。
- Coach 頁把 `Hold to speak` 移到 transcript 輸入框正下方。
- Coach 頁移除 `Hear question`。
