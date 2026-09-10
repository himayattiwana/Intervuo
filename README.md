# Intervuo

An interview practice platform that reads your actual resume, asks you questions about it, and scores how you answered them out loud.

Most interview prep tools hand you a generic question bank. Intervuo parses the resume you upload, pulls out the skills and experience that are really on it, and prompts Gemini to write questions grounded in that specific content. You then answer by speaking. The app transcribes you, and grades the answer on three separate signals: what you said, how you said it, and what your face was doing while you said it.

**[Live demo](https://intervuo.netlify.app/)** · Sign in with `admin` / `admin`

---

## How it works

```
resume.pdf
    │
    ▼
 text extraction (pdfminer.six)  ──►  skills, contact details, experience level
    │
    ▼
 Gemini 2.5 Flash  ──►  questions written against your resume, not a template
    │
    ▼
 you answer out loud
    │
    ├── speech to text (browser Web Speech API)  ──►  content score   (Gemini)
    ├── the transcript                           ──►  delivery score  (VADER + TextBlob)
    └── webcam frames every 2s                   ──►  composure score (FER+ ONNX)
                                                          │
                                                          ▼
                                              weighted 0.6 / 0.25 / 0.15
                                                          │
                                                          ▼
                                      per-answer feedback and an end-of-session report
```

### The three scores

**Content (weight 0.6).** The question, your answer, the field and the experience level go back to Gemini, which returns a score plus specific notes on what worked and what did not. The prompt asks for concrete feedback tied to what you actually said, and the call retries with backoff and falls back to a template response if Gemini is unavailable, so a bad API moment degrades the session instead of ending it.

**Delivery (weight 0.25).** VADER handles polarity, TextBlob supplements it, and a hand-written pass counts hedges and filler ("um", "uh", "I think", "maybe") and checks sentence length against a roughly 15-word target for clarity. Rule-based rather than learned, which makes it explainable: you can see exactly which words cost you.

**Composure (weight 0.15).** Frames are captured from the webcam every two seconds. OpenCV's Haar cascade finds the face, and FER+ (`emotion-ferplus-8.onnx`, run through ONNX Runtime) classifies the expression. If the model or runtime is unavailable the backend drops to a crude brightness-based heuristic rather than failing the request.

The weights and the penalty curves in `calculate_combined_score` were tuned by hand over several passes — the comments in that function record what was changed and why, because the first version was harsh enough to be discouraging rather than useful.

---

## Stack

| Layer | Built with |
|---|---|
| Frontend | React 19, Vite, deployed on Netlify |
| Speech to text | Browser Web Speech API via `react-speech-recognition` |
| Face framing | Native `FaceDetector` API, falling back to TensorFlow.js BlazeFace |
| API | Flask, served by Gunicorn |
| Question generation and content scoring | Google Gemini (`gemini-2.5-flash`) |
| Resume parsing | pdfminer.six, PyPDF2 |
| Sentiment | vaderSentiment, TextBlob |
| Facial expression | OpenCV Haar cascade, FER+ via ONNX Runtime |
| Storage | MySQL (`interview_sessions`, `interview_answers`) |

---

## Running it locally

You need Python 3.9, Node 18, a MySQL instance and a Gemini API key ([free tier here](https://aistudio.google.com/apikey)).

**Backend**

```bash
cd Smart_Resume_Analyser_App-master
pip install -r requirements.txt
cp config.py.example config.py     # then put your Gemini key in it
python api.py                      # serves on :5000
```

Database settings come from the environment, with local defaults: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (default `sra`), `DB_PORT`. When `DB_HOST` is `localhost` the tables are created on startup; against a remote host the database is expected to exist already.

Resume analysis works without a database. Sessions, saved answers and the final report need MySQL.

**Frontend**

```bash
npm install
npm run dev                        # serves on :5173
```

Point it at the API with `VITE_API_BASE_URL` in a `.env` file; it defaults to `http://localhost:5000`. If you deploy the frontend to Netlify, set that variable in the Netlify environment too, or the built site will call localhost and quietly fail.

Use Chrome or Edge. Transcription relies on the browser's native speech recognition, which Firefox and Safari do not implement.

---

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/analyze-resume` | PDF in; skills, level, resume score, tips, courses and generated questions out |
| POST | `/api/create-session` | Opens a session, returns a UUID |
| POST | `/api/analyze-answer` | Question, answer text and video frames in; the three sub-scores and combined score out |
| POST | `/api/save-answer` | Persists an answer with its scores and the recorded audio |
| GET | `/api/get-session-report/<id>` | Full session: every answer, its scores, and the average |
| GET | `/api/health` | Reports whether sentiment and facial analysis loaded |

---

## Current state

Honest notes on what is and is not finished:

- Real signup/login now exists (bcrypt-hashed passwords, JWT sessions) alongside a demo `admin`/`admin` gate for quick exploration. A `@thapar.edu` signup email unlocks the previous-year question-matching feature.
- CORS is open. Fine for a demo deployment, not for anything real.
- Recorded audio is stored but never transcribed server-side; transcription is entirely the browser's.
