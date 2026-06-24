
class Enemy {
    constructor(scene, x, y, texKey) {
        this.scene = scene;
        this._id = Enemy._nextId++;
        this.speed = C.ENEMY.NORMAL.speed;
        this.hp = C.ENEMY.NORMAL.hp;
        this.maxHp = this.hp;
        this.damage = C.ENEMY.NORMAL.damage;
        this.walkTimer = randInt(100) / 10;

        this.type = EnemyType.NORMAL;
        this.baseScale = 1.0;

        this.bossState = BossState.WALKING;
        this.bossTimer = 0;
        this.jumpDir = { x: 0, y: 0 };
        this.isBoss = false;
        this.isBoss2 = false;
        this.isBoss3 = false;
        this.isBossDoc = false;
        this.isBossBass = false;
        this.isBossSplit = false;

        this.strobeState = 'ROAM';
        this.strobeTimer = 0;
        this.strobeAttack = -1;
        this.beamActive = false;
        this.beamTelegraph = false;
        this.beamAngle = 0;
        this.beamLen = 2400;
        this.beamWidth = 80;
        this.burstCount = 0;
        this.burstTimer = 0;
        this._teleported = false;

        this.goblinState = GoblinState.WALKING;
        this.goblinTimer = 0;
        this.goblinStationed = false;
        this.throwTargetPos = { x: 0, y: 0 };
        this.justThrew = false;
        this.justThrewStun = false;
        this.justFiredVolley = false;
        this.volleyTargetPos = { x: 0, y: 0 };

        this.hitFlashTimer = 0;
        this.bladeMailCd = 0;
        this.sphereCd = 0;

        this.sprite = scene.addWorld(scene.add.sprite(x, y, texKey));
        this.sprite.setOrigin(0.5, 0.5);
        this._setTargetSize(C.ENEMY.BASE_SIZE);
        this.maxHp = this.hp;

        this.spawning = true;
        this.spawnTimer = 0;
        this.spawnDuration = C.SPAWN.ENEMY_DURATION;
        this.spawnStyle = 'enemy';
        this._spawnBurst = false;
    }

    _setTargetSize(targetSize) {
        this.baseScale = targetSize / this.sprite.width;
        this.sprite.setScale(this.baseScale, this.baseScale);
    }

    makeTank(playerLevel) {
        const st = C.ENEMY.TANK;
        this.type = EnemyType.TANK;
        this.speed = st.speed;
        this.hp = st.hpBase + playerLevel * st.hpPerLevel;
        this.maxHp = this.hp;
        this.damage = st.damage;
        this.sprite.setScale(this.baseScale * st.scale, this.baseScale * st.scale);
    }

    makeFast() {
        const st = C.ENEMY.FAST;
        this.type = EnemyType.FAST;
        this.speed = st.speed;
        this.hp = st.hp;
        this.maxHp = st.hp;
        this.damage = st.damage;
        this.sprite.setScale(this.baseScale * st.scale, this.baseScale * st.scale);
    }

    makeGoblin(goblinTexKey) {
        const st = C.ENEMY.GOBLIN;
        this.type = EnemyType.GOBLIN;
        this.sprite.setTexture(goblinTexKey);
        this.sprite.setOrigin(0.5, 0.5);
        this._setTargetSize(st.size);
        this.hp = st.hp; this.maxHp = st.hp; this.speed = st.speed; this.damage = st.damage;
    }

    makeSubwoofer(texKey) {
        const st = C.ENEMY.SUBWOOFER;
        this.type = EnemyType.SUBWOOFER;
        if (texKey) { this.sprite.setTexture(texKey); this.sprite.setOrigin(0.5, 0.5); }
        this._setTargetSize(st.size);
        this.hp = st.hp; this.maxHp = st.hp; this.speed = st.speed; this.damage = st.damage;
        this.subState = 'MOVE'; this.subTimer = 0;
        this.justSoundWave = false; this._waveFired = false;
    }

    makeMosher(texKey) {
        const st = C.ENEMY.MOSHER;
        this.type = EnemyType.MOSHER;
        if (texKey) { this.sprite.setTexture(texKey); this.sprite.setOrigin(0.5, 0.5); }
        this._setTargetSize(st.size);
        this.hp = st.hp; this.maxHp = st.hp; this.speed = st.speed; this.damage = st.damage;
        this.splitOnDeath = true;
    }
    makeMosherling(texKey) {
        const st = C.ENEMY.MOSHERLING;
        this.type = EnemyType.MOSHERLING;
        if (texKey) { this.sprite.setTexture(texKey); this.sprite.setOrigin(0.5, 0.5); }
        this._setTargetSize(st.size);
        this.sprite.setScale(this.baseScale * st.scale, this.baseScale * st.scale);
        this.hp = st.hp; this.maxHp = st.hp; this.speed = st.speed; this.damage = st.damage;
        this.splitOnDeath = false;
        this.spawning = false;
    }

