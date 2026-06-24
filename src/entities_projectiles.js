
class Bullet {
    constructor(scene, x, y, dirx, diry, damage, crit) {
        this.scene = scene;
        this.speed = 800;
        this.TRAIL_LENGTH = 8;
        this.trailX = new Float64Array(this.TRAIL_LENGTH);
        this.trailY = new Float64Array(this.TRAIL_LENGTH);
        this.trailStart = 0;
        this.trailCount = 0;
        this.sprite = scene.addWorld(scene.add.sprite(x, y, 'bullet'));
        this.sprite.setOrigin(0.5, 0.5);
        this.reinit(x, y, dirx, diry, damage, crit);
    }

    reinit(x, y, dirx, diry, damage, crit) {
        this.damage = damage;
        this.isDestroyed = false;
        this.isCrit = crit;
        this.ricochetsLeft = 0;
        this.pierceLeft = 0;
        this.lastHit = null;
        this.trailX[0] = x; this.trailY[0] = y; this.trailStart = 0; this.trailCount = 1;
        this.vx = dirx * this.speed;
        this.vy = diry * this.speed;
        this.sprite.setPosition(x, y).setVisible(true);
        this.sprite.setDisplaySize(40, 40);
        if (crit) this.sprite.setTint(rgb(255, 220, 0)); else this.sprite.clearTint();
        this.sprite.angle = Math.atan2(diry, dirx) * DEG - 180;
        return this;
    }

    update(dt) {
        const cap = this.TRAIL_LENGTH;
        if (this.trailCount < cap) {
            const i = (this.trailStart + this.trailCount) % cap;
            this.trailX[i] = this.sprite.x; this.trailY[i] = this.sprite.y;
            this.trailCount++;
        } else {
            this.trailX[this.trailStart] = this.sprite.x; this.trailY[this.trailStart] = this.sprite.y;
            this.trailStart = (this.trailStart + 1) % cap;
        }
        this.sprite.x += this.vx * dt;
        this.sprite.y += this.vy * dt;
    }

    release() { this.sprite.setVisible(false); }
    destroy() { this.sprite.destroy(); }
}

class EnemyProjectile {
    constructor(scene, x, y, tx, ty) {
        this.scene = scene;
        this.sprite = scene.addWorld(scene.add.sprite(x, y, 'weaponEnemyV'));
        this.sprite.setOrigin(0.5, 0.5);
        this.glow = scene.addWorld(scene.add.sprite(x, y, 'weaponEnemyV'));
        this.glow.setOrigin(0.5, 0.5);
        this.glow.setDisplaySize(58 * 1.45, 58 * 1.45);
        this.glow.setTint(rgb(180, 0, 255));
        this.glow.setAlpha(70 / 255);
        this.glow.setDepth(-0.5);
        this.reinit(x, y, tx, ty);
    }

    reinit(x, y, tx, ty) {
        this.isDestroyed = false;
        this.isStun = false;
        this.damage = 20;
        const dir = normalize(tx - x, ty - y);
        this.vx = dir.x * 550;
        this.vy = dir.y * 550;
        const ang = Math.atan2(dir.y, dir.x) * DEG + 40;
        this.sprite.setPosition(x, y).setVisible(true).setDisplaySize(58, 58);
        this.sprite.angle = ang;
        this.glow.setPosition(x, y).setVisible(true);
        this.glow.angle = ang;
        return this;
    }

    update(dt, arenaW, arenaH) {
        this.sprite.x += this.vx * dt;
        this.sprite.y += this.vy * dt;
        this.glow.x = this.sprite.x;
        this.glow.y = this.sprite.y;
        const p = this.sprite;
        if (p.x < -120 || p.x > arenaW + 120 || p.y < -120 || p.y > arenaH + 120) this.isDestroyed = true;
    }

    release() { this.sprite.setVisible(false); this.glow.setVisible(false); }
    destroy() { this.sprite.destroy(); this.glow.destroy(); }
}

