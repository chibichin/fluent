# FluentLoop Local Working Build v1.2

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


## v1.1.2 修正：Say it again

- 點擊後顯示清楚的 Retry mode 面板。
- 錄音鍵變為 `Hold to retry`，送出鍵變為 `Send retry`。
- 顯示上一輪的自然版本，並自動捲動至輸入區。
- 可取消 retry，原始回答仍然保留。
- retry 送出後不會多跳一個新問題。
- retry 紀錄保存來源 turn ID。


## v1.2 — Recording Library

- 新增 Learning Library → `Recordings`。
- 錄音重新整理後仍可從 IndexedDB 讀取與播放。
- 每筆錄音顯示 transcript、自然修正版、日期、模式、長度和檔案大小。
- 可下載或單筆永久刪除錄音。
- 可刪除全部音訊，但保留文字、糾正與進度紀錄。
- 新增單一 ZIP Recording Archive，包含所有音訊與 `manifest.json`。
- Status 顯示錄音數量、音訊大小、瀏覽器儲存估算和持久儲存狀態。
- 支援向瀏覽器要求 persistent storage。
- 新錄音會把 transcript、問題與 retry 資訊一併寫入音訊 metadata。


## 測試說明

自動化 Chromium 測試已驗證錄音清單、文字對應、單筆刪除、全部刪除與 ZIP 結構。
自動測試環境禁止導覽到本機或 synthetic origin，因此無法在該環境直接驗證重新整理後的 IndexedDB。
請在實際 Chrome 或 Edge 中執行 `Status → Run self-test`，確認 `IndexedDB & archive` 顯示 Pass。