    makeHypeman(texKey) {
        const st = C.ENEMY.HYPEMAN;
        this.type = EnemyType.HYPEMAN;
        if (texKey) { this.sprite.setTexture(texKey); this.sprite.setOrigin(0.5, 0.5); }
        this._setTargetSize(st.size);
        this.hp = st.hp; this.maxHp = st.hp; this.speed = st.speed; this.damage = st.damage;
    }

    makeBoss() {
        const st = C.BOSS.B1;
        this.isBoss = true;
        this.type = EnemyType.BOSS;
        this.hp = st.hp; this.maxHp = st.hp; this.speed = st.speed; this.damage = st.damage;
        this.bossScale = this.baseScale * st.scale;
        this.sprite.setScale(this.bossScale, this.bossScale);
        this.spawnStyle = 'boss1'; this.spawnDuration = C.SPAWN.BOSS1_DURATION;
    }

    makeBoss2(boss2TexKey) {
        const st = C.BOSS.B2;
        this.isBoss = true; this.isBoss2 = true;
        this.type = EnemyType.BOSS;
        this.sprite.setTexture(boss2TexKey);
        this.sprite.setOrigin(0.5, 0.5);
        this.baseScale = C.ENEMY.BASE_SIZE / this.sprite.width;
        this.hp = st.hp; this.maxHp = st.hp; this.speed = st.speed; this.damage = st.damage;
        this.bossScale = this.baseScale * st.scale;
        this.sprite.setScale(this.bossScale, this.bossScale);
        this.spawnStyle = 'boss2'; this.spawnDuration = C.SPAWN.BOSS2_DURATION;
    }

    makeBoss3(texKey) {
        const st = C.BOSS.B3;
        this.isBoss = true; this.isBoss3 = true;
        this.type = EnemyType.BOSS;
        this.sprite.setTexture(texKey);
        this.sprite.setOrigin(0.5, 0.5);
        this.baseScale = C.ENEMY.BASE_SIZE / this.sprite.width;
        this.hp = st.hp; this.maxHp = st.hp; this.speed = st.speed; this.damage = st.damage;
        this.bossScale = this.baseScale * st.scale;
        this.sprite.setScale(this.bossScale, this.bossScale);
        this.strobeState = 'ROAM';
        this.strobeTimer = 0;
        this.strobeAttack = -1;
        this.spawnStyle = 'boss3'; this.spawnDuration = C.SPAWN.BOSS3_DURATION;
    }

    makeBossDoctor(texKey) {
        const st = C.BOSS.BD;
        this.isBoss = true; this.isBossDoc = true;
        this.type = EnemyType.BOSS;
        if (texKey) { this.sprite.setTexture(texKey); this.sprite.setOrigin(0.5, 0.5); }
        this.baseScale = C.ENEMY.BASE_SIZE / this.sprite.width;
        this.hp = st.hp; this.maxHp = st.hp; this.speed = st.speed; this.damage = st.damage;
        this.bossScale = this.baseScale * st.scale;
        this.sprite.setScale(this.bossScale, this.bossScale);
        this.docState = 'ROAM';
        this.docTimer = 0;
        this.throwTargetPos = { x: 0, y: 0 };
        this.spawnStyle = 'bossdoc'; this.spawnDuration = C.SPAWN.BOSSDOC_DURATION;
    }

    makeBossBass(texKey) {
        const st = C.BOSS.BB;
        this.isBoss = true; this.isBoss2 = true; this.isBossBass = true;
        this.type = EnemyType.BOSS;
        if (texKey) { this.sprite.setTexture(texKey); this.sprite.setOrigin(0.5, 0.5); }
        this.baseScale = C.ENEMY.BASE_SIZE / this.sprite.width;
        this.hp = st.hp; this.maxHp = st.hp; this.speed = st.speed; this.damage = st.damage;
        this.bossScale = this.baseScale * st.scale;
        this.sprite.setScale(this.bossScale, this.bossScale);
        this.waveRadiusMult = C.BOSSBASS.WAVE_RADIUS_MULT;
        this.bassState = 'CHASE';
        this.bassTimer = 0;
        this.bassNextRush = false;
        this.rushDir = { x: 1, y: 0 };
        this.spawnStyle = 'boss1'; this.spawnDuration = C.SPAWN.BOSS1_DURATION;
    }

    makeBossSplit(texKey, tier) {
        const base = C.BOSS.BS, T = C.BOSSSPLIT.TIERS[tier] || C.BOSSSPLIT.TIERS[0];
        this.isBoss = true; this.isBoss3 = true; this.isBossSplit = true;
        this.type = EnemyType.BOSS;
        if (texKey) { this.sprite.setTexture(texKey); this.sprite.setOrigin(0.5, 0.5); }
        this.baseScale = C.ENEMY.BASE_SIZE / this.sprite.width;
        this.hp = Math.round(base.hp * T.hpMult); this.maxHp = this.hp;
        this.speed = base.speed; this.damage = Math.round(base.damage * T.dmgMult);
        this.bossScale = this.baseScale * base.scale * T.scaleMult;
        this.sprite.setScale(this.bossScale, this.bossScale);
        this.splitTier = tier;
        this.splitCount = T.splits;
        this.canSplit = T.splits > 0;
        this.chargeTimer = C.BOSSSPLIT.CHARGE_BURST;
        if (tier === 0) { this.spawnStyle = 'boss1'; this.spawnDuration = C.SPAWN.BOSS1_DURATION; }
        else { this.spawning = false; }
    }

