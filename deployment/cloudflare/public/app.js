(function clientApp() {
const $ = (id) => document.getElementById(id)
// The rate the API speaks. Both worklets resample, since a browser may
// ignore the rate an AudioContext asks for.
const WIRE_RATE = 24_000
const AGENT = window.AGENT
// LOCAL CHANGE. How much audio is set aside before playback starts (see the
// comment inside PLAYBACK_WORKLET). It lives here and not in there because it
// is also one part of the delay the person hears, and the measurement below
// has to declare it: two copies of the same number diverge sooner or later,
// and the measurement would start lying.
const PREBUFFER_S = 0.4

// Scratch buffers are reused: allocating on the audio thread causes glitches.
const CAPTURE_WORKLET = `
  class CaptureProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this._ratio = sampleRate / ${WIRE_RATE};
      this._pos = 0;
      this._prev = 0;
      this._src = null;
      this._out = null;
    }
    _toPcm(samples, len) {
      const pcm = new Int16Array(len);
      for (let i = 0; i < len; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return pcm;
    }
    process(inputs) {
      const ch = inputs[0]?.[0];
      if (!ch) return true;
      if (this._ratio === 1) {
        const pcm = this._toPcm(ch, ch.length);
        this.port.postMessage(pcm.buffer, [pcm.buffer]);
        return true;
      }
      const n = ch.length;
      if (!this._src || this._src.length < n + 1) {
        this._src = new Float32Array(n + 1);
        this._out = new Float32Array(Math.ceil((n + 1) / this._ratio) + 2);
      }
      const src = this._src;
      const out = this._out;
      src[0] = this._prev;
      src.set(ch, 1);
      let outLen = 0;
      let pos = this._pos;
      while (pos < n) {
        const i = Math.floor(pos);
        const frac = pos - i;
        out[outLen++] = src[i] + (src[i + 1] - src[i]) * frac;
        pos += this._ratio;
      }
      this._pos = pos - n;
      this._prev = ch[n - 1];
      if (outLen) {
        const pcm = this._toPcm(out, outLen);
        this.port.postMessage(pcm.buffer, [pcm.buffer]);
      }
      return true;
    }
  }
  registerProcessor('capture', CaptureProcessor);
`

// A ring buffer rather than one AudioBufferSource per chunk, which drifts and
// clicks under jitter. Posting 'stop' empties it for barge-in.
const PLAYBACK_WORKLET = `
  class PlaybackProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this._ring = new Float32Array(sampleRate * 30);
      this._writePos = 0;
      this._readPos = 0;
      this._available = 0;
      this._step = ${WIRE_RATE} / sampleRate;
      this._rsPos = 0;
      this._rsPrev = 0;
      // LOCAL CHANGE. Anti-dropout cushion (jitter buffer).
      // The starter played the first sample that arrived: if the audio turns
      // up even a moment late, the buffer empties and you hear a gap. With
      // long replies that happens constantly -> "the voice breaks up".
      // Here instead it waits until it has 250 ms in the queue before
      // starting, and if the queue empties it waits again. It costs 400 ms at
      // the start of every utterance, far less than a swallowed word costs.
      // It was 250 ms: much better than before, but still the odd gap.
      // Raised to 400. If it starts dropping out again, the next step is NOT
      // to raise it further — past a certain point the latency is audible —
      // but to look in the event log for whether a reply.done with status
      // "interrupted" arrived at that moment: that empties the queue on
      // purpose (line ~394), and is an entirely different cause.
      this._prebuffer = Math.round(sampleRate * ${PREBUFFER_S});
      this._priming = true;
      // After a gap the speaker sits at zero, so interpolating from the
      // pre-gap _rsPrev would click. Reset it instead.
      this._drained = false;
      this.port.onmessage = (e) => {
        if (e.data === 'stop') {
          this._writePos = this._readPos = this._available = 0;
          this._rsPos = this._rsPrev = 0;
          this._priming = true;
          return;
        }
        const int16 = new Int16Array(e.data);
        // int16[-1] would make _rsPrev NaN, silencing the ring for good.
        if (!int16.length) return;
        if (this._drained) {
          this._rsPrev = 0;
          this._rsPos = 0;
          this._drained = false;
        }
        if (this._step === 1) {
          for (let i = 0; i < int16.length; i++) this._push(int16[i] / 32768);
          return;
        }
        const n = int16.length;
        let pos = this._rsPos;
        while (pos < n) {
          const i = Math.floor(pos);
          const frac = pos - i;
          const a = i === 0 ? this._rsPrev : int16[i - 1] / 32768;
          const b = int16[i] / 32768;
          this._push(a + (b - a) * frac);
          pos += this._step;
        }
        this._rsPos = pos - n;
        this._rsPrev = int16[n - 1] / 32768;
      };
    }
    _push(v) {
      if (this._available < this._ring.length) {
        this._ring[this._writePos] = v;
        this._writePos = (this._writePos + 1) % this._ring.length;
        this._available++;
      }
    }
    process(inputs, outputs) {
      const output = outputs[0];
      const out = output[0];
      const cap = this._ring.length;
      // While the cushion is filling we stay silent: better 250 ms of waiting
      // than a sentence with holes in it.
      if (this._priming) {
        if (this._available >= this._prebuffer) this._priming = false;
        else { out.fill(0); for (let ch = 1; ch < output.length; ch++) output[ch].set(out); return true; }
      }
      for (let i = 0; i < out.length; i++) {
        if (this._available > 0) {
          out[i] = this._ring[this._readPos];
          this._readPos = (this._readPos + 1) % cap;
          this._available--;
        } else {
          out[i] = 0;
          this._drained = true;
          // Queue empty mid-sentence: build the cushion back up before
          // restarting, otherwise it stutters at every missing sample.
          this._priming = true;
        }
      }
      // Mono source, stereo sink.
      for (let ch = 1; ch < output.length; ch++) output[ch].set(out);
      return true;
    }
  }
  registerProcessor('playback', PlaybackProcessor);
`

const blobUrl = (code) =>
  URL.createObjectURL(new Blob([code], { type: 'application/javascript' }))

let ws, captureCtx, playbackCtx, playback, mic, conversationStart, timer

// LOCAL CHANGE (not from the starter kit). WHERE THE TIME GOES.
//
// "the agent takes too long" has already been solved twice by turning knobs
// (see 6.5 in the handover), and turning knobs blind a third time is the
// fastest way to make the one thing that has to work on the 14th worse. The
// delay the person hears is the sum of four different parts, and they are
// fixed in four ways that pull against each other:
//
//   turn     from when they stop speaking to when the server declares the turn
//            closed. That is max_silence. Lowering it makes it cut them off
//            mid-sentence.
//   model    the time it takes to think up the reply. Not touched from here.
//   voice    the time to generate the first chunk of speech.
//   cushion  the 400 ms we ourselves wait before playing, so as not to leave
//            gaps. It is the only one that is up to us, and it is almost
//            always the smallest.
//
// If the total is three seconds, removing the cushion wins back 0.4 of it and
// puts the gaps back into the voice: everything would have been made worse for
// nothing. Measure first, then decide. The measurement appears under the title,
// at the end of a reply.
let tLatestDelta = 0, tTurnEnd = 0, tReplyStarted = 0, firstAudioChunk = false
let latency = ''

// --- microphones ---
// Labels stay empty until mic permission is granted, so this runs again after
// getUserMedia.
async function listMics() {
  if (!navigator.mediaDevices?.enumerateDevices) return
  const devices = await navigator.mediaDevices.enumerateDevices()
  const inputs = devices
    .filter((device) => device.kind === 'audioinput')
    // Chrome's synthetic entries alias a real device and duplicate it.
    .filter((device) => device.deviceId !== 'default' && device.deviceId !== 'communications')
  const select = $('mic')
  const chosen = select.value
  select.replaceChildren()
  const auto = document.createElement('option')
  auto.value = ''
  auto.textContent = 'Default microphone'
  select.append(auto)
  inputs.forEach((device, i) => {
    const option = document.createElement('option')
    option.value = device.deviceId
    option.textContent = device.label || `Microphone ${i + 1}`
    select.append(option)
  })
  if (chosen && inputs.some((device) => device.deviceId === chosen)) select.value = chosen
}
listMics()
navigator.mediaDevices?.addEventListener?.('devicechange', listMics)

// On the simple page the button has to say "Talk to <name>" on the very first
// paint, not only after the first change of status.
if (document.body.classList.contains('simple')) $('btn').textContent = 'Talk to ' + AGENT.name

$('btn').onclick = () => (ws?.readyState <= 1 ? stop() : start())
$('log-toggle').onclick = () => {
  const hidden = document.body.classList.toggle('no-side')
  $('log-toggle').textContent = hidden ? 'Show' : 'Hide'
}

// --- side pane tabs ---
let agentLoaded = false

function showTab(name) {
  for (const tab of ['events', 'agent']) {
    $('tab-' + tab).classList.toggle('on', tab === name)
    $(tab + '-body').hidden = tab !== name
  }
  if (name === 'agent' && !agentLoaded) {
    agentLoaded = true
    fetch('/agent')
      .then((res) => res.json())
      .then((agent) => {
        $('agent-body').replaceChildren()
        const pre = document.createElement('pre')
        pre.textContent = JSON.stringify(agent, null, 2)
        $('agent-body').append(pre)
      })
      .catch(() => {
        agentLoaded = false
        $('agent-body').textContent = 'Could not load the agent.'
      })
  }
}
$('tab-events').onclick = () => showTab('events')
$('tab-agent').onclick = () => showTab('agent')

async function addWorklet(ctx, code, name) {
  const url = blobUrl(code)
  try {
    await ctx.audioWorklet.addModule(url)
  } finally {
    URL.revokeObjectURL(url)
  }
  return new AudioWorkletNode(ctx, name)
}

async function start() {
  $('btn').disabled = true
  $('mic').disabled = true
  setStatus('connecting')

  let micRequested = null

  try {
    // LOCAL CHANGE (not from the starter kit). THE ORDER OF THIS BLOCK IS THE
    // DEFECT THAT MADE THE IPHONE SILENT. Do not touch it without reading this.
    //
    // The permission to make noise that the browser grants when a button is
    // tapped is TIME-LIMITED on Safari/iPhone: it expires at the first
    // "await". Chrome on Android, on the other hand, keeps it for the whole
    // life of the page.
    // This used to request the token (await) and create the two audio contexts
    // ONLY AFTERWARDS. On Android it worked; on iPhone the contexts were born
    // outside the tap and stayed "suspended". A suspended context never runs
    // the worklet: the agent's voice arrived over the network, piled up in the
    // queue and never came out of the speaker. No error, no warning light: it
    // looked as though the button did nothing.
    //
    // So EVERYTHING THAT NEEDS THE TAP IS DONE HERE, BEFORE THE FIRST AWAIT:
    // it is only started, and awaited further down. If anyone puts an await
    // back above this block, the iPhone goes silent again and does not say so.
    captureCtx = new AudioContext({ sampleRate: WIRE_RATE })
    playbackCtx = new AudioContext({ sampleRate: WIRE_RATE })
    const audioReady = Promise.all([captureCtx.resume(), playbackCtx.resume()])

    const deviceId = $('mic').value
    micRequested = navigator.mediaDevices.getUserMedia({
      audio: {
        // A preference, not `exact`: an unplugged device falls back.
        ...(deviceId ? { deviceId } : {}),
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
    // The real rejection is collected at the await further down. This is only
    // here so it does not count as "unhandled" in the meantime.
    micRequested.catch(() => {})

    // The API key never reaches the page; this token expires in 60 seconds.
    const tokenRequest = fetch('/token' + location.search)
    // --- end of the block that has to stay synchronous ---

    await audioReady
    const res = await tokenRequest
    if (!res.ok) throw new Error('could not mint a token, check the API key')
    const { token } = await res.json()

    playback = await addWorklet(playbackCtx, PLAYBACK_WORKLET, 'playback')
    playback.connect(playbackCtx.destination)

    mic = await micRequested
    // LOCAL CHANGE. On iPhone, opening the microphone changes the phone's audio
    // session (from "playback" to "playback and record"), and during that
    // switch the context can go back to suspended even though we had only just
    // started it. Here we are still close enough to the tap to start it again.
    if (playbackCtx.state !== 'running') await playbackCtx.resume()
    diagnostics()
    listMics()
    const capture = await addWorklet(captureCtx, CAPTURE_WORKLET, 'capture')
    captureCtx.createMediaStreamSource(mic).connect(capture)

    // LOCAL CHANGE (not from the starter kit). On Bluetooth headphones, opening
    // the microphone makes macOS switch from the music profile to the headset
    // profile, and during that switch the outgoing audio is thrown away. The
    // greeting arrives in exactly that window, so its beginning is lost: for
    // the person, who has only their hearing to go on, that means losing the
    // first word. We send a chunk of silence so that the switch is over and
    // done with before the real voice. It costs 350 ms once only, at the start
    // of the session, not on every utterance.
    playback.port.postMessage(new Int16Array(Math.round(WIRE_RATE * 0.35)).buffer)

    const url = new URL('wss://agents.assemblyai.com/v1/ws')
    url.searchParams.set('token', token)
    ws = new WebSocket(url)
    let ready = false

    // The API takes base64 inside JSON, not binary frames.
    capture.port.onmessage = ({ data }) => {
      if (!ready || ws.readyState !== 1) return
      const bytes = new Uint8Array(data)
      let binary = ''
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
      }
      ws.send(JSON.stringify({ type: 'input.audio', audio: btoa(binary) }))
      logEvent('up', 'input.audio')
    }

    // Everything about the agent lives server-side; the session just names it.
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'session.update', session: { agent_id: AGENT.id } }))
      logEvent('up', 'session.update', AGENT.id)
    }

    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data)
      switch (msg.type) {
        case 'session.ready':
          ready = true
          conversationStart = Date.now()
          timer = setInterval(tick, 1000)
          tick()
          setStatus('listening')
          $('btn').disabled = false
          $('btn').textContent = document.body.classList.contains('simple') ? 'End the conversation' : 'End'
          $('btn').classList.add('live')
          logEvent('down', msg.type, msg.session_id)
          break

        case 'input.speech.started':
          // LOCAL CHANGE (not from the starter kit).
          // Here the starter emptied the buffer straight away:
          // postMessage('stop'). But this event fires at the FIRST hint of
          // incoming sound — the echo from the speakers, a noise, a breath —
          // and emptying the buffer throws away voice that has already been
          // received: letters and pieces of words go missing in the middle of
          // sentences. And it is more aggressive than we want: the server
          // already has interruption_delay (700 ms) precisely so as NOT to be
          // interrupted by a noise, but the client was overriding it.
          // Now we wait for the server's verdict, that is reply.done with
          // status "interrupted" below. If the person really does interrupt it
          // works just the same; if it is only noise, the agent does not
          // swallow its words.
          setStatus('listening')
          logEvent('down', msg.type)
          break

        case 'reply.started':
          tReplyStarted = performance.now()
          firstAudioChunk = false
          setStatus('speaking')
          logEvent('down', msg.type)
          break

        case 'reply.audio': {
          if (!firstAudioChunk) { firstAudioChunk = true; measureLatency() }
          const raw = atob(msg.data)
          const bytes = new Uint8Array(raw.length)
          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
          playback?.port.postMessage(bytes.buffer, [bytes.buffer])
          logEvent('down', msg.type)
          break
        }

        case 'reply.done':
          setStatus('listening')
          if (msg.status === 'interrupted') playback?.port.postMessage('stop')
          logEvent('down', msg.type, msg.status)
          break

        // text is the full transcript so far, so it replaces.
        case 'transcript.user.delta':
          // This arrives while they are speaking: the last one seen is the
          // closest moment to "they have stopped speaking" that the browser can
          // know about.
          tLatestDelta = performance.now()
          partial('you', msg.text)
          logEvent('down', msg.type, msg.text)
          break

        // delta is the next word only, so it appends.
        case 'transcript.agent.delta':
          logEvent('down', msg.type, msg.delta)
          if (msg.reply_id && msg.reply_id === printedReply) break
          if (msg.reply_id !== liveReply) {
            liveReply = msg.reply_id
            dropPartial('agent')
          }
          partial('agent', appendDelta(partialText.agent || '', msg.delta))
          break

        case 'transcript.user':
          // The server has closed the turn: from here on the time is its own.
          tTurnEnd = performance.now()
          addLine('you', msg.text)
          logEvent('down', msg.type, msg.text)
          break

        case 'transcript.agent':
          printedReply = msg.reply_id ?? printedReply
          addLine('agent', msg.text)
          logEvent('down', msg.type, msg.text)
          break

        case 'tool.call': {
          // http tools run on AssemblyAI's side; no result comes back here.
          const args = JSON.stringify(msg.arguments ?? {})
          addLine('tool', `${msg.name}(${args})`)
          logEvent('down', msg.type, `${msg.name} ${args}`)
          break
        }

        case 'session.ended':
          logEvent('down', msg.type)
          ws.close()
          break

        case 'session.error':
          setStatus('error', msg.message)
          logEvent('down', msg.type, `${msg.code}: ${msg.message}`)
          break

        default:
          logEvent('down', msg.type)
      }
    }

    ws.onclose = () => { setStatus('idle'); reset() }
    ws.onerror = () => { setStatus('error', 'connection failed'); reset() }
  } catch (error) {
    // LOCAL CHANGE. The tap has already opened the audio contexts and perhaps
    // the microphone: if we leave here without closing them they stay on (on
    // the phone the microphone indicator stays lit) and the next attempt starts
    // dirty. We spell the denied-permission message out in full because on
    // iPhone the permission is asked for again every session, and it is the
    // error Claudia will see most often.
    setStatus('error', error.name === 'NotAllowedError'
      ? 'microphone blocked — allow it and tap again'
      : error.message)
    micRequested?.then((s) => s.getTracks().forEach((t) => t.stop())).catch(() => {})
    captureCtx?.close().catch?.(() => {})
    playbackCtx?.close().catch?.(() => {})
    diagnostics(error)
    captureCtx = playbackCtx = playback = mic = null
    reset()
  }
}

