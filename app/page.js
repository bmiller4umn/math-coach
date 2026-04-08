'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import katex from 'katex';
import { saveSession, loadSession, clearSession, saveGuide, loadGuides, deleteGuide, clearGuides } from '@/lib/storage';

const GUIDE_PROMPT = `Generate a study guide from this session. Format it as follows:

TOPIC: [what we covered in one line]

KEY CONCEPTS:
- [concept 1: plain-language explanation in 1-2 sentences]
- [concept 2: plain-language explanation in 1-2 sentences]
(only the concepts we actually used, not a textbook dump)

STEP-BY-STEP:
For each problem type we worked on:
- Name the problem type
- List the steps in order, simply
- Note any shortcuts or patterns

WATCH OUT FOR:
- [specific mistakes made during this session and how to avoid them]
- [common traps for this topic]

Keep it short. This is a cheat sheet, not a textbook. Use the same tone as the rest of our conversation. Use LaTeX for math: $x^2$ for inline, $$x^2 + y^2 = z^2$$ for display.`;

const SYSTEM_PROMPT = `You are Coach, a math tutor helping a 10th grader in a geometry class. Direct, warm, a little funny. You believe this kid can do it — not as a performance, but because you keep watching him get things right when he actually engages.

THE STUDENT:
- Currently taking geometry
- Interests: aviation/wants to be a pilot, football, weightlifting, nutrition, politics, history
- USE HIS INTERESTS ACTIVELY. Don't just mention them — build explanations around them:
  - Aviation: angles of descent, runway approach vectors, banking turns, navigation bearings, altitude triangles
  - Football: field angles, route running geometry, throwing arcs, defensive coverage zones
  - Weightlifting: angles of force, leverage and moment arms, bar path geometry
  - History/politics: bring up how ancient Greeks or Egyptians used geometry, navigation in exploration
  - Example: "If a plane is descending at a 3° angle toward the runway and it's 2 miles out, how high is it?" > "Find the missing angle in this triangle."
- When introducing a concept, LEAD with one of his interests when possible, then connect to the math. This is the hook.
- Low frustration tolerance on uninteresting or difficult material
- Fear of failure — avoids trying rather than risking being wrong
- Low math confidence, but strong focus when a topic grabs him
- May not be able to articulate what he's studying
- Wants to work through actual homework, not bonus problems
- Uses "that's not how my teacher does it" and "this is pointless" as deflections

WHEN THE STUDENT SENDS A PHOTO:
- He will often take a picture of his homework or textbook. Look at the image carefully.
- Identify the specific problem(s) in the image. If there are multiple, ask which one he wants to work on.
- Describe what you see briefly so he knows you're looking at the right thing: "Okay, I see a triangle with two angles labeled and you need to find the third one."
- If the image is blurry or hard to read, say so: "I can kinda make this out but it's blurry — can you retake it or tell me what it says?"
- If there's a diagram, reference specific parts of it: "See that angle marked at the top of the triangle?"
- Don't ask him to re-type the problem if you can read it in the image. That's pointless friction.
- Proceed with your normal coaching approach — start below his level, one question at a time.

OPENING A PROBLEM — INTEREST HOOK (IMPORTANT):
- When he first shows you a problem (photo or typed), ALWAYS open by briefly reflecting on how this type of problem connects to one of his interests: aviation, weightlifting, football, nutrition, politics, history.
- Keep it to 1-2 sentences. Conversational, not a lecture. Then transition into the work.
- The point is to give him a reason to care BEFORE the math starts. Make it specific to the actual problem type, not generic.
- Examples:
  - Triangle missing angle → "Pilots do this exact calc on every approach — they need to know the descent angle to avoid coming in too steep. Same math you're about to do. Okay — first question..."
  - Pythagorean theorem → "This is how a quarterback figures out whether a deep throw is gonna get there — straight-line distance vs. how far the receiver actually has to run. Let's break it down."
  - Parallel lines / transversals → "Football field. Yard lines are parallel, the sideline cuts across them — same angle pattern every time. Alright, what do you notice first?"
  - Area/perimeter → "Weightlifting plates: the surface area on the floor matters for stability. Same idea here. Let's start small —"
  - Proofs → "Lawyers and historians build arguments exactly like this — claim, evidence, reasoning. You already know how to do this in history class. Now we just write it down. First thing —"
- Pick the interest that fits the problem most naturally. Don't force a connection that doesn't make sense.
- After the hook, drop straight into the first easy question. Don't linger.

══════════════════════════════════════════
PART 1: MOMENTUM THROUGH SMALL WINS
══════════════════════════════════════════

Your first job is keeping him in motion. Five easy questions plus one hard one teaches more than one hard question and giving up. Everything below serves momentum.

START BELOW HIS LEVEL
- First question on any problem: something he almost certainly knows.
- Finding a missing angle? Start with "How many degrees in a triangle total?"
- He gets it right. He's moving. Build from there in small increments.
- Like warming up before lifting — you don't walk in and throw your max on the bar.

CHUNK AGGRESSIVELY
- Never show the whole problem at once if it's complex.
- "Just look at this part. What angle do you see here?"
- "Ignore the rest of the diagram. Just this triangle."
- Zoom out only after he's solved the small piece.

ONE QUESTION AT A TIME
- Never two questions in one message. Ever.
- One question. Wait. Respond. Next question.
- Low cognitive load. One clear thing to do.

CONFIRM AND MOVE
- When he's right, confirm in 2-3 words and immediately give the next step.
- "Yeah, exactly. Now look at this angle—"
- Don't stop to explain WHY mid-problem. That kills momentum.
- Save explanations for after the problem is solved.

══════════════════════════════════════════
PART 2: MANAGING DIFFICULTY & EMOTION
══════════════════════════════════════════

ZONE OF PROXIMAL DEVELOPMENT
- Operate in the gap between what he can do alone and what he can't do even with help.
- If he's breezing through: add one layer of complexity.
- If he's struggling: strip away complexity until you find solid ground, then build.
- Calibrate to HIM, not to the grade level.

PRODUCTIVE VS. UNPRODUCTIVE STRUGGLE
- Productive struggle: he's challenged but thinking, making partial progress, trying approaches.
- Unproductive struggle: stuck, silent, frustrated, guessing randomly, shutting down.
- Let productive struggle happen. Intervene immediately at unproductive struggle.
- The transition often happens fast. Watch for it.

EMOTIONAL TEMPERATURE
- Anxiety directly reduces working memory. When he's stressed, he literally has less brainpower.
- If you sense rising frustration: FIRST lower the temperature, THEN resume teaching.
- Lower temperature by: simplifying, light humor, acknowledging frustration, giving an easy win.
- Never increase teaching intensity when emotional intensity is high.
- A well-timed "Yeah, this one's annoying" does more than three paragraphs of explanation.

STRATEGIC RETREAT
- If he fails the same step twice, do NOT ask it a third time the same way.
- Drop down. "Okay let's back up. What's 180 minus 110?"
- Never let him sit in failure for more than one exchange.

REFRAME, DON'T REPEAT
- If one explanation didn't work, a louder version won't either.
- Try a different angle: visual, analogy, flip the question, concrete example.

THE ESCAPE VALVE
- Truly stuck and spiraling: "Let's skip this one and come back. What's next?"
- Moving on IS sometimes the right move.

WHEN HE SAYS "JUST TELL ME"
- Simplify dramatically. "Just this one thing: [very simple sub-question]."
- Get him a win, then build.

══════════════════════════════════════════
PART 3: BUILDING REAL UNDERSTANDING
══════════════════════════════════════════

METACOGNITIVE PROMPTING
- Before diving in: "What do you notice about this?" or "Where would you start?"
- If "I don't know": narrow it. "What shapes do you see?"

SELF-EXPLANATION
- After correct answers at pivotal steps: "Why does that work?" or "How'd you know?"
- Sparingly — once or twice per problem. Not an interrogation.
- If he can't explain but got it right: "You got it — I think the reason is [start]. Does that track?"

ELABORATIVE INTERROGATION
- "How would you figure this out?" > "What's the answer?"
- "Why do you think these angles are equal?" → conceptual understanding.

RETRIEVAL PRACTICE & TRANSFER
- Connect to earlier problems: "Same move you did on the last one."
- "Remember the supplementary pair trick? Same idea here."

CONCRETE → VISUAL → ABSTRACT
- Tangible: Use HIS world first. "Picture a plane coming in for landing" > "Picture a ladder leaning against a wall."
- Visual: "What triangle does the descent path make with the runway?"
- Abstract: "If the approach angle is 3°..."
- Always prefer his interests for the concrete step. Football field, cockpit view, weight on a bar — whatever fits.

══════════════════════════════════════════
PART 4: CONFIDENCE & MOTIVATION
══════════════════════════════════════════

GROWTH MINDSET LANGUAGE
- Praise STRATEGY/EFFORT, never the person.
- YES: "That was a good move." / "Slowing down made the difference."
- NO: "You're so smart!" (creates pressure and fragility)

ATTRIBUTION REFRAMING
- Success → his effort: "You got that because you broke it into pieces."
- Failure → the approach: "That method doesn't work here. Let's try another way."

QUIET CONFIDENCE LANGUAGE
- "There it is." / "See, you knew that." / "Right." / "Exactly." / "Good, keep going."
- After a hard step: "That was the tricky part. Rest is downhill."

AUTONOMY & CHOICE
- "Want to start with this one or that one?"
- "Want a hint, or want to try a different approach?"

IMPLICIT PROGRESS
- "That's two down." / "You're getting quicker at spotting these."
- Never: "You still need to work on..."

ERROR AS INFORMATION
- "Interesting — what made you go that direction?"
- Removes shame. Treats errors as data.

POST-PROBLEM PAYOFF
- Name what he did plainly: "You just used alternate interior angles to find two unknowns."
- Connect it to his world: "Pilots use this exact move when calculating crosswind corrections." Keep it to one sentence — a quick hit, not a lecture.
- Then a choice: "Keep going or got more homework?"

══════════════════════════════════════════
PART 5: DEFLECTION HANDLING
══════════════════════════════════════════

"THIS IS POINTLESS"
- Don't argue. Quick aside if natural. Or: "Maybe. Let's just knock it out."

"THAT'S NOT HOW MY TEACHER DOES IT"
- "Walk me through what you remember."
- Can explain → use that method. Can't → "Let me show you one way, tell me if it looks familiar."
- Never criticize the teacher.

COPY-PASTE DETECTION
- Polished answer with no work: "Walk me through your first step."
- Can't explain: "Let's work through it for real."

AVOIDANCE / MINIMAL ENGAGEMENT
- One-word answers, checked out → get smaller, more concrete.
- "Just look at this one angle. Bigger or smaller than 90?"
- Binary questions are fine as starters. Build from anything.

══════════════════════════════════════════
PART 6: TONE & FORMAT
══════════════════════════════════════════

- Short messages. 1-3 sentences. Max one short paragraph.
- **Bold** sparingly. Use LaTeX for math: $x^2$ for inline, $$x^2 + y^2 = z^2$$ for display. Never use backticks for math expressions.
- Texting, not lecturing. Light humor. Never forced.
- When tension rises, get simpler and calmer.

GEOMETRY-SPECIFIC
- Help him SEE it. "Picture the triangle." "What shapes do you get?"
- Encourage labeling diagrams.
- For proofs: "What do we know?" and "What are we trying to show?" first.
- Connect concepts across problems.

FIRST MESSAGE
- Low-pressure. "Hey. What are we working on?" Don't be overly energetic.`;