    _updateStrobe(dt, px, py) {
        const s = this.sprite;
        this.justFiredVolley = false;
        this.justThrew = false;
        const enraged = this.hp <= this.maxHp / 2;
        const tf = enraged ? 0.7 : 1.0;

        const bs = this.bossScale || this.baseScale * 3.2;
        if (this.strobeState === 'ROAM') {
            const dir = normalize(px - s.x, py - s.y);
            s.x += dir.x * this.speed * dt;
            s.y += dir.y * this.speed * dt;
            this.walkTimer += dt * 8;
            const bob = Math.sin(this.walkTimer) * 0.05;
            s.setScale(bs * (1 - bob * 0.4), bs * (1 + bob));
            s.angle = Math.sin(this.walkTimer * 0.6) * 6;
            this.strobeTimer += dt;
            if (this.strobeTimer >= 2.5 * tf) {
                this.strobeAttack = (this.strobeAttack + 1) % 3;
                this.strobeTimer = 0;
                this.strobeState = 'TELEGRAPH';
                this.beamAngle = Math.atan2(py - s.y, px - s.x);
                this.beamActive = false;
                this.beamTelegraph = (this.strobeAttack === 0);
                this.burstCount = 0;
                this.burstTimer = 0;
                this._teleported = false;
                s.setScale(bs, bs);
                s.angle = (this.strobeAttack === 0) ? this.beamAngle * DEG : 0;
            }
        } else if (this.strobeState === 'TELEGRAPH') {
            this.strobeTimer += dt;
            const telDur = (this.strobeAttack === 0 ? 0.5 : this.strobeAttack === 1 ? 0.5 : 0.4) * tf;
            if (this.strobeTimer >= telDur) {
                this.strobeTimer = 0;
                this.strobeState = 'EXECUTE';
                if (this.strobeAttack === 0) {
                    this.beamTelegraph = false;
                    this.beamActive = true;
                } else if (this.strobeAttack === 1) {
                    this.burstTimer = 1.0;
                } else if (this.strobeAttack === 2) {
                    this._teleported = false;
                }
            }
        } else if (this.strobeState === 'EXECUTE') {
            this.strobeTimer += dt;
            if (this.strobeAttack === 0) {
                const dur = 0.4 * tf;
                if (this.strobeTimer >= dur) {
                    this.beamActive = false;
                    this.strobeState = 'RECOVER';
                    this.strobeTimer = 0;
                    s.angle = 0;
                }
            } else if (this.strobeAttack === 1) {
                const rings = enraged ? 3 : 2;
                this.burstTimer += dt;
                if (this.burstCount < rings && this.burstTimer >= 0.28) {
                    this.justFiredVolley = true;
                    this.volleyTargetPos = { x: px, y: py };
                    this.burstTimer = 0;
                    this.burstCount++;
                }
                if (this.burstCount >= rings && this.burstTimer >= 0.28) {
                    this.strobeState = 'RECOVER';
                    this.strobeTimer = 0;
                }
            } else if (this.strobeAttack === 2) {
                const normal = this.bossScale;
                const shrinkDur = 0.4 * tf;
                const expandDur = 0.35 * tf;
                if (!this._teleported) {
                    const k = clamp(this.strobeTimer / shrinkDur, 0, 1);
                    const sc = (k < 0.25)
                        ? normal * (1 + 0.15 * (k / 0.25))
                        : normal * (1.15 - 1.05 * ((k - 0.25) / 0.75));
                    s.setScale(sc, sc);
                    s.angle = k * 540;
                    if (this.strobeTimer >= shrinkDur) {
                        const ang = Math.random() * Math.PI * 2;
                        const m = 150;
                        s.x = clamp(px + Math.cos(ang) * 600, m, this.scene.arenaW - m);
                        s.y = clamp(py + Math.sin(ang) * 600, m, this.scene.arenaH - m);
                        this._teleported = true;
                        this.strobeTimer = 0;
                        this.burstCount = 0;
                        this.burstTimer = 1.0;
                    }
                } else if (this.strobeTimer < expandDur) {
                    const k = clamp(this.strobeTimer / expandDur, 0, 1);
                    const sc = normal * (0.1 + 0.9 * k);
                    s.setScale(sc, sc);
                    s.angle = (1 - k) * 360;
                } else {
                    s.setScale(normal, normal);
                    s.angle = 0;
                    this.burstTimer += dt;
                    if (this.burstCount < 2 && this.burstTimer >= 0.28) {
                        this.justFiredVolley = true;
                        this.volleyTargetPos = { x: px, y: py };
                        this.burstTimer = 0;
                        this.burstCount++;
                    }
                    if (this.burstCount >= 2 && this.burstTimer >= 0.28) {
                        this.strobeState = 'RECOVER';
                        this.strobeTimer = 0;
                    }
                }
            }
        } else if (this.strobeState === 'RECOVER') {
            this.strobeTimer += dt;
            if (this.strobeTimer >= 1.2 * tf) { this.strobeState = 'ROAM'; this.strobeTimer = 0; }
        }
    }

