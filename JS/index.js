    /* =========================================================================
       AUDIO SYNTHESIZER (WEB AUDIO API - 100% VANILLA, NO EXTERNAL FILES)
       ========================================================================= */
    class SoundEngine {
      constructor() {
        this.ctx = null;
        this.muted = false;
        this.masterGain = null;
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.tempo = 128; // BPM
      }

      init() {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
          }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }

      toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
          this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.25, this.ctx ? this.ctx.currentTime : 0);
        }
        return this.muted;
      }

      playTone(freq, type = 'sine', duration = 0.15, vol = 0.3, sweepTo = null) {
        if (this.muted || !this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          if (sweepTo) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(10, sweepTo), this.ctx.currentTime + duration);
          }
          gain.gain.setValueAtTime(vol, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start();
          osc.stop(this.ctx.currentTime + duration);
        } catch(e) {}
      }

      playNoise(duration = 0.2, vol = 0.25) {
        if (this.muted || !this.ctx) return;
        try {
          const bufferSize = this.ctx.sampleRate * duration;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(900, this.ctx.currentTime);
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(vol, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterGain);
          noise.start();
        } catch(e) {}
      }

      jump() {
        this.playTone(200, 'triangle', 0.15, 0.38, 520);
      }

      doubleJump() {
        this.playTone(380, 'sine', 0.18, 0.35, 820);
        setTimeout(() => this.playTone(680, 'triangle', 0.14, 0.28, 960), 35);
      }

      slide() {
        this.playNoise(0.26, 0.28);
        this.playTone(180, 'sine', 0.2, 0.15, 90);
      }

      slideBoost() {
        this.playTone(260, 'sawtooth', 0.15, 0.2, 600);
      }

      coin(comboLevel = 1) {
        const baseFreq = 880 + (comboLevel - 1) * 90;
        this.playTone(baseFreq, 'sine', 0.08, 0.22);
        setTimeout(() => this.playTone(baseFreq * 1.33, 'sine', 0.12, 0.24), 50);
      }

      spring() {
        this.playTone(130, 'sine', 0.36, 0.5, 780);
      }

      powerup() {
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, idx) => {
          setTimeout(() => this.playTone(freq, 'triangle', 0.2, 0.25), idx * 55);
        });
      }

      slowmoOn() {
        this.playTone(550, 'sine', 0.45, 0.4, 110);
      }

      slowmoOff() {
        this.playTone(130, 'sine', 0.3, 0.3, 480);
      }

      hit() {
        this.playNoise(0.3, 0.45);
        this.playTone(130, 'sawtooth', 0.22, 0.45, 35);
      }

      missionComplete() {
        const fan = [523, 659, 784, 1046];
        fan.forEach((f, i) => {
          setTimeout(() => this.playTone(f, 'triangle', 0.16, 0.35), i * 70);
        });
      }

      qteSuccess() {
        this.playTone(523, 'triangle', 0.14, 0.35);
        setTimeout(() => this.playTone(659, 'triangle', 0.14, 0.35), 65);
        setTimeout(() => this.playTone(784, 'triangle', 0.24, 0.4), 130);
      }

      qteFail() {
        this.playTone(220, 'sawtooth', 0.3, 0.4, 85);
      }

      victory() {
        const fanfare = [523, 659, 784, 1046, 1318];
        fanfare.forEach((f, i) => {
          setTimeout(() => this.playTone(f, 'sine', 0.4, 0.4), i * 130);
        });
      }

      // Procedural Synthwave BGM Loop
      startBGM() {
        if (this.bgmPlaying) return;
        this.bgmPlaying = true;
        this.scheduleBGMStep();
      }

      stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) clearTimeout(this.bgmTimer);
      }

      scheduleBGMStep() {
        if (!this.bgmPlaying) return;
        const stepTime = (60 / this.tempo) / 4;
        
        if (this.ctx && !this.muted) {
          const step16 = this.bgmStep % 16;
          // Kick on 0, 4, 8, 12
          if (step16 % 4 === 0) {
            this.playTone(115, 'sine', 0.08, 0.18, 40);
          }
          // Snare on 4, 12
          if (step16 === 4 || step16 === 12) {
            this.playNoise(0.08, 0.12);
          }
          // Synthwave Bass note pattern (D minor: D2, F2, G2, A2)
          const bassNotes = [73.42, 73.42, 87.31, 73.42, 98.00, 73.42, 110.00, 87.31];
          const bassFreq = bassNotes[(Math.floor(this.bgmStep / 2)) % bassNotes.length];
          if (this.bgmStep % 2 === 0) {
            this.playTone(bassFreq, 'sawtooth', 0.12, 0.06);
          }
          // Arp note
          if (this.bgmStep % 4 === 2) {
            const arpNotes = [293.66, 349.23, 440.00, 523.25, 587.33];
            const note = arpNotes[(this.bgmStep) % arpNotes.length];
            this.playTone(note, 'triangle', 0.09, 0.05);
          }
        }

        this.bgmStep++;
        this.bgmTimer = setTimeout(() => this.scheduleBGMStep(), stepTime * 1000);
      }
    }

    const sound = new SoundEngine();

    /* =========================================================================
       PERSISTENCE & UPGRADE DEFINITIONS
       ========================================================================= */
    const UPGRADES_CONFIG = {
      speed: {
        id: 'speed',
        name: 'Velocidade de Corrida',
        desc: 'Aumenta a velocidade máxima e a aceleração do protagonista (+6% por nível).',
        maxLevel: 5,
        baseCost: 200,
        costMult: 1.8,
        getValue: (lvl) => 1 + lvl * 0.06
      },
      jump: {
        id: 'jump',
        name: 'Força & Altura do Pulo',
        desc: 'Melhora o impulso de salto e o alcance aéreo (+7% por nível).',
        maxLevel: 5,
        baseCost: 220,
        costMult: 1.8,
        getValue: (lvl) => 1 + lvl * 0.07
      },
      slide: {
        id: 'slide',
        name: 'Velocidade do Slide (Roll)',
        desc: 'Slide com arrancada rápida (Slide Boost), menor atrito e recuperação ágil.',
        maxLevel: 5,
        baseCost: 180,
        costMult: 1.7,
        getValue: (lvl) => 1 + lvl * 0.12
      },
      shield: {
        id: 'shield',
        name: 'Distância do Perseguidor',
        desc: 'Inicia o perseguidor mais afastado e reduz 50% a perda de distância ao tropeçar.',
        maxLevel: 5,
        baseCost: 250,
        costMult: 1.9,
        getValue: (lvl) => lvl
      },
      time: {
        id: 'time',
        name: 'Extensão do Tempo de Fase',
        desc: 'Concede +12 segundos adicionais de cronômetro base em todos os níveis.',
        maxLevel: 5,
        baseCost: 200,
        costMult: 1.75,
        getValue: (lvl) => lvl * 12
      }
    };

    const SKIN_GROUPS = [
      { price: 500,  speed: 0.05, jump: 0.05, coin: 2 },
      { price: 1000, speed: 0.10, jump: 0.10, coin: 4 },
      { price: 2000, speed: 0.20, jump: 0.20, coin: 8 },
      { price: 4000, speed: 0.40, jump: 0.40, coin: 16 }
    ];
    const SKINS = [{ id: 0, name: 'Original', price: 0, speed: 0, jump: 0, coin: 1, body: '#0a0a0e', accent: '#00f0ff', extra: 'none' }].concat([
      ['Teia Urbana',      '#c1121f', '#1d4ed8', 'spider'],
      ['Sombra Noturna',   '#1f2937', '#facc15', 'bat'],
      ['Astro Solar',      '#1d4ed8', '#ef4444', 'sun'],
      ['Ninja Umbra',      '#3b0764', '#c084fc', 'ninja'],
      ['Cyber Guerreiro',  '#0f766e', '#22d3ee', 'cyber'],
      ['Raio Veloz',       '#ca8a04', '#fff176', 'volt'],
      ['Astronauta',       '#e5e7eb', '#38bdf8', 'astro'],
      ['Caçador Futuro',   '#166534', '#84cc16', 'hunter'],
      ['Samurai Neon',     '#9d174d', '#f472b6', 'samurai'],
      ['Robô Titã',        '#6b7280', '#f97316', 'robot'],
      ['Guardião Cósmico', '#5b21b6', '#e879f9', 'cosmic'],
      ['Lenda das Chamas', '#b91c1c', '#fb923c', 'flame']
    ].map((s, i) => Object.assign({ id: i + 1, name: s[0], body: s[1], accent: s[2], extra: s[3] }, SKIN_GROUPS[Math.floor(i / 3)])));

    const GameSave = {
      coins: 0,
      currentLevel: 1,
      highestUnlockedLevel: 1,
      upgrades: { speed: 0, jump: 0, slide: 0, shield: 0, time: 0 },
      skinsOwned: [0],
      skinEquipped: 0,

      load() {
        try {
          const raw = localStorage.getItem('vector_runner_save');
          if (raw) {
            const data = JSON.parse(raw);
            if (typeof data.coins === 'number') this.coins = data.coins;
            if (typeof data.currentLevel === 'number') this.currentLevel = Math.min(20, Math.max(1, data.currentLevel));
            if (typeof data.highestUnlockedLevel === 'number') this.highestUnlockedLevel = Math.min(20, Math.max(1, data.highestUnlockedLevel));
            if (Array.isArray(data.skinsOwned)) this.skinsOwned = data.skinsOwned.filter(n => Number.isInteger(n) && n >= 0 && n <= 12);
            if (!this.skinsOwned.includes(0)) this.skinsOwned.push(0);
            if (typeof data.skinEquipped === 'number' && this.skinsOwned.includes(data.skinEquipped)) this.skinEquipped = data.skinEquipped;
            if (data.upgrades) {
              for (let k in this.upgrades) {
                if (typeof data.upgrades[k] === 'number') {
                  this.upgrades[k] = Math.min(5, Math.max(0, data.upgrades[k]));
                }
              }
            }
          }
        } catch(e) {}
      },

      save() {
        try {
          const data = {
            coins: this.coins,
            currentLevel: this.currentLevel,
            highestUnlockedLevel: this.highestUnlockedLevel,
            upgrades: this.upgrades,
            skinsOwned: this.skinsOwned,
            skinEquipped: this.skinEquipped
          };
          localStorage.setItem('vector_runner_save', JSON.stringify(data));
        } catch(e) {}
      },

      getCost(upgradeId) {
        const conf = UPGRADES_CONFIG[upgradeId];
        const lvl = this.upgrades[upgradeId] || 0;
        return Math.round(conf.baseCost * Math.pow(conf.costMult, lvl));
      },

      buyUpgrade(upgradeId) {
        const conf = UPGRADES_CONFIG[upgradeId];
        const lvl = this.upgrades[upgradeId] || 0;
        if (lvl >= conf.maxLevel) return false;
        const cost = this.getCost(upgradeId);
        if (this.coins >= cost) {
          this.coins -= cost;
          this.upgrades[upgradeId]++;
          this.save();
          return true;
        }
        return false;
      },

      buySkin(id) {
        const sk = SKINS[id];
        if (!sk || this.skinsOwned.includes(id) || this.coins < sk.price) return false;
        this.coins -= sk.price;
        this.skinsOwned.push(id);
        this.save();
        return true;
      },

      equipSkin(id) {
        if (!this.skinsOwned.includes(id)) return false;
        this.skinEquipped = id;
        this.save();
        return true;
      }
    };

    GameSave.load();

    /* =========================================================================
       NARRATIVE INTRO CUTSCENE SCRIPT
       ========================================================================= */
    const INTRO_LINES = [
      "LOCALIZAÇÃO: COBERTURA DO EDIFÍCIO MEGACORP - 23:42h",
      "SITUAÇÃO DE EMERGÊNCIA: Alarme nível ômega disparado.",
      "INTRUSÃO: Agentes sombrios do Sindicato Cibernético romperam os vidros da diretoria!",
      "O PRESIDENTE EXECUTIVO FOI CAPTURADO!",
      "CHEFE (gritando no comunicador):",
      "\"SOCORRO! ME TIREM DAQUI!\"",
      "\"QUEM ME SALVAR TERÁ PROMOÇÃO IMEDIATA, CARGO DE DIRETOR E UM AUMENTO DE 300%!\"",
      "ESTAGIÁRIO (ajustando os tênis de parkour):",
      "\"Esse aumento é meu. Ninguém sequestra o meu chefe!\"",
      "SALTO INICIADO PELOS TELHADOS DA METRÓPOLE..."
    ];

    /* =========================================================================
       PARKOUR WORLD GENERATOR (20 DIVERSE LEVELS WITH RED OBSTACLES)
       ========================================================================= */
    class LevelGenerator {
      static generate(levelNum) {
        const length = Math.round(2400 + (levelNum - 1) * 1180);
        const baseTime = 38 + Math.round((levelNum - 1) * 6.5);
        const bonusTime = UPGRADES_CONFIG.time.getValue(GameSave.upgrades.time || 0);
        const totalTime = baseTime + bonusTime;

        let skyGradient = ['#1a0628', '#4b1248', '#f25078'];
        let neonAccent = '#00f0ff';
        if (levelNum > 5 && levelNum <= 10) {
          skyGradient = ['#05081c', '#0f244a', '#177096'];
          neonAccent = '#00ffcc';
        } else if (levelNum > 10 && levelNum <= 15) {
          skyGradient = ['#200408', '#5a0d18', '#c42847'];
          neonAccent = '#ff0055';
        } else if (levelNum > 15) {
          skyGradient = ['#070214', '#2a0845', '#6441a5'];
          neonAccent = '#ffe600';
        }

        const buildings = [];
        const obstacles = [];
        const springs = [];
        const coins = [];
        const powerups = [];
        const slowmoOrbs = [];
        const floatingPlatforms = [];

        let currentX = 0;
        const groundY = 560;
        
        const startRoofW = 900;
        buildings.push({ x: currentX, y: groundY, w: startRoofW, h: 400 });
        currentX += startRoofW;

        while (currentX < length - 800) {
          const minGap = 130 + Math.min(100, levelNum * 5);
          const maxGap = 200 + Math.min(160, levelNum * 8);
          const gap = Math.random() * (maxGap - minGap) + minGap;

          const bWidth = Math.random() * 500 + 400;
          const heightOffset = (Math.random() * 80 - 40);
          const bY = Math.min(600, Math.max(480, groundY + heightOffset));

          const b = { x: currentX + gap, y: bY, w: bWidth, h: 500 };
          buildings.push(b);

          const obsStart = obstacles.length;
          // Obstacles: Now bright Red with Hologram Warning signs!
          const numObstacles = Math.floor(Math.random() * 2) + 1;
          for (let o = 0; o < numObstacles; o++) {
            const obsX = b.x + 120 + o * 180 + Math.random() * 40;
            if (obsX + 80 < b.x + b.w - 50) {
              const r = Math.random();
              if (r < 0.45) {
                // Low Red Pipe (Requires Slide!)
                // Suspended pipe: bottom clearance is 32px above floor, allowing sliding player (height 26px) to pass safely!
                obstacles.push({
                  type: 'pipe',
                  x: obsX,
                  y: b.y - 82,
                  w: 48,
                  h: 50,
                  clearanceY: b.y - 32, // bottom of pipe
                  hit: false
                });
              } else if (r < 0.8) {
                // Red Water Tank / AC Condenser (Requires Jump!)
                obstacles.push({
                  type: 'tank',
                  x: obsX,
                  y: b.y - 48,
                  w: 48,
                  h: 48,
                  hit: false
                });
              } else if (levelNum >= 6) {
                // Red Laser Spire / Antenna (Requires Precision Jump or Double Jump)
                obstacles.push({
                  type: 'antenna',
                  x: obsX,
                  y: b.y - 88,
                  w: 24,
                  h: 88,
                  hit: false
                });
              }
            }
          }

          // Trampolines (Springs) and High Routes (Dual-paths)
          if (levelNum >= 4 && Math.random() < 0.38) {
            const springX = b.x + 60;
            springs.push({ x: springX, y: b.y - 12, w: 38, h: 12 });

            const floatW = 280;
            const floatY = b.y - 165;
            floatingPlatforms.push({ x: springX + 70, y: floatY, w: floatW, h: 18 });

            if (Math.random() < 0.6) {
              const types = ['turbo', 'mult', 'time', 'threat'];
              const pType = types[Math.floor(Math.random() * types.length)];
              powerups.push({ x: springX + 180, y: floatY - 32, type: pType, radius: 14 });
            }

            for (let c = 0; c < 5; c++) {
              coins.push({ x: springX + 90 + c * 35, y: floatY - 25, radius: 11, baseY: floatY - 25 });
            }
          }

          const cs = coins.length, os = slowmoOrbs.length, ps = powerups.length;
          // Ground Coins
          if (Math.random() < 0.72) {
            const coinStartX = b.x + 80;
            const isArc = Math.random() < 0.5;
            for (let c = 0; c < 4; c++) {
              const cx = coinStartX + c * 36;
              let cy = b.y - 30;
              if (isArc) {
                cy = b.y - 30 - Math.sin((c / 3) * Math.PI) * 55;
              }
              coins.push({ x: cx, y: cy, radius: 11, baseY: cy });
            }
          }

          // Slow-Mo Orbs
          if (Math.random() < 0.22) {
            slowmoOrbs.push({ x: b.x + b.w / 2, y: b.y - 50, radius: 12 });
          }

          // Power-ups
          if (Math.random() < 0.18) {
            const types = ['turbo', 'mult', 'time', 'threat'];
            const pType = types[Math.floor(Math.random() * types.length)];
            powerups.push({ x: b.x + b.w - 90, y: b.y - 36, type: pType, radius: 14 });
          }

          // Posições seguras: itens do chão não ficam dentro de obstáculos
          // (sob tubo = recompensa para quem rola; sobre caixa/antena = recompensa para quem pula)
          const bObs = obstacles.slice(obsStart);
          const fixSafe = (it) => {
            for (const ob of bObs) {
              if (it.x > ob.x - 24 && it.x < ob.x + ob.w + 24) {
                if (ob.type === 'pipe') it.y = b.y - 16;
                else if (ob.type === 'tank') it.y = b.y - 98;
                else it.y = b.y - 135;
                if (it.baseY !== undefined) it.baseY = it.y;
              }
            }
          };
          coins.slice(cs).forEach(fixSafe);
          slowmoOrbs.slice(os).forEach(fixSafe);
          powerups.slice(ps).forEach(fixSafe);

          currentX = b.x + b.w;
        }

        const finalRoofW = 1000;
        const finalRoof = { x: currentX + 160, y: groundY, w: finalRoofW, h: 400 };
        buildings.push(finalRoof);

        const goalX = finalRoof.x + 600;

        return {
          levelNum,
          length: goalX,
          totalTime,
          skyGradient,
          neonAccent,
          buildings,
          obstacles,
          springs,
          coins,
          powerups,
          slowmoOrbs,
          floatingPlatforms,
          goalX
        };
      }
    }

    /* =========================================================================
       PARTICLE & FLOATING TEXT ENGINE
       ========================================================================= */
    class VisualEffectsSystem {
      constructor() {
        this.particles = [];
        this.floatingTexts = [];
      }

      spawnParticles(x, y, count = 1, options = {}) {
        for (let i = 0; i < count; i++) {
          const color = options.color || '#00f0ff';
          const size = options.size || (Math.random() * 4 + 2);
          const angle = options.angle !== undefined ? options.angle + (Math.random() * 0.8 - 0.4) : Math.random() * Math.PI * 2;
          const speed = options.speed || (Math.random() * 5 + 1);
          const life = options.life || (Math.random() * 0.4 + 0.3);

          this.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size, color, life, maxLife: life,
            gravity: options.gravity || 0
          });
        }
      }

      spawnFloatingText(x, y, text, color = '#ffe600', scale = 1.0) {
        this.floatingTexts.push({
          x, y, text, color, scale,
          life: 0.85, maxLife: 0.85, vy: -1.8
        });
      }

      update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.life -= dt;
          if (p.life <= 0) {
            this.particles.splice(i, 1);
            continue;
          }
          p.vy += p.gravity * dt;
          p.x += p.vx * dt * 60;
          p.y += p.vy * dt * 60;
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
          const t = this.floatingTexts[i];
          t.life -= dt;
          if (t.life <= 0) {
            this.floatingTexts.splice(i, 1);
            continue;
          }
          t.y += t.vy;
        }
      }

      draw(ctx, cameraX) {
        // Draw Particles
        for (let p of this.particles) {
          const alpha = p.life / p.maxLife;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x - cameraX, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Draw Floating Texts
        for (let t of this.floatingTexts) {
          const alpha = Math.min(1, t.life / (t.maxLife * 0.5));
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = t.color;
          ctx.shadowColor = t.color;
          ctx.shadowBlur = 10;
          ctx.font = `900 ${Math.round(18 * t.scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(t.text, t.x - cameraX, t.y);
          ctx.restore();
        }
      }
    }

    /* =========================================================================
       MAIN GAME CONTROLLER & ENGINE
       ========================================================================= */
    class GameEngine {
      constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.vfx = new VisualEffectsSystem();

        this.state = 'MENU';
        this.levelData = null;
        this.cameraX = 0;
        this.timeScale = 1.0;
        this.levelTimer = 45;
        this.levelCoinsEarned = 0;

        // Player Entity
        this.player = {
          x: 100,
          y: 400,
          w: 28,
          h: 54,
          vx: 0,
          vy: 0,
          baseSpeed: 7.4,
          jumpForce: -13.8,
          isGrounded: false,
          coyoteTimer: 0,
          jumpBufferTimer: 0,
          canDoubleJump: true,
          isSliding: false,
          slideTimer: 0,
          runCycle: 0,
          stumbleTimer: 0,
          trail: []
        };

        // Chaser Entity
        this.chaser = {
          x: -250,
          y: 400,
          w: 32,
          h: 56,
          baseDistance: 450,
          distance: 450,
          speed: 7.0,
          staggerTimer: 0,
          runCycle: 0
        };

        // Combo & Parkour Flow System
        this.combo = 1;
        this.comboStreak = 0;
        this.comboTimer = 0;

        // Active Powerups
        this.powerups = { turbo: 0, mult: 0, threat: 0 };
        this.slowmoCharges = 3;
        this.slowmoTimer = 0;

        // Mini-Missions System (Addictive Quests per Run)
        this.missions = [
          { id: 'slide_pipes', text: 'Faça 2 slides perfeitos sob tubos vermelhos', progress: 0, goal: 2, reward: 150, done: false },
          { id: 'collect_coins', text: 'Colete 25 moedas sem tropeçar', progress: 0, goal: 25, reward: 200, done: false },
          { id: 'reach_combo', text: 'Alcance Combo x3 de parkour', progress: 0, goal: 3, reward: 180, done: false }
        ];

        // QTE Boss System
        this.qte = {
          step: 0,
          totalSteps: 5,
          requiredKey: ' ',
          displayKey: 'ESPAÇO',
          timer: 0,
          maxTimer: 2.2,
          actionDesc: ''
        };

        this.shakeTimer = 0;
        this.shakeAmount = 0;

        // Velocidade por acertos, dash da câmera lenta, guia e seletor de fase
        this.speedBonus = 0;
        this.dashTimer = 0;
        this.guideFromPause = false;
        this.pauseSelLevel = 1;
        this.shopReturn = null;      // tela para onde a loja devolve o jogador
        this._renderedState = null;
        this.coinSprite = this.createCoinSprite();

        // Botões não mantêm o foco: evita ESPAÇO/ENTER reativarem o último botão clicado
        document.addEventListener('click', (e) => {
          const b = e.target.closest ? e.target.closest('button') : null;
          if (b) b.blur();
        });

        this.initInput();
        this.initUI();
        this.updateMenuLevelLabel();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
      }

      createCoinSprite() {
        const cv = document.createElement('canvas');
        cv.width = 48;
        cv.height = 48;
        const c = cv.getContext('2d');
        c.translate(24, 24);
        c.fillStyle = '#ffd700';
        c.shadowColor = '#ffd700';
        c.shadowBlur = 12;
        c.beginPath();
        c.arc(0, 0, 11, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#000';
        c.font = 'bold 11px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('$', 0, 1);
        return cv;
      }

      resizeCanvas() {
        this.canvas.width = 1280;
        this.canvas.height = 720;
      }

      initInput() {
        this.keys = {};
        window.addEventListener('keydown', (e) => {
          sound.init();
          if (e.repeat) return;
          this.keys[e.code] = true;

          if (e.code === 'KeyM') this.toggleSound();
          if (e.code === 'KeyP' || e.code === 'Escape') this.togglePause();
          if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') this.handleLevelKey(e.code === 'ArrowRight' ? 1 : -1);

          if (e.code === 'KeyE') {
            if (this.state === 'PLAYING') this.activateSlowMotion();
            else if (this.state === 'QTE') this.handleQTEInput('KeyE');
          }

          if (this.state === 'PLAYING') {
            if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
              this.triggerJump();
            }
            if (e.code === 'KeyS' || e.code === 'ArrowDown') {
              this.triggerRoll();
            }
          }

          if (this.state === 'QTE') {
            this.handleQTEInput(e.code);
          }
        });

        window.addEventListener('keyup', (e) => {
          this.keys[e.code] = false;
        });

        // Dedicated On-Screen Roll, Jump, and Slow-Mo Action Buttons
        const rollBtn = document.getElementById('btn-action-roll');
        const jumpBtn = document.getElementById('btn-action-jump');
        const slowBtn = document.getElementById('btn-action-slow');

        const bindAction = (btn, actionFn) => {
          const handler = (e) => {
            e.preventDefault();
            sound.init();
            btn.classList.add('active');
            setTimeout(() => btn.classList.remove('active'), 150);
            actionFn();
          };
          btn.addEventListener('touchstart', handler, { passive: false });
          btn.addEventListener('mousedown', handler);
        };

        bindAction(rollBtn, () => {
          if (this.state === 'PLAYING') this.triggerRoll();
          if (this.state === 'QTE') this.handleQTEInput('KeyS');
        });

        bindAction(jumpBtn, () => {
          if (this.state === 'PLAYING') this.triggerJump();
          if (this.state === 'QTE') this.handleQTEInput('Space');
        });

        bindAction(slowBtn, () => {
          if (this.state === 'PLAYING') this.activateSlowMotion();
          if (this.state === 'QTE') this.handleQTEInput('KeyE');
        });
      }

      initUI() {
        document.getElementById('btn-play').onclick = () => {
          sound.init();
          this.openGuide(false);
        };

        document.getElementById('btn-level-select').onclick = () => this.openLevelSelect();
        document.getElementById('btn-shop-menu').onclick = () => this.openShop('screen-menu');
        document.getElementById('btn-guide').onclick = () => document.getElementById('screen-guide').classList.remove('hidden');
        document.getElementById('btn-story').onclick = () => document.getElementById('screen-story').classList.remove('hidden');

        document.getElementById('btn-guide-start').onclick = () => this.closeGuide();
        document.getElementById('btn-guide-skip').onclick = () => this.closeGuide();
        document.getElementById('btn-pause-guide').onclick = () => this.openGuide(true);
        document.getElementById('btn-menu-lvl-prev').onclick = () => this.changeMenuLevel(-1);
        document.getElementById('btn-menu-lvl-next').onclick = () => this.changeMenuLevel(1);
        document.getElementById('btn-pause-lvl-prev').onclick = () => this.changePauseLevel(-1);
        document.getElementById('btn-pause-lvl-next').onclick = () => this.changePauseLevel(1);
        document.getElementById('btn-pause-go').onclick = () => {
          GameSave.currentLevel = this.pauseSelLevel;
          GameSave.save();
          this.togglePause();
          this.startLevel(this.pauseSelLevel);
        };

        document.querySelectorAll('.close-modal').forEach(btn => {
          btn.onclick = () => {
            const target = btn.getAttribute('data-target');
            document.getElementById(target).classList.add('hidden');
          };
        });

        document.getElementById('btn-skip-cutscene').onclick = () => this.skipCutscene();
        document.getElementById('btn-sound').onclick = () => this.toggleSound();
        document.getElementById('btn-pause').onclick = () => this.togglePause();

        document.getElementById('btn-resume').onclick = () => this.togglePause();
        document.getElementById('btn-pause-shop').onclick = () => {
          this.openShop('screen-pause');   // mantém a partida pausada enquanto a loja está aberta
        };
        document.getElementById('btn-pause-restart').onclick = () => {
          this.togglePause();
          this.startLevel(this.levelData.levelNum);
        };
        document.getElementById('btn-pause-menu').onclick = () => {
          this.togglePause();
          this.showScreen('screen-menu');
          this.state = 'MENU';
        };

        document.getElementById('btn-close-shop').onclick = () => this.closeShop();
        document.getElementById('btn-shop-back').onclick = () => this.closeShop();
        document.getElementById('btn-shop-play').onclick = () => {
          if (this.shopReturn === 'screen-pause' && this.state === 'PAUSED') {
            // veio da pausa: retoma a mesma partida
            document.getElementById('screen-shop').classList.add('hidden');
            this.shopReturn = null;
            this.togglePause();
          } else {
            document.getElementById('screen-shop').classList.add('hidden');
            this.shopReturn = null;
            this.startLevel(GameSave.currentLevel);
          }
        };

        document.getElementById('btn-next-level').onclick = () => this.startLevel(GameSave.currentLevel);
        document.getElementById('btn-clear-shop').onclick = () => this.openShop('screen-level-clear');

        document.getElementById('btn-retry').onclick = () => this.startLevel(this.levelData.levelNum);
        document.getElementById('btn-gameover-shop').onclick = () => this.openShop('screen-game-over');
        document.getElementById('btn-gameover-menu').onclick = () => {
          this.showScreen('screen-menu');
          this.state = 'MENU';
        };

        document.getElementById('btn-victory-restart').onclick = () => {
          GameSave.currentLevel = 1;
          GameSave.save();
          this.showScreen('screen-menu');
          this.state = 'MENU';
        };
      }

      beginFromMenu() {
        sound.startBGM();
        if (GameSave.currentLevel === 1) {
          this.showCutscene();
        } else {
          this.startLevel(GameSave.currentLevel);
        }
      }

      openGuide(fromPause) {
        this.guideFromPause = fromPause;
        document.getElementById('btn-guide-start').textContent = fromPause ? 'ENTENDI — VOLTAR' : 'ENTENDI — COMEÇAR';
        document.getElementById('screen-intro').classList.remove('hidden');
      }

      closeGuide() {
        document.getElementById('screen-intro').classList.add('hidden');
        if (!this.guideFromPause) this.beginFromMenu();
      }

      handleLevelKey(dir) {
        const menuVisible = !document.getElementById('screen-menu').classList.contains('hidden');
        if (this.state === 'PAUSED') this.changePauseLevel(dir);
        else if (menuVisible && this.state !== 'PLAYING') this.changeMenuLevel(dir);
      }

      changeMenuLevel(dir) {
        const n = GameSave.currentLevel + dir;
        if (n < 1 || n > GameSave.highestUnlockedLevel) return;
        GameSave.currentLevel = n;
        GameSave.save();
        this.updateMenuLevelLabel();
      }

      updateMenuLevelLabel() {
        const el = document.getElementById('menu-level-label');
        if (el) el.textContent = `FASE ${String(GameSave.currentLevel).padStart(2, '0')} / 20`;
      }

      changePauseLevel(dir) {
        const n = this.pauseSelLevel + dir;
        if (n < 1 || n > GameSave.highestUnlockedLevel) return;
        this.pauseSelLevel = n;
        this.updatePauseLevelLabel();
      }

      updatePauseLevelLabel() {
        const el = document.getElementById('pause-level-label');
        if (el) el.textContent = `FASE ${String(this.pauseSelLevel).padStart(2, '0')} / 20`;
      }

      showScreen(screenId) {
        this.shopReturn = null;
        document.querySelectorAll('.overlay-screen').forEach(el => el.classList.add('hidden'));
        if (screenId) {
          const target = document.getElementById(screenId);
          if (target) target.classList.remove('hidden');
          if (screenId === 'screen-menu') this.updateMenuLevelLabel();
        }
      }

      toggleSound() {
        const isMuted = sound.toggleMute();
        document.getElementById('btn-sound').textContent = isMuted ? '🔇' : '🔊';
      }

      togglePause() {
        // Com a loja aberta, P/ESC não retomam a partida por baixo dela
        if (!document.getElementById('screen-shop').classList.contains('hidden')) return;
        if (this.state === 'PLAYING') {
          this.state = 'PAUSED';
          this.pauseSelLevel = this.levelData ? this.levelData.levelNum : 1;
          this.updatePauseLevelLabel();
          document.getElementById('screen-pause').classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
          this.state = 'PLAYING';
          document.getElementById('screen-pause').classList.add('hidden');
        }
      }

      openLevelSelect() {
        const grid = document.getElementById('level-buttons-container');
        grid.innerHTML = '';
        for (let l = 1; l <= 20; l++) {
          const btn = document.createElement('button');
          btn.className = `lvl-btn ${l === GameSave.currentLevel ? 'active-lvl' : ''}`;
          btn.textContent = `Fase ${l}`;
          if (l > GameSave.highestUnlockedLevel) {
            btn.disabled = true;
            btn.textContent = `🔒 ${l}`;
          } else {
            btn.onclick = () => {
              GameSave.currentLevel = l;
              GameSave.save();
              document.getElementById('screen-levels').classList.add('hidden');
              this.startLevel(l);
            };
          }
          grid.appendChild(btn);
        }
        document.getElementById('screen-levels').classList.remove('hidden');
      }

      showCutscene() {
        this.state = 'CUTSCENE';
        this.showScreen('screen-cutscene');
        const box = document.getElementById('cutscene-content');
        box.textContent = '';
        
        let lineIdx = 0, charIdx = 0, currentText = '';
        if (this.cutsceneInterval) clearInterval(this.cutsceneInterval);

        this.cutsceneInterval = setInterval(() => {
          if (lineIdx >= INTRO_LINES.length) {
            clearInterval(this.cutsceneInterval);
            setTimeout(() => this.skipCutscene(), 1500);
            return;
          }

          const targetLine = INTRO_LINES[lineIdx];
          if (charIdx < targetLine.length) {
            currentText += targetLine[charIdx];
            box.textContent = currentText;
            charIdx++;
            if (charIdx % 3 === 0) sound.playTone(800, 'square', 0.02, 0.04);
          } else {
            currentText += '\n';
            lineIdx++;
            charIdx = 0;
          }
        }, 22);
      }

      skipCutscene() {
        if (this.cutsceneInterval) clearInterval(this.cutsceneInterval);
        this.startLevel(1);
      }

      /* =========================================================================
         LEVEL INITIALIZATION
         ========================================================================= */
      startLevel(lvlNum) {
        this.levelData = LevelGenerator.generate(lvlNum);
        this.state = 'PLAYING';
        this.showScreen(null);

        const speedMult = UPGRADES_CONFIG.speed.getValue(GameSave.upgrades.speed || 0);
        const shieldLvl = UPGRADES_CONFIG.shield.getValue(GameSave.upgrades.shield || 0);

        this.player.x = 200;
        this.player.y = 450;
        this.player.vx = this.player.baseSpeed * speedMult;
        this.player.vy = 0;
        this.player.isGrounded = false;
        this.player.isSliding = false;
        this.player.canDoubleJump = true;
        this.player.coyoteTimer = 0;
        this.player.jumpBufferTimer = 0;
        this.player.stumbleTimer = 0;
        this.player.trail = [];

        const startDist = 420 + shieldLvl * 90;
        this.chaser.baseDistance = startDist;
        this.chaser.distance = startDist;
        this.chaser.x = this.player.x - startDist;
        this.chaser.y = this.player.y;
        this.chaser.speed = this.player.vx * (0.95 + lvlNum * 0.007);
        this.chaser.staggerTimer = 0;

        this.levelTimer = this.levelData.totalTime;
        this.levelCoinsEarned = 0;
        this.powerups.turbo = 0;
        this.powerups.mult = 0;
        this.powerups.threat = 0;
        this.slowmoTimer = 0;
        this.timeScale = 1.0;

        // Reset Combos & Reset active missions progress for this run
        this.combo = 1;
        this.comboStreak = 0;
        this.comboTimer = 0;
        this.resetRunMissions();
        this.speedBonus = 0;
        this.dashTimer = 0;

        this.cameraX = this.player.x - 220;
        sound.startBGM();
        this.updateHUD();
      }

      resetRunMissions() {
        this.missions = [
          { id: 'slide_pipes', text: 'Faça 2 slides sob tubos vermelhos', progress: 0, goal: 2, reward: 150, done: false },
          { id: 'collect_coins', text: 'Colete 25 moedas sem tropeçar', progress: 0, goal: 25, reward: 200, done: false },
          { id: 'reach_combo', text: 'Alcance Combo x3 de parkour', progress: 0, goal: 3, reward: 180, done: false }
        ];
        this.updateMissionDisplay();
      }

      checkMissionProgress(missionId, amount = 1) {
        const m = this.missions.find(x => x.id === missionId && !x.done);
        if (!m) return;
        m.progress += amount;
        if (m.progress >= m.goal) {
          m.done = true;
          m.progress = m.goal;
          GameSave.coins += m.reward;
          GameSave.save();
          sound.missionComplete();
          this.vfx.spawnFloatingText(this.player.x, this.player.y - 45, `★ MISSÃO CUMPRIDA! +${m.reward}`, '#00ff66', 1.3);
          this.shakeScreen(0.2, 6);
        }
        this.updateMissionDisplay();
      }

      updateMissionDisplay() {
        const active = this.missions.find(x => !x.done);
        const textElem = document.getElementById('hud-mission-text');
        if (active) {
          textElem.textContent = `${active.text} (${active.progress}/${active.goal})`;
        } else {
          textElem.textContent = 'Todas as missões da corrida cumpridas! (+530 moedas)';
          textElem.style.color = '#00ff66';
        }
      }

      /* =========================================================================
         IMPROVED MECHANICS: JUMP, SLIDE DASH, FAST DROP
         ========================================================================= */
      triggerJump() {
        const jumpMult = UPGRADES_CONFIG.jump.getValue(GameSave.upgrades.jump || 0) * Math.sqrt(1 + this.getSkin().jump);

        if (this.player.isGrounded || this.player.coyoteTimer > 0) {
          // Clean First Jump
          this.player.vy = this.player.jumpForce * 36 * jumpMult;
          this.player.isGrounded = false;
          this.player.coyoteTimer = 0;
          this.player.isSliding = false;
          sound.jump();
          this.vfx.spawnParticles(this.player.x, this.player.y + 26, 10, { color: '#00f0ff', speed: 4 });
          this.addComboPoint('SALTO LIMPO!');
        } else if (this.player.canDoubleJump) {
          // Double Jump Somersault
          this.player.vy = this.player.jumpForce * 33 * jumpMult;
          this.player.canDoubleJump = false;
          this.player.isSliding = false;
          sound.doubleJump();
          this.vfx.spawnParticles(this.player.x, this.player.y, 16, { color: '#ff0055', speed: 6 });
          this.vfx.spawnFloatingText(this.player.x, this.player.y - 30, 'MORTAL DUPLO!', '#ff0055', 1.1);
        } else {
          // Jump buffer
          this.player.jumpBufferTimer = 0.14;
        }
      }

      triggerRoll() {
        const slideUpgrade = UPGRADES_CONFIG.slide.getValue(GameSave.upgrades.slide || 0);

        if (!this.player.isGrounded) {
          // FAST DROP DIVE: Pressing roll in air rapidly drives player down into an immediate slide roll!
          this.player.vy = 850;
          sound.slideBoost();
          this.vfx.spawnParticles(this.player.x, this.player.y, 8, { color: '#ffe600', speed: 5 });
          this.player.isSliding = true;
          this.player.slideTimer = 0.65 * slideUpgrade;
          return;
        }

        if (this.player.isSliding) return;

        // Ground Slide with Slide Boost
        this.player.isSliding = true;
        this.player.slideTimer = 0.6 * slideUpgrade;
        sound.slide();
        sound.slideBoost();

        // Slide Dash forward impulse
        this.player.vx *= 1.18;
        this.vfx.spawnParticles(this.player.x - 8, this.player.y + 26, 14, {
          color: '#ffe600', speed: 5, gravity: 220
        });
        this.vfx.spawnFloatingText(this.player.x, this.player.y - 20, 'SLIDE DASH!', '#ffe600', 1.0);
      }

      addComboPoint(popupLabel) {
        this.comboStreak++;
        this.comboTimer = 3.5; // combo stays alive for 3.5s
        const prevCombo = this.combo;
        this.combo = Math.min(5, Math.floor(this.comboStreak / 3) + 1);

        if (this.combo > prevCombo) {
          sound.slideBoost();
          this.vfx.spawnFloatingText(this.player.x, this.player.y - 35, `COMBO x${this.combo}!`, '#00f0ff', 1.25);
          this.checkMissionProgress('reach_combo', this.combo);
        } else if (popupLabel && Math.random() < 0.4) {
          this.vfx.spawnFloatingText(this.player.x, this.player.y - 25, popupLabel, '#a0f0ff', 0.9);
        }

        const badge = document.getElementById('hud-combo-badge');
        badge.style.transform = 'scale(1.15)';
        setTimeout(() => badge.style.transform = 'scale(1)', 140);
      }

      breakCombo() {
        if (this.comboStreak > 0) {
          this.vfx.spawnFloatingText(this.player.x, this.player.y - 25, 'COMBO PERDIDO!', '#ff1e42', 1.1);
        }
        this.combo = 1;
        this.comboStreak = 0;
        this.comboTimer = 0;
      }

      // Acerto válido em obstáculo: soma combo + bônus de velocidade (limitado a +30%)
      registerDodge(label) {
        this.speedBonus = Math.min(0.3, this.speedBonus + 0.04);
        this.addComboPoint(label);
        this.vfx.spawnFloatingText(this.player.x + 30, this.player.y - 55, '+VELOCIDADE', '#00f0ff', 1.0);
        this.vfx.spawnParticles(this.player.x - 10, this.player.y, 10, { color: '#00f0ff', speed: 5, angle: Math.PI });
      }

      activateSlowMotion() {
        if (this.slowmoCharges <= 0 || this.slowmoTimer > 0) return;
        this.slowmoCharges--;
        this.slowmoTimer = 4.0;
        this.timeScale = 0.3;
        sound.slowmoOn();
        this.updateHUD();

        this.vfx.spawnParticles(this.player.x, this.player.y, 25, { color: '#00f0ff', speed: 6, life: 0.6 });
        this.vfx.spawnFloatingText(this.player.x, this.player.y - 35, 'CÂMERA LENTA!', '#00f0ff', 1.2);

        // Dash para a frente: uma única vez por ativação (tempo real, 0.45s)
        this.dashTimer = 0.45;
        this.vfx.spawnFloatingText(this.player.x + 20, this.player.y - 60, 'DASH!', '#ffe600', 1.2);
        this.vfx.spawnParticles(this.player.x - 10, this.player.y, 18, { color: '#ffe600', speed: 7, angle: Math.PI });
      }

      /* =========================================================================
         PHYSICS & UPDATE LOOP
         ========================================================================= */
      update(dt) {
        if (this.state !== 'PLAYING') return;

        const effectiveDt = dt * this.timeScale;

        // Slow-mo decrement
        if (this.slowmoTimer > 0) {
          this.slowmoTimer -= dt;
          if (this.slowmoTimer <= 0) {
            this.slowmoTimer = 0;
            this.timeScale = 1.0;
            sound.slowmoOff();
          }
        }

        // Combo Timer
        if (this.comboTimer > 0) {
          this.comboTimer -= dt;
          if (this.comboTimer <= 0) {
            this.breakCombo();
          }
        }

        // Level Timer
        this.levelTimer -= dt;
        if (this.levelTimer <= 0) {
          this.levelTimer = 0;
          this.gameOver('O tempo limite do nível esgotou!');
          return;
        }

        // Power-ups countdown
        if (this.powerups.turbo > 0) this.powerups.turbo -= dt;
        if (this.powerups.mult > 0) this.powerups.mult -= dt;
        if (this.powerups.threat > 0) this.powerups.threat -= dt;
        if (this.speedBonus > 0) this.speedBonus = Math.max(0, this.speedBonus - 0.006 * dt);

        // Player Speed with upgrades, turbo, and combo momentum
        const speedMult = UPGRADES_CONFIG.speed.getValue(GameSave.upgrades.speed || 0);
        let targetVx = this.player.baseSpeed * speedMult * (1 + (this.combo - 1) * 0.04) * (1 + this.getSkin().speed) * (1 + this.speedBonus);
        if (this.powerups.turbo > 0) targetVx *= 1.36;
        if (this.player.stumbleTimer > 0) {
          this.player.stumbleTimer -= dt;
          targetVx *= 0.52;
        }
        if (this.dashTimer > 0) {
          this.dashTimer -= dt;
          targetVx *= 1.7;
        }
        targetVx = Math.min(targetVx, 17); // teto de velocidade
        this.player.vx = targetVx;

        // Ghost Trail Generation
        if (this.powerups.turbo > 0 || this.combo >= 4 || this.timeScale < 1.0) {
          this.player.trail.push({
            x: this.player.x,
            y: this.player.y,
            isSliding: this.player.isSliding,
            runCycle: this.player.runCycle,
            alpha: 0.55
          });
          if (this.player.trail.length > 8) this.player.trail.shift();
        } else {
          if (this.player.trail.length > 0) this.player.trail.shift();
        }

        // Turbo: rastro de fogo (somente o jogador)
        if (this.powerups.turbo > 0 && Math.random() < 0.6) {
          this.vfx.spawnParticles(this.player.x - 14, this.player.y + 4, 1, { color: '#ff4400', speed: 3, angle: Math.PI });
        }

        // Coyote Timer & Jump Buffering
        if (this.player.isGrounded) {
          this.player.coyoteTimer = 0.12;
          this.player.canDoubleJump = true;
        } else {
          this.player.coyoteTimer -= effectiveDt;
        }

        if (this.player.jumpBufferTimer > 0) {
          this.player.jumpBufferTimer -= effectiveDt;
          if (this.player.coyoteTimer > 0) {
            this.triggerJump();
          }
        }

        // Apply Gravity & Movement
        const gravity = 1020;
        this.player.vy += gravity * effectiveDt;
        this.player.x += this.player.vx * effectiveDt * 60;
        this.player.y += this.player.vy * effectiveDt;

        // Slide State
        if (this.player.isSliding) {
          this.player.slideTimer -= effectiveDt;
          if (Math.random() < 0.45) {
            this.vfx.spawnParticles(this.player.x - 12, this.player.y + 25, 2, { color: '#ffe600', speed: 3 });
          }
          if (this.player.slideTimer <= 0) {
            this.player.isSliding = false;
          }
        }

        // Athletic Run Cycle
        if (this.player.isGrounded && !this.player.isSliding) {
          this.player.runCycle += effectiveDt * (15 + this.player.vx * 0.4);
          // Dust puffs on footfalls
          if (Math.sin(this.player.runCycle) > 0.85 && Math.random() < 0.3) {
            this.vfx.spawnParticles(this.player.x - 10, this.player.y + 26, 2, { color: '#68728a', speed: 1.5 });
          }
        }

        // Ground & Building Collisions
        this.checkCollisions();

        // Obstáculo superado sem tropeçar = acerto válido (uma única vez por obstáculo)
        for (const ob of this.levelData.obstacles) {
          if (ob.type !== 'pipe' && !ob.hit && !ob.passed && this.player.x - 14 > ob.x + ob.w) {
            ob.passed = true;
            this.registerDodge(ob.type === 'tank' ? 'PULO PERFEITO!' : 'DESVIO PERFEITO!');
          }
        }

        // Screen Fall (Abismo Urbano)
        if (this.player.y > 750) {
          this.gameOver('Você caiu em um abismo entre os edifícios!');
          return;
        }

        // Spring Trampoline Collisions
        for (let sp of this.levelData.springs) {
          if (Math.abs(this.player.x - sp.x) < 28 && Math.abs(this.player.y + 24 - sp.y) < 20) {
            const jumpMult = UPGRADES_CONFIG.jump.getValue(GameSave.upgrades.jump || 0) * Math.sqrt(1 + this.getSkin().jump);
            this.player.vy = -750 * jumpMult;
            this.player.isGrounded = false;
            this.player.canDoubleJump = true;
            this.player.isSliding = false;
            sound.spring();
            this.vfx.spawnParticles(sp.x, sp.y, 18, { color: '#00ff66', speed: 8, gravity: 220 });
            this.vfx.spawnFloatingText(sp.x, sp.y - 30, 'SUPER IMPULSO!', '#00ff66', 1.2);
            this.addComboPoint('SUPER IMPULSO!');
            break;
          }
        }

        // Coin Collection (with Magnetic Attraction)
        const magnetRange = 140;
        for (let i = this.levelData.coins.length - 1; i >= 0; i--) {
          const c = this.levelData.coins[i];
          const dx = this.player.x - c.x;
          if (dx > magnetRange || dx < -magnetRange) continue; // longe demais: nem ímã nem coleta
          const dy = this.player.y - c.y;
          const dist = Math.hypot(dx, dy);

          if (dist < magnetRange) {
            const pullSpeed = 480 * effectiveDt;
            c.x += (dx / dist) * pullSpeed;
            c.y += (dy / dist) * pullSpeed;
          }

          if (dist < 28) {
            const mult = (this.powerups.mult > 0 ? 2 : 1) * this.combo;
            const coinVal = 10 * mult * this.getSkin().coin;
            this.levelCoinsEarned += coinVal;
            GameSave.coins += coinVal;
            sound.coin(this.combo);
            this.vfx.spawnParticles(c.x, c.y, 8, { color: '#ffd700', speed: 4 });
            this.vfx.spawnFloatingText(c.x, c.y - 15, `+${coinVal}`, '#ffd700', 0.9);
            this.checkMissionProgress('collect_coins', 1);
            this.levelData.coins.splice(i, 1);
            this.updateHUD();
          }
        }

        // Power-Up Spheres
        for (let i = this.levelData.powerups.length - 1; i >= 0; i--) {
          const p = this.levelData.powerups[i];
          const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
          if (dist < 32) {
            this.applyPowerup(p.type);
            sound.powerup();
            const color = this.getPowerupColor(p.type);
            this.vfx.spawnParticles(p.x, p.y, 22, { color, speed: 7 });
            this.vfx.spawnFloatingText(p.x, p.y - 30, p.type.toUpperCase() + '!', color, 1.2);
            this.levelData.powerups.splice(i, 1);
            this.updateHUD();
          }
        }

        // Slow-Mo Orbs
        for (let i = this.levelData.slowmoOrbs.length - 1; i >= 0; i--) {
          const orb = this.levelData.slowmoOrbs[i];
          const dist = Math.hypot(this.player.x - orb.x, this.player.y - orb.y);
          if (dist < 30) {
            if (this.slowmoCharges < 5) this.slowmoCharges++;
            sound.coin(1);
            this.vfx.spawnParticles(orb.x, orb.y, 16, { color: '#00f0ff', speed: 5 });
            this.vfx.spawnFloatingText(orb.x, orb.y - 25, '+1 SLOW-MO!', '#00f0ff', 1.0);
            this.levelData.slowmoOrbs.splice(i, 1);
            this.updateHUD();
          }
        }

        // Chaser Mechanics
        this.updateChaser(effectiveDt, dt);

        // Smooth Camera Follow
        const targetCamX = this.player.x - 260;
        this.cameraX += (targetCamX - this.cameraX) * 0.12;

        this.vfx.update(effectiveDt);

        if (this.shakeTimer > 0) this.shakeTimer -= dt;

        // Checkpoint / End of Level reached!
        if (this.player.x >= this.levelData.goalX) {
          if (this.levelData.levelNum === 20) {
            this.triggerQTEBoss();
          } else {
            this.levelClear();
          }
          return;
        }

        this.updateHUD();
      }

      /* =========================================================================
         COLLISION DETECTION & RESPONSE (RED OBSTACLES)
         ========================================================================= */
      checkCollisions() {
        this.player.isGrounded = false;
        const playerBottom = this.player.y + 26;
        const playerTop = this.player.isSliding ? this.player.y : this.player.y - 28;
        const playerLeft = this.player.x - 14;
        const playerRight = this.player.x + 14;

        // Rooftops & Platforms
        const allSurfaces = this.levelData._surfaces || (this.levelData._surfaces = [...this.levelData.buildings, ...this.levelData.floatingPlatforms]);
        for (let surf of allSurfaces) {
          if (playerRight > surf.x && playerLeft < surf.x + surf.w) {
            if (this.player.vy >= 0 && playerBottom >= surf.y - 2 && playerBottom <= surf.y + 22) {
              this.player.y = surf.y - 26;
              this.player.vy = 0;
              this.player.isGrounded = true;
              break;
            }
          }
        }

        // Red Obstacles Collisions
        for (let obs of this.levelData.obstacles) {
          if (playerRight > obs.x && playerLeft < obs.x + obs.w) {
            if (obs.type === 'pipe') {
              // Pipe: Bottom clearance is at clearanceY.
              // If sliding: playerTop is player.y (26px height).
              // Clearance allows sliding player to glide underneath safely!
              if (this.player.isSliding) {
                if (!obs.slidUnder) {
                  obs.slidUnder = true;
                  this.vfx.spawnFloatingText(obs.x + 20, obs.y - 20, 'SLIDE PERFEITO! +50', '#00ff66', 1.15);
                  this.registerDodge('SLIDE PERFEITO!');
                  this.checkMissionProgress('slide_pipes', 1);
                }
              } else {
                // Standing: player hits the pipe!
                if (!obs.hit) {
                  this.hitObstacle();
                  obs.hit = true;
                }
              }
            } else {
              // Tank / Spire: Solid jump obstacle!
              if (playerBottom > obs.y + 6 && playerTop < obs.y + obs.h) {
                if (!obs.hit) {
                  this.hitObstacle();
                  obs.hit = true;
                }
              }
            }
          }
        }
      }

      hitObstacle() {
        if (this.player.stumbleTimer > 0) return;
        const shieldLvl = UPGRADES_CONFIG.shield.getValue(GameSave.upgrades.shield || 0);
        this.player.stumbleTimer = 0.55;
        this.speedBonus *= 0.5;
        this.breakCombo();
        sound.hit();
        this.shakeScreen(0.32, 10);

        const penalty = Math.max(50, 140 - shieldLvl * 18);
        this.chaser.distance = Math.max(10, this.chaser.distance - penalty);

        this.vfx.spawnParticles(this.player.x, this.player.y, 20, { color: '#ff1e42', speed: 6 });
        this.vfx.spawnFloatingText(this.player.x, this.player.y - 30, 'TROPEÇO!', '#ff1e42', 1.2);
      }

      shakeScreen(duration, amount) {
        this.shakeTimer = duration;
        this.shakeAmount = amount;
      }

      /* =========================================================================
         CHASER AI
         ========================================================================= */
      updateChaser(effectiveDt, realDt) {
        // Dash da câmera lenta abre distância (apenas o jogador acelera)
        if (this.dashTimer > 0) {
          this.chaser.distance = Math.min(500, this.chaser.distance + 300 * realDt);
        }

        if (this.powerups.threat > 0) {
          this.chaser.distance = Math.min(500, this.chaser.distance + 150 * realDt);
          return;
        }

        const catchupRate = (0.22 + this.levelData.levelNum * 0.04) * 60 * effectiveDt;
        this.chaser.distance -= catchupRate;

        // Velocidade do jogador acima da base (acertos, turbo, skin, dash) afasta o perseguidor
        const refVx = this.player.baseSpeed * UPGRADES_CONFIG.speed.getValue(GameSave.upgrades.speed || 0);
        const extraSpeed = Math.max(0, this.player.vx / refVx - 1);
        this.chaser.distance = Math.min(500, this.chaser.distance + extraSpeed * 160 * effectiveDt);

        this.chaser.x = this.player.x - this.chaser.distance;
        this.chaser.y = this.player.y;
        this.chaser.runCycle += effectiveDt * 16;

        if (this.chaser.distance <= 15) {
          this.gameOver('O Perseguidor alcançou e neutralizou você!');
        }
      }

      applyPowerup(type) {
        if (type === 'turbo') this.powerups.turbo = 5.0;
        else if (type === 'mult') this.powerups.mult = 5.0;
        else if (type === 'time') this.levelTimer += 20;
        else if (type === 'threat') {
          this.powerups.threat = 10.0;
          this.chaser.distance = Math.min(500, this.chaser.distance + 220);
        }
      }

      getPowerupColor(type) {
        switch (type) {
          case 'turbo': return '#ff2200';
          case 'mult': return '#b537f2';
          case 'time': return '#00f0ff';
          case 'threat': return '#00ff66';
          default: return '#ffffff';
        }
      }

      /* =========================================================================
         LEVEL CLEAR & GAME OVER
         ========================================================================= */
      levelClear() {
        this.state = 'LEVEL_CLEAR';
        sound.victory();

        GameSave.coins += Math.round(this.levelTimer * 10);
        GameSave.currentLevel = Math.min(20, this.levelData.levelNum + 1);
        if (GameSave.currentLevel > GameSave.highestUnlockedLevel) {
          GameSave.highestUnlockedLevel = GameSave.currentLevel;
        }
        GameSave.save();

        document.getElementById('clear-time').textContent = Math.round(this.levelTimer) + 's';
        document.getElementById('clear-coins').textContent = '+' + this.levelCoinsEarned;
        this.showScreen('screen-level-clear');
      }

      gameOver(reason) {
        this.state = 'GAMEOVER';
        sound.hit();
        GameSave.save();

        const progressPercent = Math.min(100, Math.round((this.player.x / this.levelData.goalX) * 100));
        document.getElementById('game-over-reason').textContent = reason;
        document.getElementById('game-over-progress').textContent = `Fase ${this.levelData.levelNum} (${progressPercent}%)`;
        document.getElementById('game-over-coins').textContent = GameSave.coins;
        this.showScreen('screen-game-over');
      }

      /* =========================================================================
         FINAL BOSS QTE MINIGAME (LEVEL 20)
         ========================================================================= */
      triggerQTEBoss() {
        this.state = 'QTE';
        this.qte.step = 0;
        this.showScreen('screen-qte');
        this.nextQTEStep();
      }

      nextQTEStep() {
        this.qte.step++;
        if (this.qte.step > this.qte.totalSteps) {
          this.victory();
          return;
        }

        const steps = [
          { key: 'KeyW', label: 'W / CIMA', desc: 'Salto acrobático para desviar dos projéteis!', time: 2.5 },
          { key: 'KeyS', label: 'S / BAIXO', desc: 'Rasteira tática sob a hélice do helicóptero!', time: 2.2 },
          { key: 'Space', label: 'ESPAÇO', desc: 'Voadora giratória no líder dos capangas!', time: 1.9 },
          { key: 'KeyE', label: 'E', desc: 'Desarme em câmera lenta da maleta de fuga!', time: 1.6 },
          { key: 'Space', label: 'ESPAÇO', desc: 'GOLPE FINAL: Chute dinâmico para resgatar o Chefe!', time: 1.4 }
        ];

        const current = steps[this.qte.step - 1];
        this.qte.requiredKey = current.key;
        this.qte.displayKey = current.label;
        this.qte.maxTimer = current.time;
        this.qte.timer = current.time;
        this.qte.actionDesc = current.desc;

        document.getElementById('qte-key-label').textContent = current.label;
        document.getElementById('qte-action-desc').textContent = current.desc;
        document.getElementById('qte-step-count').textContent = `${this.qte.step} / ${this.qte.totalSteps}`;
        document.getElementById('qte-status').textContent = 'REAGINDO...';
        document.getElementById('qte-status').style.color = '#00ff66';
      }

      handleQTEInput(keyCode) {
        if (this.state !== 'QTE') return;
        
        let match = false;
        if (this.qte.requiredKey === 'Space' && (keyCode === 'Space' || keyCode === 'ArrowUp')) match = true;
        if (this.qte.requiredKey === 'KeyW' && (keyCode === 'KeyW' || keyCode === 'ArrowUp')) match = true;
        if (this.qte.requiredKey === 'KeyS' && (keyCode === 'KeyS' || keyCode === 'ArrowDown')) match = true;
        if (this.qte.requiredKey === 'KeyE' && keyCode === 'KeyE') match = true;

        if (match) {
          sound.qteSuccess();
          this.shakeScreen(0.2, 10);
          this.vfx.spawnParticles(640, 360, 20, { color: '#00ff66', speed: 8 });
          this.nextQTEStep();
        } else {
          sound.qteFail();
          this.shakeScreen(0.3, 14);
          document.getElementById('qte-status').textContent = 'ERROU O TIMING!';
          document.getElementById('qte-status').style.color = '#ff0055';
          this.state = 'QTE_FAIL';
          setTimeout(() => {
            if (this.state === 'QTE_FAIL') this.gameOver('Você falhou no combate final e os capangas escaparam com o chefe!');
          }, 600);
        }
      }

      updateQTE(dt) {
        if (this.state !== 'QTE') return;
        this.qte.timer -= dt;
        const pct = Math.max(0, (this.qte.timer / this.qte.maxTimer) * 100);
        document.getElementById('qte-timer-bar').style.width = pct + '%';

        if (this.qte.timer <= 0) {
          sound.qteFail();
          this.gameOver('Tempo de reação esgotado no confronto final!');
        }
      }

      victory() {
        this.state = 'VICTORY';
        sound.victory();
        document.getElementById('vic-coins').textContent = GameSave.coins;
        this.showScreen('screen-victory');
      }

      /* =========================================================================
         UPGRADE SHOP UI
         ========================================================================= */
      openShop(returnId) {
        if (returnId !== undefined) {
          this.shopReturn = returnId;
          if (returnId) document.getElementById(returnId).classList.add('hidden');
        }
        const shopModal = document.querySelector('#screen-shop .modal-box');
        const prevScroll = shopModal ? shopModal.scrollTop : 0;
        const container = document.getElementById('shop-items-container');
        container.innerHTML = '';
        document.getElementById('shop-coins-display').textContent = GameSave.coins;

        for (let id in UPGRADES_CONFIG) {
          const conf = UPGRADES_CONFIG[id];
          const curLvl = GameSave.upgrades[id] || 0;
          const cost = GameSave.getCost(id);
          const isMax = curLvl >= conf.maxLevel;

          const item = document.createElement('div');
          item.className = 'shop-item';
          
          let pipsHtml = '';
          for (let p = 1; p <= conf.maxLevel; p++) {
            pipsHtml += `<div class="pip ${p <= curLvl ? 'filled' : ''}"></div>`;
          }

          item.innerHTML = `
            <div>
              <div class="shop-item-header">
                <span class="shop-item-title">${conf.name}</span>
                <div class="shop-pips">${pipsHtml}</div>
              </div>
              <div class="shop-item-desc" style="margin-top:6px;">${conf.desc}</div>
            </div>
            <div class="shop-item-footer">
              <span class="shop-cost">${isMax ? 'MÁXIMO' : `🪙 ${cost}`}</span>
              <button class="btn btn-accent btn-buy" data-id="${id}" ${isMax || GameSave.coins < cost ? 'disabled' : ''}>
                ${isMax ? 'COMPRADO' : 'EVOLUIR'}
              </button>
            </div>
          `;

          const buyBtn = item.querySelector('.btn-buy');
          if (buyBtn && !isMax) {
            buyBtn.onclick = () => {
              if (GameSave.buyUpgrade(id)) {
                sound.powerup();
                this.openShop();
              }
            };
          }

          container.appendChild(item);
        }

        this.renderSkins();
        document.getElementById('screen-shop').classList.remove('hidden');
        if (shopModal) shopModal.scrollTop = prevScroll;
      }

      closeShop() {
        document.getElementById('screen-shop').classList.add('hidden');
        const back = this.shopReturn;
        this.shopReturn = null;
        if (back) document.getElementById(back).classList.remove('hidden');
      }

      renderSkins() {
        const box = document.getElementById('skins-container');
        box.innerHTML = '';
        for (const sk of SKINS) {
          const owned = GameSave.skinsOwned.includes(sk.id);
          const eq = GameSave.skinEquipped === sk.id;
          const card = document.createElement('div');
          card.className = 'shop-item skin-card' + (eq ? ' equipped' : '');

          const cv = document.createElement('canvas');
          cv.width = 84;
          cv.height = 96;
          cv.className = 'skin-prev';
          const c2 = cv.getContext('2d');
          c2.save();
          c2.scale(1.4, 1.4);
          this.drawRunnerSilhouette(c2, 30, 34, false, 1.0, sk.body, sk);
          c2.restore();

          let label, disabled = false, handler = null;
          if (eq) { label = 'EQUIPADO'; disabled = true; }
          else if (owned) { label = 'EQUIPAR'; handler = () => { GameSave.equipSkin(sk.id); this.openShop(); }; }
          else if (GameSave.coins < sk.price) { label = 'MOEDAS INSUFICIENTES'; disabled = true; }
          else { label = 'COMPRAR'; handler = () => { if (GameSave.buySkin(sk.id)) { sound.powerup(); this.openShop(); } }; }

          const info = document.createElement('div');
          info.className = 'skin-info';
          info.innerHTML = `
            <div class="shop-item-title">${sk.name}</div>
            <div class="skin-stats">🏃 Velocidade +${Math.round(sk.speed * 100)}%<br>⬆ Pulo +${Math.round(sk.jump * 100)}%<br>🪙 Moedas x${sk.coin}</div>
            <div class="shop-cost">${sk.id === 0 ? 'GRÁTIS' : (owned ? 'DESBLOQUEADO' : '🪙 ' + sk.price)}</div>
            <button class="btn btn-accent btn-buy" style="width:100%;" ${disabled ? 'disabled' : ''}>${label}</button>
          `;
          if (handler) info.querySelector('button').onclick = handler;

          card.appendChild(cv);
          card.appendChild(info);
          box.appendChild(card);
        }
      }

      /* =========================================================================
         HUD UPDATES
         ========================================================================= */
      updateHUD() {
        if (!this.levelData) return;

        // Cache: só toca no DOM quando o valor mudou (antes eram dezenas de escritas por frame)
        const hc = this._hudCache || (this._hudCache = {});
        const set = (id, v, kind) => {
          const key = id + (kind || '');
          if (hc[key] === v) return;
          hc[key] = v;
          const el = document.getElementById(id);
          if (kind === 'width') el.style.width = v;
          else if (kind === 'color') el.style.color = v;
          else if (kind === 'html') el.innerHTML = v;
          else el.textContent = v;
        };

        set('hud-level', `${String(this.levelData.levelNum).padStart(2, '0')} / 20`);
        set('hud-coins', String(GameSave.coins));
        set('hud-combo-val', `x${this.combo} (${this.comboStreak}) ⚡+${Math.round(this.speedBonus * 100)}%`);

        let slowPips = '';
        for (let i = 0; i < 5; i++) {
          slowPips += i < this.slowmoCharges ? '⚡' : '○';
        }
        set('hud-slowmo', `${slowPips} [E]`);

        const progress = Math.min(100, Math.max(0, Math.round((this.player.x / this.levelData.goalX) * 100)));
        set('hud-dist-text', `${progress}%`);
        set('hud-progress-fill', `${progress}%`, 'width');

        const threatPct = Math.min(100, Math.max(0, Math.round((this.chaser.distance / 500) * 100)));
        set('hud-threat-fill', `${threatPct}%`, 'width');
        set('hud-chaser-dist', `${Math.round(this.chaser.distance)}m`);

        if (this.chaser.distance > 280) {
          set('hud-chaser-status', 'SEGURO');
          set('hud-chaser-status', '#00ff66', 'color');
        } else if (this.chaser.distance > 120) {
          set('hud-chaser-status', 'APROXIMANDO');
          set('hud-chaser-status', '#ffd700', 'color');
        } else {
          set('hud-chaser-status', 'PERIGO IMINENTE!');
          set('hud-chaser-status', '#ff1e42', 'color');
        }

        set('hud-timer', `${Math.ceil(this.levelTimer)}s`);

        let pills = '';
        if (this.powerups.turbo > 0) {
          pills += `<div class="powerup-pill powerup-turbo">TURBO (${Math.ceil(this.powerups.turbo)}s)</div>`;
        }
        if (this.powerups.mult > 0) {
          pills += `<div class="powerup-pill powerup-mult">2X MOEDAS (${Math.ceil(this.powerups.mult)}s)</div>`;
        }
        if (this.powerups.threat > 0) {
          pills += `<div class="powerup-pill powerup-threat">AMEAÇA PARADA (${Math.ceil(this.powerups.threat)}s)</div>`;
        }
        set('hud-powerups', pills, 'html');
      }

      /* =========================================================================
         CANVAS RENDERING (RED OBSTACLES, PREMIUM RUN ANIMATION, SPEED SENSATION)
         ========================================================================= */
      render() {
        const ctx = this.ctx;
        ctx.save();

        if (this.shakeTimer > 0) {
          const sx = (Math.random() * 2 - 1) * this.shakeAmount;
          const sy = (Math.random() * 2 - 1) * this.shakeAmount;
          ctx.translate(sx, sy);
        }

        if (this.levelData) {
          const grad = ctx.createLinearGradient(0, 0, 0, 720);
          grad.addColorStop(0, this.levelData.skyGradient[0]);
          grad.addColorStop(0.55, this.levelData.skyGradient[1]);
          grad.addColorStop(1, this.levelData.skyGradient[2]);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 1280, 720);
        } else {
          ctx.fillStyle = '#0a0a14';
          ctx.fillRect(0, 0, 1280, 720);
        }

        this.renderParallax(ctx);

        if (this.levelData) {
          const cam = this.cameraX;

          // Floating Platforms
          for (let fp of this.levelData.floatingPlatforms) {
            if (fp.x + fp.w > cam && fp.x < cam + 1300) {
              ctx.fillStyle = '#10121d';
              ctx.fillRect(fp.x - cam, fp.y, fp.w, fp.h);
              ctx.fillStyle = this.levelData.neonAccent;
              ctx.fillRect(fp.x - cam, fp.y, fp.w, 3);
            }
          }

          // Rooftop Buildings
          for (let b of this.levelData.buildings) {
            if (b.x + b.w > cam && b.x < cam + 1300) {
              ctx.fillStyle = '#06060c';
              ctx.fillRect(b.x - cam, b.y, b.w, b.h);

              ctx.strokeStyle = this.levelData.neonAccent;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(b.x - cam, b.y);
              ctx.lineTo(b.x + b.w - cam, b.y);
              ctx.stroke();

              ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
              for (let wx = b.x + 30; wx < b.x + b.w - 30; wx += 50) {
                for (let wy = b.y + 40; wy < b.y + 350; wy += 60) {
                  ctx.fillRect(wx - cam, wy, 24, 34);
                }
              }
            }
          }

          // Trampolines (Molas verdes)
          for (let sp of this.levelData.springs) {
            if (sp.x > cam - 50 && sp.x < cam + 1300) {
              ctx.fillStyle = '#00ff66';
              ctx.shadowColor = '#00ff66';
              ctx.shadowBlur = 10;
              ctx.fillRect(sp.x - cam - 19, sp.y, 38, 10);
              ctx.shadowBlur = 0;
            }
          }

          // =========================================================================
          // RED OBSTACLES RENDERING (COR VERMELHA INTENSA & AVISOS HOLOGRÁFICOS)
          // =========================================================================
          for (let obs of this.levelData.obstacles) {
            if (obs.x > cam - 80 && obs.x < cam + 1300) {
              if (obs.type === 'pipe') {
                // RED AIR DUCT / PIPE (Requires Slide!)
                // Glowing crimson container
                ctx.save();
                ctx.fillStyle = '#2a0409';
                ctx.strokeStyle = '#ff1e42';
                ctx.shadowColor = '#ff1e42';
                ctx.shadowBlur = 14;
                ctx.lineWidth = 2.5;

                // Main horizontal pipe
                ctx.fillRect(obs.x - cam, obs.y, obs.w, obs.h);
                ctx.strokeRect(obs.x - cam, obs.y, obs.w, obs.h);

                // Red and Black Hazard Warning Stripes
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ff1e42';
                for (let sx = obs.x; sx < obs.x + obs.w; sx += 14) {
                  ctx.beginPath();
                  ctx.moveTo(sx - cam, obs.y + obs.h);
                  ctx.lineTo(sx + 7 - cam, obs.y);
                  ctx.lineTo(sx + 12 - cam, obs.y);
                  ctx.lineTo(sx + 5 - cam, obs.y + obs.h);
                  ctx.fill();
                }

                // Hanging vertical posts
                ctx.fillStyle = '#1c0205';
                ctx.fillRect(obs.x + 6 - cam, obs.y - 120, 6, 120);
                ctx.fillRect(obs.x + obs.w - 12 - cam, obs.y - 120, 6, 120);

                // Hologram Warning Sign above pipe: "▼ ROLAR"
                ctx.fillStyle = '#ff1e42';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.shadowColor = '#ff1e42';
                ctx.shadowBlur = 10;
                ctx.fillText('▼ ROLAR', obs.x + obs.w / 2 - cam, obs.y - 8);

                ctx.restore();
              } else if (obs.type === 'tank') {
                // RED WATER TANK / AC CONDENSER (Requires Jump!)
                ctx.save();
                ctx.fillStyle = '#220308';
                ctx.strokeStyle = '#ff1e42';
                ctx.lineWidth = 2.5;
                ctx.shadowColor = '#ff1e42';
                ctx.shadowBlur = 15;

                ctx.fillRect(obs.x - cam, obs.y, obs.w, obs.h);
                ctx.strokeRect(obs.x - cam, obs.y, obs.w, obs.h);

                // Red cross bracing & hazard symbol
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'rgba(255, 30, 66, 0.6)';
                ctx.beginPath();
                ctx.moveTo(obs.x - cam, obs.y);
                ctx.lineTo(obs.x + obs.w - cam, obs.y + obs.h);
                ctx.moveTo(obs.x + obs.w - cam, obs.y);
                ctx.lineTo(obs.x - cam, obs.y + obs.h);
                ctx.stroke();

                // Flashing red beacon on top
                ctx.fillStyle = '#ff1e42';
                ctx.shadowColor = '#ff1e42';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(obs.x + obs.w / 2 - cam, obs.y - 5, 5, 0, Math.PI * 2);
                ctx.fill();

                // Hologram Warning Sign: "▲ PULAR"
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('▲ PULAR', obs.x + obs.w / 2 - cam, obs.y - 14);

                ctx.restore();
              } else if (obs.type === 'antenna') {
                // RED LASER SPIRE / ANTENNA (Requires Double Jump!)
                ctx.save();
                ctx.fillStyle = '#ff1e42';
                ctx.shadowColor = '#ff1e42';
                ctx.shadowBlur = 16;

                // Red Spire Mast
                ctx.fillRect(obs.x - cam + 9, obs.y, 6, obs.h);

                // Pulsing red energy rings
                ctx.strokeStyle = '#ff1e42';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(obs.x - cam + 12, obs.y + 15, 12, 0, Math.PI * 2);
                ctx.stroke();

                // Glowing red beacon tip
                ctx.beginPath();
                ctx.arc(obs.x - cam + 12, obs.y, 7, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
              }
            }
          }

          // Render Coins
          for (let c of this.levelData.coins) {
            if (c.x > cam - 30 && c.x < cam + 1300) {
              ctx.drawImage(this.coinSprite, c.x - cam - 24, c.y - 24);
            }
          }

          // Render Power-Ups
          for (let p of this.levelData.powerups) {
            if (p.x > cam - 40 && p.x < cam + 1300) {
              const color = this.getPowerupColor(p.type);
              ctx.save();
              ctx.translate(p.x - cam, p.y);
              ctx.fillStyle = color;
              ctx.shadowColor = color;
              ctx.shadowBlur = 18;
              ctx.beginPath();
              ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }

          // Render Slow-Mo Orbs
          for (let orb of this.levelData.slowmoOrbs) {
            if (orb.x > cam - 40 && orb.x < cam + 1300) {
              ctx.save();
              ctx.translate(orb.x - cam, orb.y);
              ctx.fillStyle = '#00f0ff';
              ctx.shadowColor = '#00f0ff';
              ctx.shadowBlur = 16;
              ctx.beginPath();
              ctx.arc(0, 0, orb.radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#000';
              ctx.font = 'bold 12px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('⚡', 0, 1);
              ctx.restore();
            }
          }

          // Finish Goal / Safe Zone
          const goalDist = this.levelData.goalX - cam;
          if (goalDist > -200 && goalDist < 1400) {
            ctx.fillStyle = '#00ff66';
            ctx.shadowColor = '#00ff66';
            ctx.shadowBlur = 25;
            ctx.fillRect(goalDist, 380, 8, 200);
            ctx.fillStyle = 'rgba(0, 255, 102, 0.2)';
            ctx.fillRect(goalDist - 60, 380, 120, 200);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText('ZONA SEGURA / ESCONDERIJO', goalDist - 120, 360);
          }

          // Ghost Trails
          for (let t of this.player.trail) {
            ctx.save();
            ctx.globalAlpha = t.alpha;
            this.drawRunnerSilhouette(ctx, t.x - cam, t.y, t.isSliding, t.runCycle, '#ff0055');
            ctx.restore();
          }

          // Player Silhouette
          this.drawRunnerSilhouette(
            ctx,
            this.player.x - cam,
            this.player.y,
            this.player.isSliding,
            this.player.runCycle,
            this.getSkin().body,
            this.getSkin()
          );

          // Chaser Silhouette
          this.drawChaserSilhouette(
            ctx,
            this.chaser.x - cam,
            this.chaser.y,
            this.chaser.runCycle
          );

          // Visual Effects (Particles & Floating Text)
          this.vfx.draw(ctx, cam);
        }

        // Speed lines at high speed
        if (this.player.vx > 9.5 || this.combo >= 4) {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 6; i++) {
            const ly = (i * 120 + ((Date.now() / 4) % 120));
            ctx.beginPath();
            ctx.moveTo(0, ly);
            ctx.lineTo(260 + Math.random() * 200, ly);
            ctx.stroke();
          }
        }

        if (this.slowmoTimer > 0) {
          const vig = ctx.createRadialGradient(640, 360, 200, 640, 360, 720);
          vig.addColorStop(0, 'rgba(0, 240, 255, 0)');
          vig.addColorStop(1, 'rgba(0, 240, 255, 0.38)');
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, 1280, 720);
        }

        ctx.restore();
      }

      renderParallax(ctx) {
        const cam = this.cameraX;

        // Distant Skyline
        ctx.fillStyle = '#060714';
        // O deslocamento precisa ser módulo do ESPAÇAMENTO (160), senão a grade salta quando o módulo reinicia
        const dOffset = (((cam * 0.1) % 160) + 160) % 160;
        for (let x = -dOffset; x < 1400; x += 160) {
          ctx.fillRect(x, 260, 110, 460);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          for (let wx = x + 15; wx < x + 95; wx += 25) {
            for (let wy = 280; wy < 600; wy += 40) {
              ctx.fillRect(wx, wy, 8, 12);
            }
          }
          ctx.fillStyle = '#060714';
        }

        // Midground Skyline & Neon Signs
        // Módulo = espaçamento (220); placas presas ao índice do prédio no mundo, não à posição na tela
        const mScroll = cam * 0.3;
        const mOffset = ((mScroll % 220) + 220) % 220;
        const mBase = Math.floor(mScroll / 220);
        ctx.fillStyle = '#0a0d1d';
        for (let x = -mOffset, mi = 0; x < 1400; x += 220, mi++) {
          ctx.fillRect(x, 340, 160, 380);
          if (((mBase + mi) & 1) === 0) {
            ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
            ctx.fillRect(x + 20, 310, 120, 24);
            ctx.fillStyle = '#00f0ff';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('MEGA-CORP', x + 35, 326);
            ctx.fillStyle = '#0a0d1d';
          }
        }
      }

      /* =========================================================================
         IMPROVED ATHLETIC VECTOR SPRINT & CHASER KINEMATICS
         ========================================================================= */
      drawRunnerSilhouette(ctx, x, y, isSliding, cycle, tintColor = '#08080c', skin = null) {
        ctx.save();
        ctx.translate(x, y);
        const acc = skin ? skin.accent : '#00f0ff';
        let hx = 0, hy = 0;

        if (isSliding) {
          // Low-profile baseball slide with one leg extended and hands balancing
          ctx.fillStyle = tintColor;
          ctx.strokeStyle = tintColor;
          ctx.lineCap = 'round';
          ctx.lineWidth = 7;

          // Head lowered forward
          hx = 14; hy = 5;
          ctx.beginPath();
          ctx.arc(14, 5, 7.5, 0, Math.PI * 2);
          ctx.fill();

          // Neon Bandana / Scarf trailing back
          ctx.strokeStyle = acc;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(8, 4);
          ctx.lineTo(-18, 1);
          ctx.lineTo(-30, 2 + Math.sin(cycle * 3) * 3);
          ctx.stroke();

          // Torso tilted back
          ctx.strokeStyle = tintColor;
          ctx.lineWidth = 9;
          ctx.beginPath();
          ctx.moveTo(10, 9);
          ctx.lineTo(-12, 18);
          ctx.stroke();

          // Front leg fully extended along the ground
          ctx.lineWidth = 6.5;
          ctx.beginPath();
          ctx.moveTo(-12, 18);
          ctx.lineTo(16, 23);
          ctx.lineTo(29, 25);
          ctx.stroke();

          // Back leg bent under body
          ctx.beginPath();
          ctx.moveTo(-12, 18);
          ctx.lineTo(-24, 21);
          ctx.lineTo(-8, 25);
          ctx.stroke();

          // Arm planted/balancing
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(-4, 14);
          ctx.lineTo(-16, 22);
          ctx.lineTo(-24, 25);
          ctx.stroke();
        } else {
          // ATHLETIC HIGH-SPEED SPRINT CYCLE (VECTOR PARKOUR STYLE)
          const legPhase = cycle;
          const armPhase = cycle + Math.PI;

          ctx.fillStyle = tintColor;
          ctx.strokeStyle = tintColor;
          ctx.lineCap = 'round';

          // Dynamic athletic forward lean
          const lean = Math.min(0.35, this.player.vx * 0.03);

          // Head (with slight breathing bob)
          const headBob = Math.sin(cycle * 2) * 2;
          hx = 4 + lean * 10; hy = -22 + headBob;
          ctx.beginPath();
          ctx.arc(4 + lean * 10, -22 + headBob, 8, 0, Math.PI * 2);
          ctx.fill();

          // Waving Neon Bandana Trail
          ctx.strokeStyle = acc;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(-2 + lean * 10, -20 + headBob);
          ctx.quadraticCurveTo(
            -16, -24 + Math.sin(cycle * 2) * 5,
            -28, -22 + Math.cos(cycle * 2) * 6
          );
          ctx.stroke();

          // Torso (athletic spine curvature leaning into sprint)
          ctx.strokeStyle = tintColor;
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(4 + lean * 10, -15 + headBob);
          ctx.lineTo(-4, 4);
          ctx.stroke();

          // Legs Kinematics (Full Thigh, Knee, Shin, Foot joints)
          const hipX = -4;
          const hipY = 4;
          const thighLen = 14;
          const shinLen = 14;

          // Left Leg
          const lAngle1 = Math.sin(legPhase) * 1.05 + 0.25;
          const lKneeX = hipX + Math.sin(lAngle1) * thighLen;
          const lKneeY = hipY + Math.cos(lAngle1) * thighLen;
          const lAngle2 = lAngle1 + (Math.sin(legPhase) > 0 ? 0.4 : 1.1);
          const lFootX = lKneeX + Math.sin(lAngle2) * shinLen;
          const lFootY = lKneeY + Math.cos(lAngle2) * shinLen;

          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(hipX, hipY);
          ctx.lineTo(lKneeX, lKneeY);
          ctx.lineTo(lFootX, lFootY);
          ctx.stroke();

          // Right Leg
          const rAngle1 = Math.sin(legPhase + Math.PI) * 1.05 + 0.25;
          const rKneeX = hipX + Math.sin(rAngle1) * thighLen;
          const rKneeY = hipY + Math.cos(rAngle1) * thighLen;
          const rAngle2 = rAngle1 + (Math.sin(legPhase + Math.PI) > 0 ? 0.4 : 1.1);
          const rFootX = rKneeX + Math.sin(rAngle2) * shinLen;
          const rFootY = rKneeY + Math.cos(rAngle2) * shinLen;

          ctx.beginPath();
          ctx.moveTo(hipX, hipY);
          ctx.lineTo(rKneeX, rKneeY);
          ctx.lineTo(rFootX, rFootY);
          ctx.stroke();

          // Arms Counter-swing with bent elbows
          const shoulderX = 2 + lean * 8;
          const shoulderY = -14 + headBob;
          const bicepLen = 12;
          const foreArmLen = 11;

          // Back Arm
          const bArmAngle = Math.sin(armPhase) * 1.0;
          const bElbowX = shoulderX + Math.cos(bArmAngle) * bicepLen;
          const bElbowY = shoulderY + Math.sin(bArmAngle) * bicepLen;
          const bHandX = bElbowX + Math.cos(bArmAngle + 0.8) * foreArmLen;
          const bHandY = bElbowY + Math.sin(bArmAngle + 0.8) * foreArmLen;

          ctx.lineWidth = 5.5;
          ctx.beginPath();
          ctx.moveTo(shoulderX, shoulderY);
          ctx.lineTo(bElbowX, bElbowY);
          ctx.lineTo(bHandX, bHandY);
          ctx.stroke();

          // Front Arm
          const fArmAngle = Math.sin(armPhase + Math.PI) * 1.0;
          const fElbowX = shoulderX + Math.cos(fArmAngle) * bicepLen;
          const fElbowY = shoulderY + Math.sin(fArmAngle) * bicepLen;
          const fHandX = fElbowX + Math.cos(fArmAngle + 0.8) * foreArmLen;
          const fHandY = fElbowY + Math.sin(fArmAngle + 0.8) * foreArmLen;

          ctx.beginPath();
          ctx.moveTo(shoulderX, shoulderY);
          ctx.lineTo(fElbowX, fElbowY);
          ctx.lineTo(fHandX, fHandY);
          ctx.stroke();
        }

        if (skin) this.drawSkinExtras(ctx, skin, hx, hy, cycle, isSliding);

        ctx.restore();
      }

      getSkin() {
        const sk = SKINS[GameSave.skinEquipped];
        return (sk && GameSave.skinsOwned.includes(sk.id)) ? sk : SKINS[0];
      }

      // Acessórios que diferenciam cada personagem (capas, máscaras, capacetes...)
      drawSkinExtras(ctx, sk, hx, hy, cycle, sl) {
        const e = sk.extra;
        if (e === 'none') return;
        const hr = sl ? 7.5 : 8, w = Math.sin(cycle * 2), a = sk.accent;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const cape = (col) => {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(hx - 4, hy + 8);
          ctx.quadraticCurveTo(hx - 22, hy + 10 + w * 3, hx - 34, hy + 28 + w * 4);
          ctx.lineTo(hx - 10, hy + 26);
          ctx.closePath();
          ctx.fill();
        };
        if (e === 'spider') {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.ellipse(hx + 3, hy - 1, 3, 1.8, -0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = a;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(hx, hy, hr - 1, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
        } else if (e === 'bat') {
          cape(a);
          ctx.fillStyle = sk.body;
          ctx.beginPath();
          ctx.moveTo(hx - 6, hy - 5); ctx.lineTo(hx - 5, hy - 15); ctx.lineTo(hx - 1, hy - 7);
          ctx.moveTo(hx + 1, hy - 7); ctx.lineTo(hx + 5, hy - 15); ctx.lineTo(hx + 6, hy - 4);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillRect(hx + 2, hy - 2, 5, 1.8);
        } else if (e === 'sun') {
          cape(a);
          if (!sl) {
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(hx - 4, hy + 11, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (e === 'ninja') {
          ctx.strokeStyle = a;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(hx - hr, hy - 2); ctx.lineTo(hx + hr, hy - 2);
          ctx.moveTo(hx - hr, hy - 2); ctx.quadraticCurveTo(hx - 20, hy - 6 + w * 4, hx - 30, hy + 2 + w * 5);
          ctx.moveTo(hx - hr, hy - 1); ctx.quadraticCurveTo(hx - 18, hy + 3 - w * 4, hx - 27, hy + 9 - w * 4);
          ctx.stroke();
        } else if (e === 'cyber') {
          ctx.shadowColor = a; ctx.shadowBlur = 8;
          ctx.fillStyle = a;
          ctx.fillRect(hx - 1, hy - 3, hr + 1, 3.5);
        } else if (e === 'volt') {
          ctx.shadowColor = a; ctx.shadowBlur = 8;
          ctx.fillStyle = a;
          ctx.beginPath();
          ctx.moveTo(hx - hr, hy - 2); ctx.lineTo(hx - hr - 10, hy - 9); ctx.lineTo(hx - hr - 3, hy + 2);
          ctx.moveTo(hx, hy - hr - 11); ctx.lineTo(hx - 5, hy - hr); ctx.lineTo(hx - 1, hy - hr); ctx.lineTo(hx - 4, hy - hr + 7);
          ctx.lineTo(hx + 4, hy - hr - 2); ctx.lineTo(hx, hy - hr - 2);
          ctx.fill();
        } else if (e === 'astro') {
          ctx.fillStyle = '#9ca3af';
          ctx.fillRect(hx - 15, hy + 4, 7, 13);
          ctx.fillStyle = 'rgba(56,189,248,0.35)';
          ctx.strokeStyle = '#f3f4f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(hx, hy, hr + 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (e === 'hunter') {
          ctx.strokeStyle = a;
          ctx.lineWidth = 1.7;
          ctx.beginPath();
          ctx.arc(hx + 4, hy - 1, 3.6, 0, Math.PI * 2);
          ctx.moveTo(hx - 3, hy - hr); ctx.lineTo(hx - 5, hy - hr - 9);
          ctx.stroke();
          ctx.fillStyle = a;
          ctx.beginPath();
          ctx.arc(hx - 5, hy - hr - 10, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (e === 'samurai') {
          ctx.fillStyle = a;
          ctx.beginPath();
          ctx.moveTo(hx - hr - 4, hy - 3); ctx.lineTo(hx, hy - hr - 10); ctx.lineTo(hx + hr + 4, hy - 3);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(hx - hr - 4, hy - 3); ctx.lineTo(hx + hr + 4, hy - 3);
          ctx.stroke();
        } else if (e === 'robot') {
          ctx.fillStyle = '#9ca3af';
          ctx.strokeStyle = a;
          ctx.lineWidth = 2;
          ctx.fillRect(hx - hr, hy - hr, hr * 2, hr * 2 - 1);
          ctx.strokeRect(hx - hr, hy - hr, hr * 2, hr * 2 - 1);
          ctx.shadowColor = a; ctx.shadowBlur = 8;
          ctx.fillStyle = a;
          ctx.fillRect(hx, hy - 3, hr - 1, 3);
          ctx.beginPath();
          ctx.moveTo(hx, hy - hr); ctx.lineTo(hx, hy - hr - 7);
          ctx.stroke();
        } else if (e === 'cosmic') {
          ctx.shadowColor = a; ctx.shadowBlur = 10;
          ctx.strokeStyle = a;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(hx, hy - hr - 5, 9, 3, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#fff';
          for (let i = 0; i < 3; i++) {
            const ang = cycle + i * 2.1;
            ctx.beginPath();
            ctx.arc(hx + Math.cos(ang) * 16, hy + 4 + Math.sin(ang) * 10, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (e === 'flame') {
          for (let i = 0; i < 3; i++) {
            const x0 = hx - 6 + i * 6;
            const h = 9 + Math.sin(cycle * 3 + i * 2) * 4;
            ctx.fillStyle = a;
            ctx.beginPath();
            ctx.moveTo(x0 - 4, hy - hr + 3); ctx.lineTo(x0, hy - hr - h); ctx.lineTo(x0 + 4, hy - hr + 3);
            ctx.fill();
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.moveTo(x0 - 2, hy - hr + 3); ctx.lineTo(x0, hy - hr - h * 0.5); ctx.lineTo(x0 + 2, hy - hr + 3);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      drawChaserSilhouette(ctx, x, y, cycle) {
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#000000';
        ctx.lineCap = 'round';

        // Head
        ctx.beginPath();
        ctx.arc(6, -26, 9, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Twin Red Visor Eyes
        ctx.fillStyle = '#ff1e42';
        ctx.shadowColor = '#ff1e42';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(11, -26, 3, 0, Math.PI * 2);
        ctx.fill();

        // Crimson laser trail
        ctx.strokeStyle = 'rgba(255, 30, 66, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(11, -26);
        ctx.lineTo(-28, -26);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Heavy Cybernetic Torso & Coat
        ctx.fillStyle = '#000';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 13;
        ctx.beginPath();
        ctx.moveTo(6, -20);
        ctx.lineTo(-2, 4);
        ctx.stroke();

        // Jetpack Thruster Flames
        ctx.fillStyle = '#ff1e42';
        ctx.beginPath();
        ctx.arc(-14, -12, 5 + Math.sin(cycle * 3) * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Heavy Hunter Legs
        const hipX = -2;
        const hipY = 4;
        const legLen = 16;
        const lAngle = Math.sin(cycle) * 0.95 + 0.25;
        const rAngle = Math.sin(cycle + Math.PI) * 0.95 + 0.25;

        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(hipX + Math.sin(lAngle) * legLen, hipY + Math.cos(lAngle) * legLen);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(hipX + Math.sin(rAngle) * legLen, hipY + Math.cos(rAngle) * legLen);
        ctx.stroke();

        ctx.restore();
      }

      /* =========================================================================
         GAME LOOP
         ========================================================================= */
      gameLoop(currentTime) {
        const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
        this.lastTime = currentTime;

        if (this.state === 'PLAYING') {
          this.update(dt);
        } else if (this.state === 'QTE') {
          this.updateQTE(dt);
        }

        // Fora da partida a cena não muda: desenha só uma vez por mudança de estado
        if (this.state === 'PLAYING' || this.state === 'QTE' || this.state === 'QTE_FAIL' || this._renderedState !== this.state) {
          this.render();
          this._renderedState = this.state;
        }
        requestAnimationFrame((t) => this.gameLoop(t));
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      window.game = new GameEngine();
    });
