(function () {
  "use strict";

  var audioCtx = null;
  var toastTimer = null;
  var lastIndex = {};

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

  function noiseBurst(ctx, start, dur, peak, bandFreq, q) {
    var frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = bandFreq || 1200;
    filter.Q.value = q != null ? q : 0.8;
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

  function noiseSweep(ctx, start, dur, peak, freqStart, freqEnd) {
    var frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(freqStart, start);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 40), start + dur);
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak || 0.15, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(start);
    src.stop(start + dur + 0.02);
  }

  /* Each key: array of exactly 5 distinct synth functions (genre variants). */
  var SOUNDS = {
    /* Genre: rock / mineral clinks & stone taps */
    geology: [
      function (ctx, t) {
        /* pebble clink */
        tone(ctx, 980, "triangle", t, 0.07, 0.15);
        tone(ctx, 1480, "triangle", t + 0.05, 0.06, 0.1);
        noiseBurst(ctx, t, 0.04, 0.09, 2600);
      },
      function (ctx, t) {
        /* geode tap */
        tone(ctx, 660, "sine", t, 0.1, 0.14);
        tone(ctx, 990, "triangle", t + 0.08, 0.12, 0.11);
        tone(ctx, 440, "sine", t + 0.16, 0.18, 0.08, 180);
        noiseBurst(ctx, t + 0.02, 0.05, 0.07, 1800);
      },
      function (ctx, t) {
        /* gravel scatter */
        noiseBurst(ctx, t, 0.04, 0.12, 2200);
        noiseBurst(ctx, t + 0.05, 0.035, 0.1, 2800);
        noiseBurst(ctx, t + 0.1, 0.04, 0.09, 2000);
        tone(ctx, 720, "triangle", t + 0.12, 0.08, 0.07);
      },
      function (ctx, t) {
        /* crystal chime */
        tone(ctx, 1046, "sine", t, 0.15, 0.11);
        tone(ctx, 1319, "sine", t + 0.06, 0.18, 0.09);
        tone(ctx, 1568, "triangle", t + 0.12, 0.22, 0.07);
      },
      function (ctx, t) {
        /* heavy stone knock */
        tone(ctx, 180, "triangle", t, 0.12, 0.16, 90);
        noiseBurst(ctx, t, 0.06, 0.14, 600, 0.5);
        tone(ctx, 320, "sine", t + 0.1, 0.1, 0.08);
      }
    ],

    /* Genre: party / club / latin-pop stingers (Pitbull Dale — not a dog) */
    pitbull: [
      function (ctx, t) {
        /* club bass bump + stab */
        tone(ctx, 90, "sawtooth", t, 0.2, 0.16, 55);
        tone(ctx, 220, "square", t + 0.06, 0.1, 0.09);
        tone(ctx, 440, "square", t + 0.16, 0.12, 0.08);
      },
      function (ctx, t) {
        /* latin horn stab */
        tone(ctx, 349, "sawtooth", t, 0.12, 0.12);
        tone(ctx, 440, "sawtooth", t + 0.02, 0.12, 0.1);
        tone(ctx, 523, "sawtooth", t + 0.04, 0.14, 0.09);
        tone(ctx, 698, "square", t + 0.18, 0.1, 0.07);
      },
      function (ctx, t) {
        /* four-on-floor kick hits */
        tone(ctx, 100, "sine", t, 0.1, 0.18, 45);
        tone(ctx, 100, "sine", t + 0.14, 0.1, 0.16, 45);
        tone(ctx, 100, "sine", t + 0.28, 0.1, 0.14, 45);
        noiseBurst(ctx, t + 0.07, 0.03, 0.08, 4000);
        noiseBurst(ctx, t + 0.21, 0.03, 0.07, 4000);
      },
      function (ctx, t) {
        /* synth riff climb */
        tone(ctx, 220, "square", t, 0.08, 0.1);
        tone(ctx, 277, "square", t + 0.08, 0.08, 0.1);
        tone(ctx, 330, "square", t + 0.16, 0.08, 0.1);
        tone(ctx, 440, "square", t + 0.24, 0.14, 0.11);
        tone(ctx, 880, "sine", t + 0.32, 0.12, 0.06);
      },
      function (ctx, t) {
        /* Dale drop + sparkle */
        tone(ctx, 55, "sawtooth", t, 0.28, 0.18, 40);
        tone(ctx, 110, "triangle", t + 0.05, 0.2, 0.1);
        tone(ctx, 880, "sine", t + 0.22, 0.1, 0.07);
        tone(ctx, 1320, "sine", t + 0.3, 0.12, 0.06);
      }
    ],

    /* Genre: plastic LEGO brick clicks / stud snaps */
    lego: [
      function (ctx, t) {
        /* single stud snap */
        noiseBurst(ctx, t, 0.035, 0.22, 3400);
        tone(ctx, 1500, "square", t, 0.04, 0.09);
      },
      function (ctx, t) {
        /* two-brick click-clack */
        noiseBurst(ctx, t, 0.035, 0.2, 3000);
        tone(ctx, 1400, "square", t, 0.04, 0.08);
        noiseBurst(ctx, t + 0.09, 0.035, 0.18, 2600);
        tone(ctx, 1100, "square", t + 0.09, 0.04, 0.07);
      },
      function (ctx, t) {
        /* rapid build taps */
        for (var i = 0; i < 4; i++) {
          noiseBurst(ctx, t + i * 0.055, 0.03, 0.16 - i * 0.02, 2800 + i * 200);
          tone(ctx, 1200 + i * 80, "square", t + i * 0.055, 0.035, 0.06);
        }
      },
      function (ctx, t) {
        /* hollow plate scrape */
        noiseSweep(ctx, t, 0.12, 0.12, 2800, 900);
        tone(ctx, 900, "square", t + 0.08, 0.05, 0.07);
        noiseBurst(ctx, t + 0.14, 0.04, 0.14, 2200);
      },
      function (ctx, t) {
        /* big brick lock-in */
        noiseBurst(ctx, t, 0.05, 0.24, 2000);
        tone(ctx, 700, "square", t, 0.06, 0.1);
        tone(ctx, 1050, "triangle", t + 0.05, 0.08, 0.08);
        noiseBurst(ctx, t + 0.1, 0.03, 0.1, 3200);
      }
    ],

    /* Genre: jigsaw snap / piece-fit resolve */
    puzzle: [
      function (ctx, t) {
        /* soft piece snap */
        noiseBurst(ctx, t, 0.03, 0.14, 1600);
        tone(ctx, 523, "sine", t + 0.03, 0.16, 0.11);
      },
      function (ctx, t) {
        /* major resolve triad */
        noiseBurst(ctx, t, 0.025, 0.12, 1800);
        tone(ctx, 523.25, "sine", t + 0.04, 0.2, 0.1);
        tone(ctx, 659.25, "sine", t + 0.08, 0.22, 0.09);
        tone(ctx, 783.99, "sine", t + 0.12, 0.26, 0.08);
      },
      function (ctx, t) {
        /* cardboard slide + click */
        noiseSweep(ctx, t, 0.1, 0.1, 800, 1800);
        noiseBurst(ctx, t + 0.1, 0.03, 0.15, 2000);
        tone(ctx, 660, "triangle", t + 0.12, 0.1, 0.08);
      },
      function (ctx, t) {
        /* edge-fit double click */
        noiseBurst(ctx, t, 0.025, 0.13, 2200);
        tone(ctx, 880, "sine", t + 0.02, 0.08, 0.09);
        noiseBurst(ctx, t + 0.12, 0.025, 0.13, 2000);
        tone(ctx, 988, "sine", t + 0.14, 0.1, 0.09);
      },
      function (ctx, t) {
        /* final piece dopamine chime */
        noiseBurst(ctx, t, 0.03, 0.12, 1500);
        tone(ctx, 659, "sine", t + 0.04, 0.15, 0.1);
        tone(ctx, 831, "sine", t + 0.1, 0.15, 0.09);
        tone(ctx, 988, "sine", t + 0.16, 0.18, 0.1);
        tone(ctx, 1319, "triangle", t + 0.24, 0.28, 0.09);
      }
    ],

    /* Genre: big-brain sparkle / IQ pings */
    mensa: [
      function (ctx, t) {
        /* sparkly arpeggio up */
        tone(ctx, 523.25, "sine", t, 0.1, 0.1);
        tone(ctx, 659.25, "triangle", t + 0.07, 0.1, 0.1);
        tone(ctx, 783.99, "sine", t + 0.14, 0.1, 0.1);
        tone(ctx, 1046.5, "triangle", t + 0.21, 0.2, 0.11);
      },
      function (ctx, t) {
        /* thought ping */
        tone(ctx, 1320, "sine", t, 0.08, 0.1);
        tone(ctx, 1760, "sine", t + 0.06, 0.15, 0.08);
      },
      function (ctx, t) {
        /* neuron cascade */
        tone(ctx, 440, "triangle", t, 0.08, 0.08);
        tone(ctx, 554, "triangle", t + 0.05, 0.08, 0.08);
        tone(ctx, 659, "triangle", t + 0.1, 0.08, 0.08);
        tone(ctx, 880, "sine", t + 0.15, 0.08, 0.09);
        tone(ctx, 1175, "sine", t + 0.2, 0.16, 0.1);
      },
      function (ctx, t) {
        /* quiz-show correct ding */
        tone(ctx, 784, "sine", t, 0.12, 0.12);
        tone(ctx, 1175, "sine", t + 0.1, 0.22, 0.13);
      },
      function (ctx, t) {
        /* shimmer chord */
        tone(ctx, 523, "sine", t, 0.28, 0.07);
        tone(ctx, 659, "sine", t + 0.02, 0.28, 0.07);
        tone(ctx, 784, "triangle", t + 0.04, 0.3, 0.08);
        tone(ctx, 1047, "sine", t + 0.06, 0.32, 0.06);
      }
    ],

    /* Genre: ski whoosh / edge scrape / powder */
    ski: [
      function (ctx, t) {
        /* downhill whoosh */
        tone(ctx, 900, "sawtooth", t, 0.35, 0.05, 180);
        noiseSweep(ctx, t, 0.35, 0.14, 1200, 400);
      },
      function (ctx, t) {
        /* edge carve scrape */
        noiseSweep(ctx, t, 0.22, 0.16, 2000, 600);
        tone(ctx, 500, "sawtooth", t + 0.05, 0.18, 0.05, 200);
      },
      function (ctx, t) {
        /* powder puff */
        noiseBurst(ctx, t, 0.18, 0.14, 700, 0.4);
        noiseSweep(ctx, t + 0.05, 0.2, 0.1, 900, 300);
      },
      function (ctx, t) {
        /* ski-stop skid */
        noiseSweep(ctx, t, 0.15, 0.18, 1800, 350);
        tone(ctx, 280, "triangle", t + 0.08, 0.15, 0.08, 90);
        noiseBurst(ctx, t + 0.12, 0.08, 0.1, 500);
      },
      function (ctx, t) {
        /* lift-off wind + chirp */
        noiseSweep(ctx, t, 0.3, 0.12, 500, 1600);
        tone(ctx, 1200, "sine", t + 0.22, 0.08, 0.07, 1800);
      }
    ],

    /* Genre: hiking boots / trail / nature */
    hike: [
      function (ctx, t) {
        /* two boot steps + bird */
        noiseBurst(ctx, t, 0.06, 0.18, 400);
        tone(ctx, 140, "triangle", t, 0.08, 0.1);
        noiseBurst(ctx, t + 0.14, 0.06, 0.16, 380);
        tone(ctx, 120, "triangle", t + 0.14, 0.08, 0.09);
        tone(ctx, 1200, "sine", t + 0.28, 0.08, 0.07, 1800);
      },
      function (ctx, t) {
        /* twig snap */
        noiseBurst(ctx, t, 0.04, 0.2, 2400);
        tone(ctx, 1800, "square", t, 0.03, 0.06);
        noiseBurst(ctx, t + 0.04, 0.05, 0.1, 900);
      },
      function (ctx, t) {
        /* gravel crunch walk */
        for (var i = 0; i < 3; i++) {
          noiseBurst(ctx, t + i * 0.12, 0.07, 0.14 - i * 0.02, 500 + i * 80);
          tone(ctx, 100 + i * 15, "triangle", t + i * 0.12, 0.07, 0.08);
        }
      },
      function (ctx, t) {
        /* trail bird call */
        tone(ctx, 1400, "sine", t, 0.06, 0.09, 1800);
        tone(ctx, 1600, "sine", t + 0.1, 0.05, 0.08, 2000);
        tone(ctx, 1200, "sine", t + 0.2, 0.1, 0.07, 900);
      },
      function (ctx, t) {
        /* backpack zip + step */
        noiseSweep(ctx, t, 0.12, 0.1, 3000, 1200);
        noiseBurst(ctx, t + 0.14, 0.06, 0.15, 420);
        tone(ctx, 130, "triangle", t + 0.14, 0.08, 0.09);
      }
    ],

    /* Genre: warm paint plops / brush / mustard tones */
    palette: [
      function (ctx, t) {
        /* warm mustard plops */
        tone(ctx, 196, "sine", t, 0.16, 0.14);
        tone(ctx, 246.94, "sine", t + 0.1, 0.16, 0.12);
        tone(ctx, 293.66, "triangle", t + 0.2, 0.2, 0.11);
      },
      function (ctx, t) {
        /* brush dab */
        noiseBurst(ctx, t, 0.05, 0.1, 800, 0.5);
        tone(ctx, 220, "sine", t, 0.12, 0.12);
        tone(ctx, 277, "sine", t + 0.1, 0.14, 0.09);
      },
      function (ctx, t) {
        /* chocolate swirl */
        tone(ctx, 165, "triangle", t, 0.25, 0.12, 220);
        tone(ctx, 196, "sine", t + 0.12, 0.22, 0.1);
        tone(ctx, 247, "sine", t + 0.24, 0.2, 0.08);
      },
      function (ctx, t) {
        /* paint tube squeeze */
        tone(ctx, 90, "sine", t, 0.2, 0.1, 140);
        noiseSweep(ctx, t + 0.05, 0.15, 0.08, 400, 900);
        tone(ctx, 330, "triangle", t + 0.18, 0.12, 0.07);
      },
      function (ctx, t) {
        /* palette knife scrape + plop */
        noiseSweep(ctx, t, 0.1, 0.11, 1500, 500);
        tone(ctx, 175, "sine", t + 0.1, 0.18, 0.13);
        tone(ctx, 262, "sine", t + 0.22, 0.16, 0.09);
      }
    ],

    /* Genre: industrious grind / typewriter / work taps */
    work: [
      function (ctx, t) {
        /* typewriter burst */
        for (var i = 0; i < 5; i++) {
          noiseBurst(ctx, t + i * 0.07, 0.03, 0.14 - i * 0.015, 2200);
          tone(ctx, 700 + i * 40, "square", t + i * 0.07, 0.04, 0.05);
        }
        tone(ctx, 520, "sine", t + 0.38, 0.15, 0.08);
      },
      function (ctx, t) {
        /* stapler punch */
        noiseBurst(ctx, t, 0.04, 0.2, 1800);
        tone(ctx, 200, "triangle", t, 0.08, 0.12, 100);
        tone(ctx, 400, "square", t + 0.05, 0.05, 0.06);
      },
      function (ctx, t) {
        /* keyboard clatter */
        for (var j = 0; j < 6; j++) {
          noiseBurst(ctx, t + j * 0.05, 0.025, 0.11, 2500 + (j % 3) * 300);
        }
      },
      function (ctx, t) {
        /* paper shuffle + stamp */
        noiseSweep(ctx, t, 0.12, 0.09, 1200, 500);
        noiseBurst(ctx, t + 0.14, 0.05, 0.16, 900);
        tone(ctx, 150, "triangle", t + 0.14, 0.1, 0.1);
      },
      function (ctx, t) {
        /* deadline ding */
        for (var k = 0; k < 3; k++) {
          noiseBurst(ctx, t + k * 0.06, 0.03, 0.12, 2000);
          tone(ctx, 600 + k * 50, "square", t + k * 0.06, 0.04, 0.05);
        }
        tone(ctx, 880, "sine", t + 0.28, 0.2, 0.1);
      }
    ],

    /* Genre: calculator / AP Calc beeps */
    calc: [
      function (ctx, t) {
        /* classic 4-beep + triumph */
        tone(ctx, 880, "square", t, 0.07, 0.08);
        tone(ctx, 988, "square", t + 0.09, 0.07, 0.08);
        tone(ctx, 1175, "square", t + 0.18, 0.07, 0.08);
        tone(ctx, 1319, "square", t + 0.28, 0.18, 0.12);
      },
      function (ctx, t) {
        /* single confirm beep */
        tone(ctx, 1000, "square", t, 0.1, 0.11);
        tone(ctx, 1000, "square", t + 0.14, 0.1, 0.09);
      },
      function (ctx, t) {
        /* error buzz then recover */
        tone(ctx, 200, "square", t, 0.12, 0.1);
        tone(ctx, 180, "square", t + 0.1, 0.12, 0.09);
        tone(ctx, 880, "square", t + 0.28, 0.12, 0.1);
      },
      function (ctx, t) {
        /* button mash sequence */
        var freqs = [740, 830, 880, 988, 1109];
        for (var i = 0; i < freqs.length; i++) {
          tone(ctx, freqs[i], "square", t + i * 0.06, 0.05, 0.07);
        }
      },
      function (ctx, t) {
        /* AP Calc 5 fanfare */
        tone(ctx, 659, "square", t, 0.08, 0.09);
        tone(ctx, 784, "square", t + 0.1, 0.08, 0.09);
        tone(ctx, 988, "square", t + 0.2, 0.08, 0.1);
        tone(ctx, 1319, "square", t + 0.3, 0.22, 0.13);
        tone(ctx, 659, "sine", t + 0.32, 0.28, 0.07);
      }
    ],

    /* Genre: Glen the CR-V — car noises */
    glen: [
      function (ctx, t) {
        /* friendly dual-tone honk */
        tone(ctx, 320, "sawtooth", t, 0.22, 0.12);
        tone(ctx, 280, "sawtooth", t + 0.05, 0.22, 0.1);
        tone(ctx, 90, "triangle", t + 0.18, 0.3, 0.12, 60);
      },
      function (ctx, t) {
        /* engine start blip */
        tone(ctx, 70, "sawtooth", t, 0.35, 0.14, 110);
        noiseBurst(ctx, t + 0.05, 0.2, 0.1, 200, 0.4);
        tone(ctx, 55, "triangle", t + 0.25, 0.2, 0.1);
      },
      function (ctx, t) {
        /* door close thunk */
        noiseBurst(ctx, t, 0.06, 0.18, 300, 0.5);
        tone(ctx, 90, "triangle", t, 0.12, 0.16, 50);
        tone(ctx, 140, "sine", t + 0.08, 0.1, 0.08);
      },
      function (ctx, t) {
        /* turn-signal click-click */
        noiseBurst(ctx, t, 0.03, 0.12, 2000);
        tone(ctx, 900, "square", t, 0.04, 0.07);
        noiseBurst(ctx, t + 0.22, 0.03, 0.12, 2000);
        tone(ctx, 900, "square", t + 0.22, 0.04, 0.07);
      },
      function (ctx, t) {
        /* reverse beep personality + idle */
        tone(ctx, 880, "square", t, 0.08, 0.08);
        tone(ctx, 880, "square", t + 0.14, 0.08, 0.08);
        tone(ctx, 880, "square", t + 0.28, 0.08, 0.08);
        tone(ctx, 80, "triangle", t + 0.35, 0.25, 0.1, 55);
      }
    ]
  };

  function pickIndex(name, count) {
    var idx = Math.floor(Math.random() * count);
    if (count > 1 && lastIndex[name] != null && idx === lastIndex[name]) {
      idx = (idx + 1 + Math.floor(Math.random() * (count - 1))) % count;
    }
    lastIndex[name] = idx;
    return idx;
  }

  function playSound(name) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var entry = SOUNDS[name];
    if (!entry) return;
    var fn = Array.isArray(entry) ? entry[pickIndex(name, entry.length)] : entry;
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