function stop() {
  // Close cleanly so the session record ends, falling back to the socket.
  if (ws?.readyState === 1) {
    ws.send(JSON.stringify({ type: 'session.end' }))
    logEvent('up', 'session.end')
    const socket = ws
    setTimeout(() => { if (socket.readyState === 1) socket.close() }, 3000)
  } else {
    ws?.close()
  }
  playback?.port.postMessage('stop')
  mic?.getTracks().forEach((track) => track.stop())
  captureCtx?.close()
  playbackCtx?.close()
  captureCtx = playbackCtx = playback = mic = null
  reset()
  setStatus('idle')
}

function reset() {
  clearInterval(timer)
  clearPartials()
  open.forEach((run) => paint(run, true))
  open.clear()
  $('btn').disabled = false
  $('mic').disabled = false
  $('btn').textContent = document.body.classList.contains('simple') ? 'Talk to ' + AGENT.name : 'Start'
  $('btn').classList.remove('live')
}

function setStatus(state, detail) {
  $('status').className = 'status ' + state
  $('status-text').textContent = detail || state
}

// LOCAL CHANGE (not from the starter kit). On the phone there is no console to
// look at, and "I can't hear anything" can mean three very different things:
// the audio context is stopped, the microphone was never granted, or it really
// is playing and the problem is the volume or the silent switch. This row is
// read off the screen and tells the three cases apart without plugging
// anything in.
//   running   = the context is playing. If nothing is heard, it is the phone.
//   suspended = the browser is holding it stopped: the tap defect is back.
function diagnostics(error) {
  const row = [
    'audio: ' + (playbackCtx ? playbackCtx.state : 'not created'),
    playbackCtx ? playbackCtx.sampleRate + ' Hz' : null,
    mic ? 'microphone ok' : 'microphone no',
    latency || null,
    error ? (error.name || 'error') + ': ' + error.message : null,
  ].filter(Boolean)
  $('diag').textContent = row.join(' · ')
}