class BossSoul {
    constructor(scene, x, y, type) {
        this.scene = scene;
        this.isCollected = false;
        this.soulType = type;
        this.animTimer = randInt(100) / 40;
        this.baseY = y;

        this.sprite = scene.addWorld(scene.add.sprite(x, y, 'boss_soul'));
        this.sprite.setOrigin(0.5, 0.5);
        const sc = 80 / Math.max(this.sprite.width, this.sprite.height);
        this.sprite.setScale(sc, sc);

        this.glow = scene.addWorld(scene.add.circle(x, y, 65, 0x000000, 0));
        this.glow.setDepth(-0.5);
    }

    update(dt, globalTime) {
        this.animTimer += dt;
        this.sprite.y = this.baseY + Math.sin(this.animTimer * 2.5) * 18;
        this.sprite.angle += 45 * dt;

        const pulse = (Math.sin(this.animTimer * 3) + 1) / 2;
        if (this.soulType === 1) {
            this.sprite.setTint(rgb(200 + 55 * pulse, 50, 100 + 155 * pulse));
        } else if (this.soulType === 3) {
            this.sprite.setTint(rgb(0, 200 + 55 * pulse, 255));
        } else if (this.soulType === 4) {
            this.sprite.setTint(rgb(40, 200 + 55 * pulse, 110));
        } else if (this.soulType === 5) {
            this.sprite.setTint(rgb(40, 120 + 80 * pulse, 255));
        } else if (this.soulType === 6) {
            this.sprite.setTint(rgb(255, 60 + 80 * pulse, 170));
        } else {
            this.sprite.setTint(rgb(80 + 120 * pulse, 30 * pulse, 255));
        }

        const gp = (Math.sin(globalTime * 3.5) + 1) / 2;
        this.glow.x = this.sprite.x;
        this.glow.y = this.sprite.y;
        const a = (25 + 20 * gp) / 255;
        this.glow.setFillStyle(this.soulType === 1 ? rgb(200, 0, 180) : this.soulType === 3 ? rgb(0, 220, 255) : this.soulType === 4 ? rgb(40, 220, 110) : this.soulType === 5 ? rgb(40, 130, 255) : this.soulType === 6 ? rgb(255, 50, 170) : rgb(100, 0, 255), a);
    }

    destroy() { this.sprite.destroy(); this.glow.destroy(); }
}

class SkullProjectile {
    constructor(scene, x, y, dirx, diry, firstTarget) {
        this.scene = scene;
        this.x = x; this.y = y;
        const n = normalize(dirx, diry);
        this.vx = n.x; this.vy = n.y;
        this.target = firstTarget || null;
        this.hitIds = [];
        this.hitsDone = 0;
        this.life = C.ABILITY.SKULL_LIFETIME;
        this.dead = false;
        this.spin = 0;
        this.sprite = scene.addWorld(scene.add.sprite(x, y, 'ability_skull'));
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setDisplaySize(C.ABILITY.SKULL_SIZE, C.ABILITY.SKULL_SIZE);
        this.sprite.setDepth(15);
    }