function renderKatex(expr, displayMode) {
  try {
    return katex.renderToString(expr, { displayMode, throwOnError: false });
  } catch {
    return displayMode ? `$$${expr}$$` : `$${expr}$`;
  }
}

function parseMarkdown(text) {
  if (!text) return "";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const mathBlocks = [];
  let result = escaped;

  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    const idx = mathBlocks.length;
    mathBlocks.push(renderKatex(expr, true));
    return `%%MATH_${idx}%%`;
  });

  result = result.replace(/\$([^\s$](?:[^$\n]*[^\s$])?)\$/g, (_, expr) => {
    const idx = mathBlocks.length;
    mathBlocks.push(renderKatex(expr, false));
    return `%%MATH_${idx}%%`;
  });

  result = result
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-family:\'JetBrains Mono\',monospace;font-size:0.88em">$1</code>'
    )
    .replace(/\n/g, "<br/>");

  for (let i = 0; i < mathBlocks.length; i++) {
    result = result.replace(`%%MATH_${i}%%`, mathBlocks[i]);
  }

  return result;
}

// Cookie helpers
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Strict`;
}

function clearCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export default function MathCoach() {
  const [pin, setPin] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [solved, setSolved] = useState(0);
  const [pendingImage, setPendingImage] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [resumed, setResumed] = useState(false);
  // Study guide state
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideContent, setGuideContent] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [guideSaved, setGuideSaved] = useState(false);
  // Guide library state
  const [showGuideLibrary, setShowGuideLibrary] = useState(false);
  const [savedGuides, setSavedGuides] = useState([]);
  const [viewingGuide, setViewingGuide] = useState(null);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check for saved PIN and restore session on mount
  useEffect(() => {
    const saved = getCookie('math-coach-pin');
    setPin(saved || false);
    // Restore session from localStorage
    const session = loadSession();
    if (session && saved) {
      setMessages(session.messages);
      setSolved(session.solved || 0);
      setSessionId(session.sessionId);
      setStarted(true);
      setResumed(true);
      setTimeout(() => setResumed(false), 3000);
    }
    // Load saved guides
    setSavedGuides(loadGuides());
  }, []);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (started && textareaRef.current) textareaRef.current.focus();
  }, [started]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (
      last.role === "assistant" &&
      /\b(you got it|nice|nailed it|you just|that's it|there it is|solved)\b/i.test(last.content) &&
      /\b(want to|keep going|next|more homework|another)\b/i.test(last.content)
    ) {
      setSolved((s) => s + 1);
    }
  }, [messages]);

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(",")[1];
      const mediaType = file.type || "image/jpeg";
      setPendingImage({ base64, mediaType, previewUrl: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function buildApiContent(text, image) {
    const parts = [];
    if (image) {
      parts.push({
        type: "image",
        source: { type: "base64", media_type: image.mediaType, data: image.base64 },
      });
    }
    if (text) parts.push({ type: "text", text });
    if (parts.length === 0) parts.push({ type: "text", text: "(no message)" });
    return parts;
  }

  function toApiMessages(msgs) {
    return msgs.map((m) => {
      if (m.role === "assistant") return { role: "assistant", content: m.content };
      return { role: "user", content: buildApiContent(m.content, m.image) };
    });
  }

  async function callClaude(convo, options = {}) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          system: options.system || SYSTEM_PROMPT,
          messages: convo,
          sessionId: options.sessionId || sessionId,
          solved: options.solved || false,
          max_tokens: options.max_tokens,
        }),
      });

      if (res.status === 401) {
        clearCookie('math-coach-pin');
        setPin(false);
        setPinError('Access code expired. Enter it again.');
        return null;
      }

      if (res.status === 429) {
        return "Whoa, slow down. Give it a minute and try again.";
      }

      const data = await res.json();
      return (
        data.content
          ?.filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n") || "Something glitched. Say that again?"
      );
    } catch {
      return "Lost connection for a sec. Try again.";
    }
  }

  async function handlePinSubmit(e) {
    e.preventDefault();
    if (!pinInput.trim()) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pinInput.trim(),
          system: "Reply with OK",
          messages: [{ role: "user", content: "test" }],
        }),
      });
      if (res.status === 401) {
        setPinError("Wrong code. Try again.");
        return;
      }
      setCookie('math-coach-pin', pinInput.trim(), 30);
      setPin(pinInput.trim());
      setPinError("");
    } catch {
      setPinError("Can't connect. Try again.");
    }
  }

  async function handleStart() {
    const id = `session_${Date.now()}`;
    setSessionId(id);
    setStarted(true);
    setLoading(true);
    setSolved(0);
    // Register session on server (fire-and-forget)
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, sessionId: id }),
    }).catch(() => {});
    const opening = await callClaude(
      [{ role: "user", content: "I need help with my math homework." }],
      { sessionId: id }
    );
    if (opening) {
      const msgs = [{ role: "assistant", content: opening }];
      setMessages(msgs);
      saveSession({ sessionId: id, messages: msgs, solved: 0 });
    }
    setLoading(false);
  }

  async function sendMessage() {
    if ((!input.trim() && !pendingImage) || loading) return;
    const userMsg = {
      role: "user",
      content: input.trim(),
      image: pendingImage || null,
      previewUrl: pendingImage?.previewUrl || null,
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setPendingImage(null);
    setLoading(true);

    const apiMessages = [
      { role: "user", content: "I need help with my math homework." },
      ...toApiMessages(updated),
    ];

    const reply = await callClaude(apiMessages);
    if (reply) {
      const withReply = [...updated, { role: "assistant", content: reply }];
      setMessages(withReply);
      saveSession({ sessionId, messages: withReply, solved });
    }
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleNewSession() {
    setStarted(false);
    setMessages([]);
    setSolved(0);
    setPendingImage(null);
    setSessionId(null);
    setShowGuide(false);
    setGuideContent(null);
    clearSession();
  }

  // Study guide generation
  async function generateGuide() {
    setShowGuide(true);
    setGuideLoading(true);
    setGuideSaved(false);

    const apiMessages = [
      { role: "user", content: "I need help with my math homework." },
      ...toApiMessages(messages),
      { role: "user", content: GUIDE_PROMPT },
    ];

    const result = await callClaude(apiMessages, { max_tokens: 1200 });
    setGuideContent(result);
    setGuideLoading(false);
  }

  function handleSaveGuide() {
    if (!guideContent) return;
    const topicMatch = guideContent.match(/TOPIC:\s*(.+)/);
    const topic = topicMatch ? topicMatch[1].trim() : 'Geometry';
    saveGuide({ topic, content: guideContent, sessionId });
    setSavedGuides(loadGuides());
    setGuideSaved(true);
  }

  function handleCopyGuide() {
    if (guideContent) navigator.clipboard.writeText(guideContent).catch(() => {});
  }

  function handleDeleteGuide(id) {
    deleteGuide(id);
    setSavedGuides(loadGuides());
    if (viewingGuide?.id === id) setViewingGuide(null);
  }

  /* ── PIN: LOADING ── */
  if (pin === null) {
    return (
      <div style={S.landing}>
        <div style={S.landingInner}>
          <div style={S.mark}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <p style={{ color: C.mu, fontSize: 15 }}>Loading...</p>
        </div>
        <style>{fontImport}</style>
      </div>
    );
  }

  /* ── PIN: ENTRY ── */
  if (pin === false) {
    return (
      <div style={S.landing}>
        <div style={S.landingInner}>
          <div style={S.mark}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <h1 style={S.landingTitle}>Math Coach</h1>
          <p style={{ ...S.landingDesc, marginBottom: 20 }}>Enter your access code</p>
          <form onSubmit={handlePinSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Access code"
              style={{
                width: 200,
                padding: "13px 16px",
                borderRadius: C.r,
                border: `1px solid ${C.bd}`,
                background: C.sf,
                color: "#fff",
                fontSize: 18,
                fontFamily: C.mn,
                textAlign: "center",
                outline: "none",
                letterSpacing: 4,
              }}
              autoFocus
            />
            {pinError && <p style={{ color: "#ef4444", fontSize: 14, margin: 0 }}>{pinError}</p>}
            <button type="submit" style={S.goBtn}>Enter</button>
          </form>
        </div>
        <style>{fontImport}</style>
      </div>
    );
  }

  /* ── GUIDE LIBRARY ── */
  if (showGuideLibrary && !started) {
    return (
      <div style={S.landing}>
        <div style={{ ...S.landingInner, textAlign: "left", maxWidth: 500 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h1 style={{ ...S.landingTitle, marginBottom: 0 }}>Study Guides</h1>
            <button onClick={() => { setShowGuideLibrary(false); setViewingGuide(null); }} style={S.newBtn}>Back</button>
          </div>

          {viewingGuide ? (
            <div>
              <div style={{ fontSize: 13, color: C.mu, marginBottom: 12 }}>
                {new Date(viewingGuide.createdAt).toLocaleDateString()} — {viewingGuide.topic}
              </div>
              <div
                className="study-guide-content"
                style={{ color: C.tx, fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}
                dangerouslySetInnerHTML={{ __html: parseMarkdown(viewingGuide.content) }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => navigator.clipboard.writeText(viewingGuide.content).catch(() => {})} style={S.newBtn}>Copy</button>
                <button onClick={() => window.print()} style={S.newBtn}>Print</button>
                <button onClick={() => handleDeleteGuide(viewingGuide.id)} style={{ ...S.newBtn, color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}>Delete</button>
                <button onClick={() => setViewingGuide(null)} style={S.newBtn}>Back to list</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {savedGuides.length === 0 && <p style={{ color: C.mu, fontSize: 14 }}>No saved guides yet.</p>}
              {savedGuides.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setViewingGuide(g)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${C.bd}`,
                    background: C.sf,
                    color: C.tx,
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: C.fn,
                    textAlign: "left",
                  }}
                >
                  <span>{g.topic}</span>
                  <span style={{ color: C.mu, fontSize: 12 }}>{new Date(g.createdAt).toLocaleDateString()}</span>
                </button>
              ))}
              {savedGuides.length > 0 && (
                <button
                  onClick={() => { if (confirm('Clear all saved guides?')) { clearGuides(); setSavedGuides([]); } }}
                  style={{ ...S.newBtn, color: C.mu, fontSize: 12, marginTop: 8, alignSelf: "flex-start" }}
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
        <style>{fontImport}</style>
      </div>
    );
  }

  /* ── LANDING ── */
  if (!started) {
    return (
      <div style={S.landing}>
        <div style={S.landingInner}>
          <div style={S.mark}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <h1 style={S.landingTitle}>Math Coach</h1>
          <p style={S.landingDesc}>
            Take a photo of your homework, paste a problem, or just say what
            you&#39;re stuck on.
          </p>
          <button onClick={handleStart} style={S.goBtn}>
            Open it up
          </button>
          {savedGuides.length > 0 && (
            <button
              onClick={() => setShowGuideLibrary(true)}
              style={{ ...S.newBtn, marginBottom: 24, fontSize: 14 }}
            >
              Study guides ({savedGuides.length})
            </button>
          )}
          <div style={S.tips}>
            <div style={S.tip}><div style={S.tipDot} />Snap a photo of the problem</div>
            <div style={S.tip}><div style={S.tipDot} />Walks you through it step by step</div>
            <div style={S.tip}><div style={S.tipDot} />Works with however your teacher taught it</div>
          </div>
        </div>
        <style>{fontImport}</style>
      </div>
    );
  }

  /* ── STUDY GUIDE MODAL ── */
  const guideModal = showGuide && (
    <div style={S.modal}>
      <div style={S.modalContent}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ color: C.tx, fontSize: 18, fontWeight: 600, margin: 0 }}>Study Guide</h2>
          <button onClick={() => setShowGuide(false)} style={S.newBtn}>Close</button>
        </div>
        {guideLoading ? (
          <div style={{ color: C.mu, fontSize: 15, padding: "40px 0", textAlign: "center" }}>
            Generating study guide...
          </div>
        ) : guideContent ? (
          <>
            <div
              className="study-guide-content"
              style={{ color: C.tx, fontSize: 15, lineHeight: 1.7, marginBottom: 16, overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}
              dangerouslySetInnerHTML={{ __html: parseMarkdown(guideContent) }}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={handleCopyGuide} style={S.newBtn}>Copy</button>
              <button onClick={handleSaveGuide} style={S.newBtn}>
                {guideSaved ? 'Saved' : 'Save'}
              </button>
              <button onClick={() => window.print()} style={S.newBtn}>Print</button>
            </div>
          </>
        ) : (
          <p style={{ color: "#ef4444", fontSize: 14 }}>Failed to generate guide. Try again.</p>
        )}
      </div>
    </div>
  );

  /* ── CHAT ── */
  return (
    <div style={S.chat}>
      <div style={S.head}>
        <div style={S.headL}>
          <div style={S.headMark}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <span style={S.headName}>Math Coach</span>
          {solved > 0 && <span style={S.badge}>{solved} solved</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {solved > 0 && (
            <button onClick={generateGuide} disabled={guideLoading} style={S.newBtn}>
              Study guide
            </button>
          )}
          <button onClick={handleNewSession} style={S.newBtn}>
            New session
          </button>
        </div>
      </div>

      <div style={S.msgs}>
        {resumed && (
          <div style={{ textAlign: "center", color: C.mu, fontSize: 13, padding: "4px 0 8px" }}>
            Resumed previous session
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ ...S.row, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={S.avi}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
            )}
            <div style={msg.role === "user" ? S.uBub : S.cBub}>
              {msg.previewUrl && (
                <img src={msg.previewUrl} alt="Homework" style={S.chatImg} />
              )}
              {msg.hadImage && !msg.previewUrl && (
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 14px", marginBottom: 8, color: C.mu, fontSize: 13 }}>
                  Photo sent
                </div>
              )}
              {msg.content && (
                <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={S.row}>
            <div style={S.avi}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div style={S.cBub}>
              <span style={S.dots}>
                <span style={{ ...S.dot, animationDelay: "0s" }}>·</span>
                <span style={{ ...S.dot, animationDelay: "0.2s" }}>·</span>
                <span style={{ ...S.dot, animationDelay: "0.4s" }}>·</span>
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div style={S.inputWrap}>
        {pendingImage && (
          <div style={S.previewRow}>
            <img src={pendingImage.previewUrl} alt="Preview" style={S.previewImg} />
            <button onClick={() => setPendingImage(null)} style={S.previewX}>✕</button>
          </div>
        )}
        <div style={S.inputBar}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={S.camBtn}
            title="Take or upload a photo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            style={S.ta}
            placeholder="Paste a problem or say what you're working on..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !pendingImage) || loading}
            style={{
              ...S.sendBtn,
              opacity: (!input.trim() && !pendingImage) || loading ? 0.3 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>

      {guideModal}

      <style>{`
        ${fontImport}
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`;

const C = {
  bg: "#101216",
  sf: "rgba(255,255,255,0.05)",
  bd: "rgba(255,255,255,0.07)",
  tx: "rgba(255,255,255,0.87)",
  mu: "rgba(255,255,255,0.42)",
  ac: "#3b82f6",
  acD: "rgba(59,130,246,0.14)",
  fn: "'IBM Plex Sans', sans-serif",
  mn: "'JetBrains Mono', monospace",
  r: 12,
};

const S = {
  landing: {
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: C.fn,
    padding: 24,
  },
  landingInner: { maxWidth: 400, textAlign: "center" },
  mark: {
    width: 58,
    height: 58,
    borderRadius: 14,
    background: C.ac,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  landingTitle: { fontSize: 26, fontWeight: 600, color: C.tx, marginTop: 0, marginBottom: 10 },
  landingDesc: { fontSize: 15, color: C.mu, lineHeight: 1.6, marginTop: 0, marginBottom: 28 },
  goBtn: {
    padding: "13px 34px",
    borderRadius: C.r,
    border: "none",
    background: C.ac,
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: C.fn,
    marginBottom: 36,
  },
  tips: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    textAlign: "left",
    borderTop: `1px solid ${C.bd}`,
    paddingTop: 22,
  },
  tip: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.mu },
  tipDot: { width: 5, height: 5, borderRadius: "50%", background: C.ac, flexShrink: 0 },
  chat: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: C.bg,
    fontFamily: C.fn,
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    borderBottom: `1px solid ${C.bd}`,
    flexShrink: 0,
  },
  headL: { display: "flex", alignItems: "center", gap: 9 },
  headMark: {
    width: 28,
    height: 28,
    borderRadius: 7,
    background: C.ac,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headName: { fontSize: 15, fontWeight: 600, color: C.tx },
  badge: {
    fontSize: 12,
    fontWeight: 600,
    color: "#22c55e",
    background: "rgba(34,197,94,0.1)",
    padding: "2px 9px",
    borderRadius: 6,
    marginLeft: 4,
    fontFamily: C.mn,
  },
  newBtn: {
    background: "none",
    border: `1px solid ${C.bd}`,
    color: C.mu,
    fontSize: 13,
    fontWeight: 500,
    padding: "5px 13px",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: C.fn,
  },
  msgs: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  row: { display: "flex", alignItems: "flex-start", gap: 9 },
  avi: {
    width: 28,
    height: 28,
    borderRadius: 7,
    background: C.ac,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  cBub: {
    maxWidth: "82%",
    padding: "11px 15px",
    borderRadius: "3px 13px 13px 13px",
    background: C.sf,
    color: C.tx,
    fontSize: 15,
    lineHeight: 1.65,
  },
  uBub: {
    maxWidth: "78%",
    padding: "11px 15px",
    borderRadius: "13px 3px 13px 13px",
    background: C.acD,
    border: "1px solid rgba(59,130,246,0.18)",
    color: C.tx,
    fontSize: 15,
    lineHeight: 1.6,
  },
  chatImg: {
    maxWidth: "100%",
    maxHeight: 220,
    borderRadius: 8,
    marginBottom: 8,
    display: "block",
  },
  dots: {
    display: "flex",
    gap: 3,
    fontSize: 28,
    lineHeight: 1,
    height: 18,
    alignItems: "center",
  },
  dot: { animation: "dotPulse 1.4s infinite both", color: C.mu },
  inputWrap: {
    padding: "10px 16px 16px",
    borderTop: `1px solid ${C.bd}`,
    flexShrink: 0,
  },
  previewRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
    padding: "8px 10px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    border: `1px solid ${C.bd}`,
  },
  previewImg: {
    maxHeight: 80,
    maxWidth: 120,
    borderRadius: 6,
    objectFit: "cover",
  },
  previewX: {
    background: "rgba(255,255,255,0.1)",
    border: "none",
    color: C.mu,
    fontSize: 14,
    width: 24,
    height: 24,
    borderRadius: 6,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  inputBar: { display: "flex", gap: 8, alignItems: "flex-end" },
  camBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    border: `1px solid ${C.bd}`,
    background: "rgba(255,255,255,0.04)",
    color: C.mu,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "color 0.15s",
  },
  ta: {
    flex: 1,
    padding: "11px 14px",
    borderRadius: C.r,
    border: `1px solid ${C.bd}`,
    background: C.sf,
    color: "#fff",
    fontSize: 16,
    fontFamily: C.fn,
    outline: "none",
    resize: "none",
    lineHeight: 1.5,
    minHeight: 44,
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    border: "none",
    background: C.ac,
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    background: C.bg,
    border: `1px solid ${C.bd}`,
    borderRadius: 16,
    padding: 24,
    maxWidth: 600,
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
  },
};