// Called when the FIRST chunk of audio of a reply arrives: from there on only
// the cushion stands between it and something being heard.
function measureLatency() {
  const now = performance.now()
  const sec = (ms) => (ms / 1000).toFixed(1)
  // Each part only exists if we saw the events that bound it. A very short turn
  // may have no delta at all: in that case it says '?', rather than inventing a
  // zero that would make the turn look free.
  const turn = tLatestDelta && tTurnEnd > tLatestDelta ? tTurnEnd - tLatestDelta : null
  const model = tTurnEnd && tReplyStarted > tTurnEnd ? tReplyStarted - tTurnEnd : null
  const voice = tReplyStarted ? now - tReplyStarted : null
  const cushion = PREBUFFER_S * 1000
  const total = (turn || 0) + (model || 0) + (voice || 0) + cushion
  latency =
    `reply ${sec(total)}s (turn ${turn ? sec(turn) : '?'}` +
    ` · model ${model ? sec(model) : '?'}` +
    ` · voice ${voice ? sec(voice) : '?'}` +
    ` · cushion ${sec(cushion)})`
  diagnostics()
  // Into the event log as well, so the history of the whole conversation is kept and
  // not just the last utterance: an occasional slow reply and a reply that is
  // always slow are two different problems.
  logEvent('down', 'latency', latency)

  // And to the server too, which puts them aside. That way it falls to nobody
  // to watch the screen and report back: the slow utterances are exactly the
  // ones that would be lost, since they are the ones where you stop watching
  // the screen.
  // It is just fired off: no await, no error propagating up. If it fails one
  // measurement is lost, which is worth infinitely less than a stutter in the
  // audio.
  // Only the timings go: not one word of what they said to each other.
  try {
    fetch('/latency' + location.search, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ turn, model, voice, cushion, total }),
      keepalive: true,
    }).catch(() => {})
  } catch {}
}