    _nearestTarget() {
        let best = null, bestD = C.ABILITY.SKULL_SEEK_RADIUS * C.ABILITY.SKULL_SEEK_RADIUS;
        for (const e of this.scene.enemies) {
            if (e.hp <= 0 || e.spawning) continue;
            if (this.hitIds.indexOf(e._id) !== -1) continue;
            const dq = distSq(this.x, this.y, e.sprite.x, e.sprite.y);
            if (dq < bestD) { bestD = dq; best = e; }
        }
        return best;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) { this.dead = true; return; }
        if (!this.target || this.target.hp <= 0 || this.target.spawning || this.hitIds.indexOf(this.target._id) !== -1) {
            this.target = this._nearestTarget();
        }
        if (this.target) {
            const n = normalize(this.target.sprite.x - this.x, this.target.sprite.y - this.y);
            this.vx = n.x; this.vy = n.y;
        }
        const sp = C.ABILITY.SKULL_SPEED;
        this.x += this.vx * sp * dt;
        this.y += this.vy * sp * dt;
        this.spin += dt * 10;
        this.sprite.setPosition(this.x, this.y);
        this.sprite.angle = Math.sin(this.spin) * 14;
        if (this.target) {
            const hr = C.ABILITY.SKULL_HIT_RADIUS;
            if (distSq(this.x, this.y, this.target.sprite.x, this.target.sprite.y) < hr * hr) this._hit(this.target);
        }
        if (this.x < -150 || this.y < -150 || this.x > this.scene.arenaW + 150 || this.y > this.scene.arenaH + 150) this.dead = true;
    }

    _hit(e) {
        const A = C.ABILITY;
        const base = this.scene.player.attackDamage * A.SKULL_DAMAGE_MULT;
        const dmg = Math.max(1, Math.round(base * (1 + A.SKULL_BOUNCE_BONUS * this.hitsDone)));
        e.hp -= dmg; e.hitFlashTimer = 0.12;
        this.scene.dmgTexts.push(this.scene.spawnDamageText(e.sprite.x, e.sprite.y, dmg, this.hitsDone > 0));
        for (let i = 0; i < 8; i++) this.scene.particles.push(this.scene.spawnParticle(this.x, this.y, (i & 1) ? rgb(120, 255, 150) : rgb(220, 255, 220)));
        this.hitIds.push(e._id);
        this.hitsDone++;
        this.target = null;
        if (this.hitsDone >= A.SKULL_MAX_HITS) this.dead = true;
    }

    destroy() { this.sprite.destroy(); }
}

class ShatterBomb {
    constructor(scene, x, y, dirx, diry) {
        this.scene = scene;
        this.x = x; this.y = y;
        const n = normalize(dirx, diry);
        this.vx = n.x; this.vy = n.y;
        this.traveled = 0;
        this.dead = false;
        this.spin = 0;
        this.sprite = scene.addWorld(scene.add.sprite(x, y, 'ability_shatter'));
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setDisplaySize(C.ABILITY.SHATTER_SIZE, C.ABILITY.SHATTER_SIZE);
        this.sprite.setDepth(15);
    }

    _hitsEnemy() {
        for (const e of this.scene.enemies) {
            if (e.hp <= 0 || e.spawning) continue;
            const hr = 50 + (e.isBoss ? 90 : 0);
            if (distSq(this.x, this.y, e.sprite.x, e.sprite.y) < hr * hr) return true;
        }
        return false;
    }

    update(dt) {
        const A = C.ABILITY, step = A.SHATTER_SPEED * dt;
        this.x += this.vx * step; this.y += this.vy * step; this.traveled += step;
        this.spin += dt;
        this.sprite.setPosition(this.x, this.y);
        this.sprite.angle = this.spin * 540;
        const out = (this.x < 0 || this.y < 0 || this.x > this.scene.arenaW || this.y > this.scene.arenaH);
        if (this.traveled >= A.SHATTER_RANGE || out || this._hitsEnemy()) this._burst();
    }

    _burst() {
        this.dead = true;
        const A = C.ABILITY, sc = this.scene, n = A.SHATTER_FRAGMENTS;
        for (let i = 0; i < n; i++) {
            const ang = (i / n) * Math.PI * 2;
            sc.bullets.push(sc.spawnBullet(this.x, this.y, Math.cos(ang), Math.sin(ang), A.SHATTER_DAMAGE, false));
        }
        for (let i = 0; i < 16; i++) sc.particles.push(sc.spawnParticle(this.x, this.y, (i & 1) ? rgb(255, 60, 180) : rgb(180, 80, 255)));
        sc.triggerShake(0.2, 16);
        sc.audio.play('sfx_slam', { volume: 0.5 });
    }

    destroy() { this.sprite.destroy(); }
}