    _updateBossDoctor(dt, px, py, arenaW, arenaH) {
        const s = this.sprite;
        this.justThrewStun = false;
        const D = C.BOSSDOC;
        const bs = this.bossScale || this.baseScale * 3.2;

        const dx = s.x - px, dy = s.y - py;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < D.FLEE_DIST) {
            s.x = clamp(s.x + (dx / d) * this.speed * dt, 0, arenaW);
            s.y = clamp(s.y + (dy / d) * this.speed * dt, 0, arenaH);
        } else if (d > D.STANDOFF) {
            s.x = clamp(s.x - (dx / d) * this.speed * dt, 0, arenaW);
            s.y = clamp(s.y - (dy / d) * this.speed * dt, 0, arenaH);
        }
        this.walkTimer += dt * 6;
        const charge = (this.docState === 'TELEGRAPH') ? 0.12 : 0;
        s.setScale(bs * (1 + charge), bs * (1 + charge));
        s.angle = Math.sin(this.walkTimer) * 4;

        this.docTimer += dt;
        if (this.docState === 'ROAM') {
            if (this.docTimer >= D.STUN_INTERVAL) {
                this.docState = 'TELEGRAPH';
                this.docTimer = 0;
                this.throwTargetPos = { x: px, y: py };
            }
        } else if (this.docState === 'TELEGRAPH') {
            if (this.docTimer >= D.TELEGRAPH) {
                this.docState = 'ROAM';
                this.docTimer = 0;
                this.justThrewStun = true;
            }
        }
    }

    _updateBossBass(dt, px, py, arenaW, arenaH) {
        const s = this.sprite;
        this.justSoundWave = false;
        this.justFiredVolley = false;
        const bs = this.bossScale || this.baseScale * 3.2;
        const BB = C.BOSSBASS;
        const tf = (this.hp <= this.maxHp / 2) ? 0.7 : 1.0;

        if (this.bassState === 'CHASE') {
            const dir = normalize(px - s.x, py - s.y);
            s.x += dir.x * this.speed * dt;
            s.y += dir.y * this.speed * dt;
            this.walkTimer += dt * 8;
            const bob = Math.sin(this.walkTimer * 1.7) * 0.06;
            s.setScale(bs * (1 - bob * 0.4), bs * (1 + bob));
            s.angle = Math.sin(this.walkTimer) * 4;
            this.bassTimer += dt;
            if (this.bassTimer >= BB.ATTACK_GAP * tf) {
                this.bassTimer = 0; s.angle = 0; s.setScale(bs, bs);
                const dq = distSq(s.x, s.y, px, py);
                const inWave = dq <= BB.WAVE_RANGE * BB.WAVE_RANGE;
                if (inWave && !this.bassNextRush) {
                    this.bassState = 'WAVE_CHARGE';
                } else {
                    this.bassState = 'RUSH_WINDUP';
                    this.rushDir = normalize(px - s.x, py - s.y);
                }
                this.bassNextRush = !this.bassNextRush;
            }
        } else if (this.bassState === 'WAVE_CHARGE') {
            this.bassTimer += dt;
            const k = clamp(this.bassTimer / (BB.WAVE_TELEGRAPH * tf), 0, 1);
            const pulse = 1 + 0.25 * k + 0.05 * Math.sin(this.bassTimer * 40);
            s.setScale(bs * pulse, bs * pulse);
            s.angle = Math.sin(this.bassTimer * 45) * 4;
            if (this.bassTimer >= BB.WAVE_TELEGRAPH * tf) {
                this.justSoundWave = true;
                this.bassState = 'RECOVER'; this.bassTimer = 0; s.angle = 0; s.setScale(bs, bs);
            }
        } else if (this.bassState === 'RUSH_WINDUP') {
            this.bassTimer += dt;
            s.angle = Math.sin(this.bassTimer * 50) * 6;
            s.setScale(bs * 1.05, bs * 0.95);
            if (this.bassTimer >= BB.RUSH_WINDUP * tf) { this.bassState = 'RUSH'; this.bassTimer = 0; s.angle = 0; }
        } else if (this.bassState === 'RUSH') {
            this.bassTimer += dt;
            const accel = clamp(this.bassTimer / (BB.RUSH_DURATION * tf), 0, 1);
            const spd = BB.RUSH_SPEED * (0.4 + 0.6 * accel);
            const m = 80;
            const nx = s.x + this.rushDir.x * spd * dt, ny = s.y + this.rushDir.y * spd * dt;
            const hitWall = (nx < m || nx > arenaW - m || ny < m || ny > arenaH - m);
            s.x = clamp(nx, m, arenaW - m);
            s.y = clamp(ny, m, arenaH - m);
            s.setScale(bs * 1.1, bs * 0.92);
            if (hitWall || this.bassTimer >= BB.RUSH_DURATION * tf) {
                if (hitWall) this.scene.triggerShake(0.3, 26);
                this.bassState = 'RECOVER';
                this.bassTimer = hitWall ? -0.4 : 0;
                s.setScale(bs, bs);
            }
        } else {
            this.bassTimer += dt;
            s.setScale(bs, bs); s.angle = 0;
            if (this.bassTimer >= BB.RECOVER * tf) { this.bassState = 'CHASE'; this.bassTimer = 0; }
        }
    }

    _updateBossSplit(dt, px, py, arenaW, arenaH) {
        const s = this.sprite, SPL = C.BOSSSPLIT;
        if (this.chargeTimer > 0) this.chargeTimer -= dt;
        const spd = this.speed * (this.chargeTimer > 0 ? SPL.CHARGE_MULT : 1);
        const dir = normalize(px - s.x, py - s.y);
        s.x = clamp(s.x + dir.x * spd * dt, 0, arenaW);
        s.y = clamp(s.y + dir.y * spd * dt, 0, arenaH);
        this.walkTimer += dt * 10;
        const bob = Math.sin(this.walkTimer * 1.8) * 0.07;
        s.setScale(this.bossScale * (1 - bob * 0.4), this.bossScale * (1 + bob));
        s.angle = Math.sin(this.walkTimer) * 5;
        const R = SPL.SHOVE_RADIUS, F = SPL.SHOVE_FORCE;
        for (const o of this.scene.enemies) {
            if (o === this || o.isBoss || o.hp <= 0 || o.spawning) continue;
            const dx = o.sprite.x - s.x, dy = o.sprite.y - s.y, dq = dx * dx + dy * dy;
            if (dq < R * R && dq > 1) {
                const d = Math.sqrt(dq);
                o.sprite.x = clamp(o.sprite.x + (dx / d) * F * dt, 0, arenaW);
                o.sprite.y = clamp(o.sprite.y + (dy / d) * F * dt, 0, arenaH);
            }
        }
    }

    _updateSpawn(dt) {
        const s = this.sprite;
        if (this._spawnInit === undefined) {
            this._spawnInit = true;
            this._spawnSX = s.scaleX; this._spawnSY = s.scaleY;
            this._spawnGX = s.x; this._spawnGY = s.y;
            if (this.spawnStyle === 'boss2') {
                const a = Math.random() * Math.PI * 2;
                this._spawnDX = Math.cos(a); this._spawnDY = Math.sin(a);
            }
            s.setAlpha(0);
        }
        this.spawnTimer += dt;
        const k = clamp(this.spawnTimer / this.spawnDuration, 0, 1);
        const sx = this._spawnSX, sy = this._spawnSY;
        const gx = this._spawnGX, gy = this._spawnGY;

        switch (this.spawnStyle) {
            case 'boss1': {
                const land = 0.85;
                if (k < 0.35) { s.setAlpha(0); s.setScale(sx, sy); s.setPosition(gx, gy - 800); }
                else if (k < land) {
                    const f = (k - 0.35) / (land - 0.35), fe = f * f, sc = 0.8 + 0.2 * fe;
                    s.setAlpha(1); s.angle = 0; s.setScale(sx * sc, sy * sc);
                    s.setPosition(gx, (gy - 800) + 800 * fe);
                } else {
                    const t = (k - land) / (1 - land);
                    s.setAlpha(1); s.setPosition(gx, gy);
                    s.setScale(sx * (1.15 - 0.15 * t), sy * (0.8 + 0.2 * t));
                }
                if (!this._spawnBurst && k >= land) {
                    this._spawnBurst = true;
                    this.scene.triggerShake(0.3, 28);
                    this._spawnPuff(36, rgb(160, 160, 160), rgb(255, 150, 0));
                }
                break;
            }
            case 'boss2': {
                const arrive = 0.7, dx = this._spawnDX, dy = this._spawnDY;
                if (k < arrive) {
                    const f = k / arrive, fe = 1 - (1 - f) * (1 - f);
                    const dist = 1200 * (1 - fe), stretch = 1 + 1.2 * (1 - fe);
                    s.setPosition(gx - dx * dist, gy - dy * dist);
                    s.setAlpha(clamp(f * 2, 0, 1));
                    s.angle = Math.atan2(dy, dx) * DEG;
                    s.setScale(sx * stretch, sy / Math.sqrt(stretch));
                } else {
                    const t = (k - arrive) / (1 - arrive);
                    s.setPosition(gx, gy); s.angle = 0; s.setAlpha(1);
                    s.setScale(sx * (1 + 0.2 * (1 - t)), sy * (1 - 0.1 * (1 - t)));
                }
                if (!this._spawnBurst && k >= arrive) {
                    this._spawnBurst = true;
                    this.scene.triggerShake(0.2, 18);
                    this._spawnPuff(28, rgb(255, 40, 160), rgb(255, 160, 220));
                }
                break;
            }
            case 'boss3': {
                const flick = Math.random() < 0.5 ? 0.35 : 1, sc = 0.6 + 0.4 * k;
                s.setPosition(gx, gy); s.angle = 0;
                s.setAlpha(k < 0.85 ? flick * Math.min(1, k * 1.5) : 1);
                s.setScale(sx * sc, sy * sc);
                if (!this._spawnBurst && k >= 0.92) {
                    this._spawnBurst = true;
                    this.scene.triggerShake(0.25, 22);
                    this._spawnPuff(30, rgb(0, 230, 255), rgb(255, 0, 180));
                }
                break;
            }
            case 'bossdoc': {
                const m = clamp((k - 0.4) / 0.6, 0, 1), sc = 0.6 + 0.4 * m;
                s.setPosition(gx, gy); s.angle = 0;
                s.setAlpha(m); s.setScale(sx * sc, sy * sc);
                if (!this._spawnBurst && k >= 0.95) {
                    this._spawnBurst = true;
                    this._spawnPuff(24, rgb(60, 255, 130), rgb(180, 255, 200));
                }
                break;
            }
            default: {
                const m = clamp((k - 0.5) / 0.5, 0, 1);
                const c1 = 1.70158, c3 = c1 + 1;
                const back = m <= 0 ? 0 : 1 + c3 * Math.pow(m - 1, 3) + c1 * Math.pow(m - 1, 2);
                s.setPosition(gx, gy); s.angle = 0;
                s.setAlpha(m); s.setScale(sx * back, sy * back);
                if (!this._spawnBurst && k >= 1) {
                    this._spawnBurst = true;
                    this._spawnPuff(10, rgb(255, 90, 0), rgb(255, 200, 60));
                }
                break;
            }
        }

        if (k >= 1) {
            this.spawning = false;
            s.setAlpha(1); s.setScale(sx, sy); s.angle = 0; s.setPosition(gx, gy);
        }
    }

    _spawnPuff(n, c1, c2) {
        const sc = this.scene, s = this.sprite;
        if (!sc.particles || !sc.spawnParticle) return;
        for (let i = 0; i < n; i++) sc.particles.push(sc.spawnParticle(s.x, s.y, (i & 1) ? c1 : c2));
    }

    update(dt, px, py, arenaW, arenaH) {
        const s = this.sprite;

        if (this.spawning) { this._updateSpawn(dt); return; }

        if (this.type !== EnemyType.BOSS && this.type !== EnemyType.GOBLIN && this.type !== EnemyType.SUBWOOFER && this.type !== EnemyType.HYPEMAN) {
            const dir = normalize(px - s.x, py - s.y);
            s.x += dir.x * this.speed * dt;
            s.y += dir.y * this.speed * dt;
            if (this.type === EnemyType.FAST) {
                this.walkTimer += dt * 25;
                s.angle = Math.sin(this.walkTimer) * 20;
            } else {
                this.walkTimer += dt * 10;
                s.angle = Math.sin(this.walkTimer) * 15;
            }
        } else if (this.type === EnemyType.BOSS && this.isBossSplit) {
            this._updateBossSplit(dt, px, py, arenaW, arenaH);
        } else if (this.type === EnemyType.BOSS && this.isBoss3) {
            this._updateStrobe(dt, px, py);
        } else if (this.type === EnemyType.BOSS && this.isBossDoc) {
            this._updateBossDoctor(dt, px, py, arenaW, arenaH);
        } else if (this.type === EnemyType.BOSS && this.isBossBass) {
            this._updateBossBass(dt, px, py, arenaW, arenaH);
        } else if (this.type === EnemyType.BOSS) {
            this.justFiredVolley = false;
            const bs = this.bossScale || this.baseScale * 3;
            const enraged = this.isBoss2 && (this.hp <= this.maxHp / 2);
            const walkDuration = enraged ? 2.5 : 4.0;
            const prepDuration = enraged ? 0.6 : 0.8;
            const recoverDuration = enraged ? 0.8 : 1.2;
            const dashSpeed = enraged ? 1600 : 1200;
            if (this.isBoss2) this.speed = (this.scene.currentChapter === 1) ? 210 : (enraged ? 200 : 150);

            if (this.bossState === BossState.WALKING) {
                const dir = normalize(px - s.x, py - s.y);
                s.x += dir.x * this.speed * dt;
                s.y += dir.y * this.speed * dt;
                this.walkTimer += dt * 10;
                s.angle = Math.sin(this.walkTimer) * 5;
                const bob = Math.sin(this.walkTimer * 1.7) * 0.06;
                s.setScale(bs * (1 - bob * 0.4), bs * (1 + bob));
                this.bossTimer += dt;
                if (this.bossTimer >= walkDuration) {
                    this.bossState = BossState.PREPARING;
                    this.bossTimer = 0;
                    this.jumpDir = normalize(px - s.x, py - s.y);
                    if (this.isBoss2) this.volleyTargetPos = { x: px, y: py };
                }
            } else if (this.bossState === BossState.PREPARING) {
                this.bossTimer += dt;
                s.angle = Math.sin(this.bossTimer * 60) * 15;
                s.setScale(bs, bs);
                if (this.bossTimer >= prepDuration) { this.bossState = BossState.JUMPING; this.bossTimer = 0; }
            } else if (this.bossState === BossState.JUMPING) {
                this.bossTimer += dt;
                s.x += this.jumpDir.x * dashSpeed * dt;
                s.y += this.jumpDir.y * dashSpeed * dt;
                s.angle += 1000 * dt;
                s.setScale(bs, bs);
                if (this.bossTimer >= 0.4) {
                    this.bossState = BossState.RECOVERING;
                    this.bossTimer = 0;
                    s.angle = 0;
                    if (this.isBoss2 && enraged) this.justFiredVolley = true;
                }
            } else if (this.bossState === BossState.RECOVERING) {
                this.bossTimer += dt;
                s.setScale(bs, bs);
                if (this.bossTimer >= recoverDuration) { this.bossState = BossState.WALKING; this.bossTimer = 0; }
            }
        } else if (this.type === EnemyType.SUBWOOFER) {
            this.justSoundWave = false;
            const base = this.baseScale;
            if (this.subState === 'MOVE') {
                const dir = normalize(px - s.x, py - s.y);
                s.x += dir.x * this.speed * dt;
                s.y += dir.y * this.speed * dt;
                this.walkTimer += dt * 6;
                const bob = Math.sin(this.walkTimer) * 0.05;
                s.setScale(base * (1 + bob), base * (1 - bob));
                s.angle = 0;
                this.subTimer += dt;
                const dx = px - s.x, dy = py - s.y;
                const inRange = (dx * dx + dy * dy) <= C.SUBWOOFER.APPROACH_RANGE * C.SUBWOOFER.APPROACH_RANGE;
                if (this.subTimer >= C.SUBWOOFER.REARM && inRange) { this.subState = 'CHARGE'; this.subTimer = 0; }
            } else if (this.subState === 'CHARGE') {
                this.subTimer += dt;
                const pulse = 1 + 0.25 * clamp(this.subTimer / 0.7, 0, 1) + 0.05 * Math.sin(this.subTimer * 40);
                s.setScale(base * pulse, base * pulse);
                s.angle = Math.sin(this.subTimer * 50) * 4;
                if (this.subTimer >= 0.7) { this.subState = 'BOOM'; this.subTimer = 0; this._waveFired = false; s.angle = 0; }
            } else if (this.subState === 'BOOM') {
                this.subTimer += dt;
                if (!this._waveFired) { this.justSoundWave = true; this._waveFired = true; }
                const rec = clamp(this.subTimer / 0.45, 0, 1);
                s.setScale(base * (1.3 - 0.3 * rec), base * (1.3 - 0.3 * rec));
                if (this.subTimer >= 0.45) { this.subState = 'MOVE'; this.subTimer = 0; s.setScale(base, base); }
            }
        } else if (this.type === EnemyType.HYPEMAN) {
            const dx = s.x - px, dy = s.y - py;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            if (d < C.HYPEMAN.FLEE_DIST) {
                s.x = clamp(s.x + (dx / d) * this.speed * dt, 0, arenaW);
                s.y = clamp(s.y + (dy / d) * this.speed * dt, 0, arenaH);
            } else if (d > C.HYPEMAN.AURA_RADIUS) {
                s.x = clamp(s.x - (dx / d) * this.speed * dt, 0, arenaW);
                s.y = clamp(s.y - (dy / d) * this.speed * dt, 0, arenaH);
            }
            this.walkTimer += dt * 8;
            s.angle = Math.sin(this.walkTimer) * 6;
        }

        if (this.type === EnemyType.GOBLIN) {
            this.justThrew = false;

            const view = this.scene.cameras.main.worldView;
            const margin = 80;

            if (this.goblinStationed) {
                const stillVisible = s.x >= view.x && s.x <= view.right && s.y >= view.y && s.y <= view.bottom;
                if (!stillVisible) {
                    this.goblinStationed = false;
                    this.goblinState = GoblinState.WALKING;
                    this.goblinTimer = 0;
                    s.angle = 0;
                    s.setScale(this.baseScale, this.baseScale);
                }
            }

            if (!this.goblinStationed) {
                const inView = s.x >= view.x + margin && s.x <= view.right - margin &&
                               s.y >= view.y + margin && s.y <= view.bottom - margin;
                if (inView) {
                    this.goblinStationed = true;
                    this.goblinState = GoblinState.WALKING;
                    this.goblinTimer = 0;
                } else {
                    const dir = normalize(px - s.x, py - s.y);
                    s.x += dir.x * this.speed * dt;
                    s.y += dir.y * this.speed * dt;
                    this.walkTimer += dt * 8;
                    s.angle = Math.sin(this.walkTimer) * 8;
                }
            }

            if (this.goblinStationed) {
                this.goblinTimer += dt;
                if (this.goblinState === GoblinState.WALKING) {
                    this.walkTimer += dt * 8;
                    s.angle = Math.sin(this.walkTimer) * 4;
                    if (this.goblinTimer >= 2.5) {
                        this.goblinState = GoblinState.PREPARING;
                        this.throwTargetPos = { x: px, y: py };
                        this.goblinTimer = 0;
                    }
                } else if (this.goblinState === GoblinState.PREPARING) {
                    s.angle = Math.sin(this.goblinTimer * 28) * 14;
                    const pulse = 1 + Math.sin(this.goblinTimer * 18) * 0.08;
                    s.setScale(this.baseScale * pulse, this.baseScale / pulse);
                    if (this.goblinTimer >= 1.2) { this.goblinState = GoblinState.THROWING; this.goblinTimer = 0; }
                } else if (this.goblinState === GoblinState.THROWING) {
                    this.justThrew = true;
                    s.angle = 0;
                    s.setScale(this.baseScale, this.baseScale);
                    this.goblinState = GoblinState.RECOVERING;
                    this.goblinTimer = 0;
                } else if (this.goblinState === GoblinState.RECOVERING) {
                    if (this.goblinTimer >= 2.0) { this.goblinState = GoblinState.WALKING; this.goblinTimer = 0; }
                }
            }
        }

        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
            s.setTint(rgb(255, 50, 50));
        } else {
            if (this.type === EnemyType.BOSS) {
                if (this.bossState === BossState.PREPARING) {
                    s.setTint(rgb(255, 0, 0));
                } else if (this.isBoss2) {
                    const enraged = this.hp <= this.maxHp / 2;
                    if (enraged) {
                        const pulse = (Math.sin(this.bossTimer * 8) + 1) / 2;
                        s.setTint(rgb(255, 40 + 100 * pulse, 0));
                    } else {
                        s.setTint(rgb(200, 80, 255));
                    }
                } else if (this.isBoss3) {
                    if (this.strobeState === 'TELEGRAPH') {
                        const pulse = (Math.sin(this.strobeTimer * 30) + 1) / 2;
                        s.setTint(rgb(180 + 75 * pulse, 255, 255));
                    } else {
                        s.clearTint();
                    }
                } else {
                    s.setTint(rgb(255, 100, 255));
                }
            } else if (this.type === EnemyType.FAST) {
                s.setTint(rgb(255, 255, 50));
            } else if (this.type === EnemyType.TANK) {
                const pulse = (Math.sin(this.walkTimer * 1.5) + 1) / 2;
                s.setTint(rgb(30 + 20 * pulse, 150 + 50 * pulse, 220 + 35 * pulse));
            } else if (this.type === EnemyType.GOBLIN) {
                if (this.goblinState === GoblinState.PREPARING) {
                    const pulse = (Math.sin(this.goblinTimer * 20) + 1) / 2;
                    s.setTint(rgb(255, 80 + 80 * pulse, 255));
                } else {
                    s.clearTint();
                }
            } else if (this.type === EnemyType.SUBWOOFER) {
                if (this.subState === 'CHARGE') {
                    const pulse = (Math.sin(this.subTimer * 30) + 1) / 2;
                    s.setTint(rgb(120 + 135 * pulse, 180 + 75 * pulse, 255));
                } else if (this.subState === 'BOOM') {
                    s.setTint(rgb(255, 255, 255));
                } else {
                    const pulse = (Math.sin(this.walkTimer * 1.2) + 1) / 2;
                    s.setTint(rgb(40 + 30 * pulse, 40 + 40 * pulse, 200 + 55 * pulse));
                }
            } else if (this.type === EnemyType.MOSHER || this.type === EnemyType.MOSHERLING) {
                const pulse = (Math.sin(this.walkTimer * 1.5) + 1) / 2;
                s.setTint(rgb(255, 40 + 80 * pulse, 180 + 60 * pulse));
            } else if (this.type === EnemyType.HYPEMAN) {
                const pulse = (Math.sin(this.walkTimer * 2) + 1) / 2;
                s.setTint(rgb(255, 200 + 55 * pulse, 40));
            } else {
                s.clearTint();
            }
        }

        const halfW = s.displayWidth / 2;
        const halfH = s.displayHeight / 2;
        if (s.x < halfW) s.x = halfW;
        if (s.x > arenaW - halfW) s.x = arenaW - halfW;
        if (s.y < halfH) s.y = halfH;
        if (s.y > arenaH - halfH) s.y = arenaH - halfH;
    }

    destroy() { this.sprite.destroy(); }
}
Enemy._nextId = 1;