// $4.50 an hour, the list price at assemblyai.com/pricing. Billing is per
// session minute, so the running figure is an estimate, not an invoice.
const COST_PER_SECOND = 4.5 / 3600

function tick() {
  const seconds = Math.floor((Date.now() - conversationStart) / 1000)
  $('elapsed').textContent =
    Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')
  $('cost').textContent = '$' + (seconds * COST_PER_SECOND).toFixed(3)

  // LOCAL CHANGE. On iPhone the audio context can be suspended in the middle of
  // the conversation by things we do not control: a notification, a phone call,
  // the screen going off. The agent would carry on talking without being heard,
  // and the person has no way of noticing that anything has happened. Here we
  // check once a second and try to start it again.
  if (playbackCtx && playbackCtx.state === 'suspended') {
    playbackCtx.resume().catch(() => {})
  }
  diagnostics()
}

// --- transcript ---
const partialText = {}
const partialEl = {}
// The full reply arrives once its audio has been sent, which beats the audio
// playing out, so deltas keep coming after the line is printed. printedReply
// stops them rebuilding the same sentence underneath it.
let liveReply = null
let printedReply = null

// Deltas arrive with a leading space sometimes and without it other times, so
// add one only when neither side has one and the delta is not punctuation.
const ATTACHES_LEFT = /^[.,!?;:%°)\]}…'"’”]/
const NO_SPACE_AFTER = /[([{$\-\/'"‘“]$/

function appendDelta(text, delta) {
  if (!delta) return text
  if (!text) return delta
  if (/^\s/.test(delta) || /\s$/.test(text)) return text + delta
  if (ATTACHES_LEFT.test(delta) || NO_SPACE_AFTER.test(text)) return text + delta
  return text + ' ' + delta
}

function dropPartial(who) {
  partialEl[who]?.remove()
  delete partialEl[who]
  delete partialText[who]
}

function transcriptLine(who, text, cls) {
  const line = document.createElement('div')
  line.className = 'line ' + who + (cls ? ' ' + cls : '')
  const label = document.createElement('span')
  label.className = 'who'
  label.textContent = who === 'agent' ? AGENT.name : who
  const body = document.createElement('span')
  body.className = 'said'
  body.textContent = text
  line.append(label, body)
  return line
}

function clearEmpty(el) {
  const empty = el.querySelector('.empty')
  if (empty) empty.remove()
}

function scroll(el) {
  el.scrollTop = el.scrollHeight
}

function partial(who, text) {
  clearEmpty($('transcript'))
  partialText[who] = text
  if (partialEl[who]) {
    partialEl[who].querySelector('.said').textContent = text
  } else {
    partialEl[who] = transcriptLine(who, text, 'partial')
    $('transcript').append(partialEl[who])
  }
  scroll($('transcript'))
}

function addLine(who, text) {
  clearEmpty($('transcript'))
  dropPartial(who)
  $('transcript').append(transcriptLine(who, text))
  scroll($('transcript'))
}

function clearPartials() {
  for (const who of Object.keys(partialEl)) dropPartial(who)
  liveReply = printedReply = null
}

// --- event log ---
// Audio frames arrive ~190 times a second each way, so these types hold a row
// open and count into it. Both streams run at once, hence a row per key.
const COALESCE = new Set([
  'input.audio',
  'reply.audio',
  'transcript.user.delta',
  'transcript.agent.delta',
])
const open = new Map()

function eventRow(direction, type, detail) {
  const row = document.createElement('div')
  row.className = 'event ' + direction
  const at = document.createElement('span')
  at.className = 'at'
  at.textContent = (conversationStart ? (Date.now() - conversationStart) / 1000 : 0).toFixed(1) + 's'
  const arrow = document.createElement('span')
  arrow.className = 'dir'
  arrow.textContent = direction === 'up' ? '↑' : '↓'
  const name = document.createElement('span')
  name.className = 'type'
  name.textContent = type
  const count = document.createElement('span')
  count.className = 'count'
  const info = document.createElement('span')
  info.className = 'detail'
  if (detail) info.textContent = detail
  row.append(at, arrow, name, count, info)
  return row
}

// Ten repaints a second, plus one when the run closes.
function paint(live, final) {
  const now = performance.now()
  if (!final && now - live.painted < 100) return
  live.painted = now
  live.row.querySelector('.count').textContent = live.count > 1 ? '×' + live.count : ''
  if (live.detail) live.row.querySelector('.detail').textContent = live.detail
}

function logEvent(direction, type, detail) {
  const log = $('events-body')
  clearEmpty(log)
  const key = direction + ' ' + type
  const live = open.get(key)
  if (live) {
    live.count += 1
    if (detail) live.detail = detail
    paint(live)
    return
  }
  // A real event closes the open runs, so the next burst starts a new row.
  if (!COALESCE.has(type)) {
    open.forEach((run) => paint(run, true))
    open.clear()
  }
  // Only follow the tail if the reader is there.
  const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40
  const row = eventRow(direction, type, detail)
  log.append(row)
  while (log.children.length > 400) log.firstChild.remove()
  if (COALESCE.has(type)) open.set(key, { row, count: 1, detail, painted: 0 })
  if (atBottom) scroll(log)
}
})();