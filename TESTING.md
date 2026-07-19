# FluentLoop v1.1 Test Summary

## Automated checks passed

- JavaScript syntax validation (`node --check`)
- Page loads without JavaScript errors
- System self-test UI renders
- Active button receives `is-active` and `aria-pressed=true`
- New vocabulary sentence is saved
- Sentence history is gray and contains no editable fields
- Press-and-hold recording enters recording state
- Releasing creates a playable audio preview
- Recording is attached to the conversation turn
- Saved recording is playable in the session summary

## Test environment note

The automated browser environment blocks navigation to local test origins. MediaRecorder and IndexedDB were therefore exercised through deterministic browser API test doubles for the interaction test. The app's built-in **Status → Run self-test** performs a real IndexedDB write/read/delete check in the user's browser. Microphone permission and actual device audio must be verified manually on the target browser.

## Recommended manual device test

1. Open `index.html` in Chrome or Edge.
2. Go to **Status** and run self-test.
3. Grant microphone permission.
4. Hold **Hold to speak** for 3–5 seconds, then release.
5. Play the recording, type or edit the transcript, and send.
6. End the session and replay the saved recording.
7. Reload the page and confirm saved sentence history remains available.


## v1.1.1 regression checks

- Learn toolbar contains only `Comprehension` and `Finish reading`.
- Coach transcript textarea appears before `Hold to speak`.
- `Hear question` is absent from the Coach interface.
- Hold-to-record event handlers remain attached after reordering.
