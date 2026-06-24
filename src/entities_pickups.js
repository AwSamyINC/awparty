
class Gem {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.addWorld(scene.add.sprite(x, y, 'gem'));
        this.sprite.setOrigin(0.5, 0.5);
        this.baseScale = 44 / this.sprite.width;
        this.reinit(x, y);
    }

    reinit(x, y) {
        this.isCollected = false;
        this.animTimer = randInt(100) / 40;
        this.sprite.setPosition(x, y).setVisible(true);
        this.sprite.setScale(this.baseScale, this.baseScale);
        this.sprite.clearTint();
        this.sprite.angle = 0;
        return this;
    }

    update(dt, px, py, pickupRadius) {
        this.animTimer += dt;
        const breath = 1 + Math.sin(this.animTimer * 3.2) * 0.18;

        const spd = 2.8;
        const r = 128 + 127 * Math.sin(this.animTimer * spd + 0.0);
        const g = 128 + 127 * Math.sin(this.animTimer * spd + 2.094);
        const b = 128 + 127 * Math.sin(this.animTimer * spd + 4.189);
        this.sprite.setTint(rgb(r, g, b));

        this.sprite.angle += 55 * dt;

        const d = dist(this.sprite.x, this.sprite.y, px, py);
        const attracting = d < pickupRadius;
        const sizeMul = attracting ? 0.5 : 1;
        this.sprite.setScale(this.baseScale * breath * sizeMul, this.baseScale * breath * sizeMul);
        if (attracting) {
            const dir = normalize(px - this.sprite.x, py - this.sprite.y);
            this.sprite.x += dir.x * 500 * dt;
            this.sprite.y += dir.y * 500 * dt;
        }
    }

    release() { this.sprite.setVisible(false); }
    destroy() { this.sprite.destroy(); }
}

class Coin {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.addWorld(scene.add.sprite(x, y, 'coin'));
        this.sprite.setOrigin(0.5, 0.5);
        this.baseScale = 30 / this.sprite.width;
        this.reinit(x, y);
    }

    reinit(x, y) {
        this.isCollected = false;
        this.animTimer = x * 0.01 + y * 0.01;
        this.sprite.setPosition(x, y).setVisible(true);
        this.sprite.setScale(this.baseScale, this.baseScale);
        return this;
    }

    update(dt, px, py, pickupRadius) {
        this.animTimer += dt;
        const pulse = this.baseScale * (1 + Math.sin(this.animTimer * 5) * 0.1);
        this.sprite.setScale(pulse, pulse);

        if (distSq(this.sprite.x, this.sprite.y, px, py) < pickupRadius * pickupRadius) {
            const dir = normalize(px - this.sprite.x, py - this.sprite.y);
            this.sprite.x += dir.x * 550 * dt;
            this.sprite.y += dir.y * 550 * dt;
        }
    }

    release() { this.sprite.setVisible(false); }
    destroy() { this.sprite.destroy(); }
}

class Vinyl {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.addWorld(scene.add.sprite(x, y, 'vinyl'));
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setDisplaySize(50, 50);
        this._baseSX = this.sprite.scaleX; this._baseSY = this.sprite.scaleY;
        this.reinit(x, y);
    }

    reinit(x, y) {
        this.isCollected = false;
        this._pulseT = 0;
        this.sprite.setPosition(x, y).setVisible(true);
        this.sprite.angle = 0;
        this.sprite.setScale(this._baseSX, this._baseSY);
        return this;
    }

    update(dt) {
        this._pulseT += dt;
        const p = 1 + 0.12 * Math.sin(this._pulseT * 4);
        this.sprite.setScale(this._baseSX * p, this._baseSY * p);
    }

    release() { this.sprite.setVisible(false); }
    destroy() { this.sprite.destroy(); }
}

class Particle {
    constructor(scene, x, y, color) {
        this.scene = scene;
        this.rect = scene.addWorld(scene.add.rectangle(x, y, 4, 4, color));
        this.rect.setOrigin(0.5, 0.5);
        this.reinit(x, y, color);
    }

    reinit(x, y, color) {
        const angle = randInt(360) * Math.PI / 180;
        const speed = randInt(150) + 50;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.maxLifetime = randInt(100) / 100 * 0.5 + 0.5;
        this.lifetime = this.maxLifetime;
        this.rect.setPosition(x, y).setVisible(true);
        this.rect.setFillStyle(color, 1);
        this.rect.setScale(1, 1);
        this.rect.setAlpha(1);
        return this;
    }

    update(dt) {
        this.rect.x += this.vx * dt;
        this.rect.y += this.vy * dt;
        this.vx *= 0.9;
        this.vy *= 0.9;
        this.lifetime -= dt;
        if (this.lifetime > 0) this.rect.setAlpha(this.lifetime / this.maxLifetime);
    }

    release() { this.rect.setVisible(false); }
    destroy() { this.rect.destroy(); }
}

// «Труп» — отдельная короткоживущая сущность анимации смерти обычного врага.
// Снимает слепок вида врага (текстура/масштаб/угол) и проигрывает оседание вниз,
// пока сам враг удаляется как обычно. Боссов не порождает (см. handleEnemyDeaths).
// Глубину НЕ трогаем: пол (tileSprite) и враги оба на depth 0, упорядочены вставкой;
// depth -1 спрятал бы труп ПОД полом. Default depth 0 — как у партиклов.
class DeathFx {
    constructor(scene, e) {
        this.scene = scene;
        this.sprite = scene.addWorld(scene.add.sprite(0, 0, e.sprite.texture.key));
        this.sprite.setOrigin(0.5, 1.0);
        this.reinit(e);
    }

