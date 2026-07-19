# FluentLoop v1.3 testing guide

## Automated server test

Run:

```bash
npm test
```

Expected result: `status: passed`.

The automated test uses `AI_PROVIDER=mock`. This validates the client/server contract and JSON structure, not semantic language quality.

## Tested browser integration flow

A fresh headless Chromium document was loaded with a deterministic test connector. The test completed:

1. AI health status changes to `Test mode`.
2. Submit the first Conversation transcript.
3. Render structured feedback with a source badge.
4. Add three patterns to Learning Memory.
5. Click `Say it again`.
6. Submit a retry.
7. Render before/after comparison.
8. Confirm retry does not append an extra follow-up question.
9. Open Learning Memory.
10. Analyze and save a vocabulary sentence.

No JavaScript runtime exception was detected in this flow.

## Real OpenAI connection test

1. Start `start-openai.sh` or `start-openai.bat`.
2. Open `http://127.0.0.1:4173`.
3. Open **Status**.
4. Click **Check AI connection**.
5. Confirm the badge says `AI connected` and displays the provider/model.
6. Submit a Conversation response containing a real personal opinion.
7. Confirm the feedback source says `AI feedback` rather than `Local fallback`.
8. Check that corrections preserve the original meaning and do not exceed three.
9. Use `Say it again`; confirm the second response shows a comparison.
10. Open **Learning Library → Learning memory** and confirm patterns were saved.

## Fallback test

1. Start offline mode.
2. Submit a Conversation response.
3. Confirm recording and transcript are saved.
4. Confirm feedback clearly says `Local fallback`.
5. Confirm the app does not claim semantic AI understanding.

## Sentence-feedback test

1. Open Learning Library.
2. Choose an active expression.
3. Click **Make a sentence**.
4. Save a sentence with an intentional error.
5. Confirm source label, natural version, expression-use result, correction category, and next review date.
6. Open **Review now** and confirm the sentence history is gray and read-only.

## Device tests still required

- Actual microphone permission
- Real recording quality
- Browser speech-to-text
- IndexedDB persistence after browser restart
- Live API account authentication, rate limits, and model availability
