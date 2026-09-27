(function () {
  "use strict";

  var audioCtx = null;
  var toastTimer = null;

  var TOASTS = {
    geology: "clink! another rock for the pocket museum",
    pitbull: "dale! tiny club in your headphones",
    lego: "click-clack. expert brick noise unlocked",
    puzzle: "piece found. dopamine acquired",
    mensa: "big-brain ping. snack recommended",
    ski: "whoosh — powder privileges activated",
    hike: "boots on. trail vibes loading",
    palette: "mustard + chocolate: certified correct",
    work: "grind mode: gently aggressive",
    calc: "beep. AP Calc 5 energy restored",
    glen: "Glen says: 250k miles and still handsome"
  };

  function ensureAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  function tone(ctx, freq, type, start, dur, gainPeak, freqEnd) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, start);
    if (freqEnd != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), start + dur);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainPeak || 0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  function noiseBurst(ctx, start, dur, peak, bandFreq) {
    var frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = bandFreq || 1200;
    filter.Q.value = 0.8;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak || 0.2, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(start);
    src.stop(start + dur + 0.02);
  }

  var SOUNDS = {
    geology: function (ctx, t) {
      // rocky clinks
      tone(ctx, 880, "triangle", t, 0.08, 0.16);
      tone(ctx, 1320, "triangle", t + 0.07, 0.07, 0.12);
      tone(ctx, 660, "sine", t + 0.14, 0.12, 0.1, 220);
      noiseBurst(ctx, t + 0.02, 0.05, 0.08, 2400);
    },
    pitbull: function (ctx, t) {
      // tiny dance stab + bass bump
      tone(ctx, 110, "sawtooth", t, 0.18, 0.14, 80);
      tone(ctx, 220, "square", t + 0.05, 0.1, 0.08);
      tone(ctx, 330, "square", t + 0.12, 0.08, 0.07);
      tone(ctx, 440, "square", t + 0.2, 0.12, 0.09);
      tone(ctx, 880, "sine", t + 0.28, 0.15, 0.06);
    },
    lego: function (ctx, t) {
      // plastic clicks
      noiseBurst(ctx, t, 0.04, 0.22, 3200);
      tone(ctx, 1400, "square", t, 0.05, 0.08);
      noiseBurst(ctx, t + 0.08, 0.035, 0.18, 2800);
      tone(ctx, 1100, "square", t + 0.08, 0.05, 0.07);
      noiseBurst(ctx, t + 0.16, 0.04, 0.16, 3000);
    },
    puzzle: function (ctx, t) {
      // satisfying snap + resolve chord
      noiseBurst(ctx, t, 0.03, 0.15, 1800);
      tone(ctx, 523.25, "sine", t + 0.04, 0.18, 0.12);
      tone(ctx, 659.25, "sine", t + 0.08, 0.2, 0.1);
      tone(ctx, 783.99, "sine", t + 0.12, 0.25, 0.09);
    },
    mensa: function (ctx, t) {
      // sparkly brain arpeggio
      tone(ctx, 523.25, "sine", t, 0.12, 0.1);
      tone(ctx, 659.25, "triangle", t + 0.07, 0.12, 0.1);
      tone(ctx, 783.99, "sine", t + 0.14, 0.12, 0.1);
      tone(ctx, 1046.5, "triangle", t + 0.21, 0.22, 0.11);
    },
    ski: function (ctx, t) {
      // whoosh downhill
      tone(ctx, 900, "sawtooth", t, 0.35, 0.06, 180);
      noiseBurst(ctx, t, 0.35, 0.14, 900);
      tone(ctx, 400, "sine", t + 0.2, 0.2, 0.05, 120);
    },
    hike: function (ctx, t) {
      // boot steps + little bird chirp
      noiseBurst(ctx, t, 0.06, 0.18, 400);
      tone(ctx, 140, "triangle", t, 0.08, 0.1);
      noiseBurst(ctx, t + 0.14, 0.06, 0.16, 380);
      tone(ctx, 120, "triangle", t + 0.14, 0.08, 0.09);
      tone(ctx, 1200, "sine", t + 0.28, 0.08, 0.07, 1800);
    },
    palette: function (ctx, t) {
      // warm paint plops in mustard/brown register
      tone(ctx, 196, "sine", t, 0.16, 0.14);
      tone(ctx, 246.94, "sine", t + 0.1, 0.16, 0.12);
      tone(ctx, 293.66, "triangle", t + 0.2, 0.2, 0.11);
      tone(ctx, 392, "sine", t + 0.3, 0.22, 0.1);
    },
    work: function (ctx, t) {
      // typewriter / industrious taps
      for (var i = 0; i < 5; i++) {
        noiseBurst(ctx, t + i * 0.07, 0.03, 0.14 - i * 0.015, 2200);
        tone(ctx, 700 + i * 40, "square", t + i * 0.07, 0.04, 0.05);
      }
      tone(ctx, 520, "sine", t + 0.38, 0.15, 0.08);
    },
    calc: function (ctx, t) {
      // calculator beeps ending on triumphant 5-ish
      tone(ctx, 880, "square", t, 0.07, 0.08);
      tone(ctx, 988, "square", t + 0.09, 0.07, 0.08);
      tone(ctx, 1175, "square", t + 0.18, 0.07, 0.08);
      tone(ctx, 1319, "square", t + 0.28, 0.18, 0.12);
      tone(ctx, 659, "sine", t + 0.3, 0.25, 0.07);
    },
    glen: function (ctx, t) {
      // friendly old-car honk + engine blip personality
      tone(ctx, 320, "sawtooth", t, 0.22, 0.12);
      tone(ctx, 280, "sawtooth", t + 0.05, 0.22, 0.1);
      tone(ctx, 90, "triangle", t + 0.18, 0.35, 0.14, 60);
      noiseBurst(ctx, t + 0.2, 0.25, 0.08, 200);
      tone(ctx, 440, "sine", t + 0.45, 0.2, 0.07);
    }
  };

  function playSound(name) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var fn = SOUNDS[name];
    if (!fn) return;
    try {
      fn(ctx, ctx.currentTime + 0.01);
    } catch (e) {
      /* ignore audio glitches on weird mobile states */
    }
  }

  function showToast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 1600);
  }

  function wiggle(card) {
    card.classList.remove("wiggle");
    // force reflow so re-clicks restart animation
    void card.offsetWidth;
    card.classList.add("wiggle");
    window.setTimeout(function () {
      card.classList.remove("wiggle");
    }, 600);
  }

  function onActivate(card) {
    var name = card.getAttribute("data-sound");
    if (!name) return;
    playSound(name);
    wiggle(card);
    showToast(TOASTS[name] || "boop");
  }

  function init() {
    var cards = document.querySelectorAll(".icon-card[data-sound]");
    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        onActivate(card);
      });
      card.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onActivate(card);
        }
      });
    });
    // unlock audio on first gesture anywhere (iOS Safari)
    var unlock = function () {
      ensureAudio();
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("touchstart", unlock, { passive: true });
    document.addEventListener("click", unlock);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