    reinit(e) {
        const es = e.sprite, s = this.sprite;
        s.setTexture(es.texture.key, es.frame.name);
        s.setOrigin(0.5, 1.0);
        s.setFlip(es.flipX, es.flipY);
        s.angle = es.angle;
        this.baseScaleX = es.scaleX;
        this.baseScaleY = es.scaleY;
        // ставим в точку «ног» врага (origin снизу) — сжатие читается как оседание к земле
        s.setPosition(es.x, es.y + es.displayHeight / 2);
        s.setScale(this.baseScaleX, this.baseScaleY);
        s.setTint(0xffffff);
        s.setAlpha(1).setVisible(true);
        this.timer = 0;
        this.done = false;
        return this;
    }

    update(dt) {
        if (this.done) return;
        const F = C.DEATH_FX, s = this.sprite;
        this.timer += dt;
        const k = clamp(this.timer / F.DURATION, 0, 1);

        // оседание: высота → END_SCALE_Y, ширина чуть раздута в начале (расплющивание)
        s.setScale(this.baseScaleX * (1 + F.WIDEN * (1 - k)),
                   this.baseScaleY * (1 - (1 - F.END_SCALE_Y) * k));

        // тинт: белая вспышка → тёмный
        if (k < F.FLASH_K) {
            s.setTint(0xffffff);
        } else {
            const t = (k - F.FLASH_K) / (1 - F.FLASH_K), d = F.DARK_TINT;
            s.setTint(rgb(255 + (((d >> 16) & 255) - 255) * t,
                          255 + (((d >> 8) & 255) - 255) * t,
                          255 + ((d & 255) - 255) * t));
        }

        // затухание под конец
        s.setAlpha(k > F.FADE_START ? 1 - (k - F.FADE_START) / (1 - F.FADE_START) : 1);

        if (k >= 1) this.done = true;
    }

    release() { this.sprite.clearTint(); this.sprite.setVisible(false); }
    destroy() { this.sprite.destroy(); }
}

class DamageText {
    constructor(scene, x, y, damage, isCrit) {
        this.scene = scene;
        this.text = scene.addWorld(scene.add.text(x, y, '', {
            fontFamily: 'Orbitron, Arial',
            fontSize: '30px',
            color: '#ff4646',
            stroke: '#000000',
            strokeThickness: 4,
        }));
        this.text.setOrigin(0.5, 0.5);
        this.reinit(x, y, damage, isCrit);
    }

    reinit(x, y, damage, isCrit) {
        this.lifetime = 0.8;
        this.maxLifetime = 0.8;
        this.vy = -80;
        const str = isCrit ? ('-' + damage + '!') : ('-' + damage);
        const offX = randInt(40) - 20;
        const offY = randInt(20) - 40;
        this.text.setFontSize(isCrit ? 45 : 30);
        this.text.setColor(isCrit ? '#ffd700' : '#ff4646');
        this.text.setText(str);
        this.text.setPosition(x + offX, y + offY).setVisible(true);
        this.text.setScale(1, 1);
        this.text.setAlpha(1);
        return this;
    }

    update(dt) {
        this.text.y += this.vy * dt;
        this.lifetime -= dt;
        if (this.lifetime > 0) {
            const ratio = this.lifetime / this.maxLifetime;
            this.text.setAlpha(ratio);
            const scale = 0.5 + 0.5 * ratio;
            this.text.setScale(scale, scale);
        }
    }

    release() { this.text.setVisible(false); }
    destroy() { this.text.destroy(); }
}

class Sphere {
    constructor(scene) {
        this.scene = scene;
        this.angle = 0;
        this.sprite = scene.addWorld(scene.add.sprite(0, 0, 'icon_sphere').setOrigin(0.5, 0.5));
        this.sprite.setDepth(12);
        this.sprite.setBlendMode(Phaser.BlendModes.ADD);
        this.sprite.setScale(C.SPHERE.SIZE / this.sprite.width);
    }
    update(dt) {
        const scene = this.scene, p = scene.player;
        const lvl = p.sphereLevel;
        if (lvl <= 0) { this.sprite.setVisible(false); return; }
        this.sprite.setVisible(true);
        const T = C.SPHERE.BASE_PERIOD - (lvl - 1);
        this.angle += (2 * Math.PI / T) * dt;
        const ox = p.sprite.x + Math.cos(this.angle) * C.SPHERE.RADIUS;
        const oy = p.sprite.y + Math.sin(this.angle) * C.SPHERE.RADIUS;
        this.sprite.setPosition(ox, oy);
        this.sprite.rotation += dt * 4;
        const dmg = Math.max(1, Math.floor(p.attackDamage * C.SPHERE.DAMAGE_MULT + 0.5));
        for (const e of scene.enemies) {
            if (e.sphereCd > 0 || e.spawning || e.hp <= 0) continue;
            if (distSq(ox, oy, e.sprite.x, e.sprite.y) < C.SPHERE.HIT_DIST_SQ) {
                e.hp -= dmg;
                e.hitFlashTimer = 0.12;
                e.sphereCd = C.SPHERE.HIT_CD;
            }
        }
    }
    destroy() { if (this.sprite) { this.sprite.destroy(); this.sprite = null; } }
}
