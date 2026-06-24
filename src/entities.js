
const DEG = 180 / Math.PI;

class Player {
    constructor(scene) {
        this.scene = scene;

        this.speed = 220;
        this.shootCooldown = 0.45;
        this.currentCooldown = 0;
        this.isMoving = false;

        this.level = 1;
        this.currentXP = 0;
        this.xpToNextLevel = C.XP_BASE;
        this.pickupRadius = 100;

        this.maxHp = 100;
        this.hp = 100;
        this.iFrames = 0;
        this.attackDamage = 1;

        this.critChance = 0.03;
        this.baseCritChance = 0.03;
        this.critMultiplier = 2.0;
        this.armor = 0;
        this.damageAcc = 0;

        this.ironSkinCharges = 0;
        this.soulLeechCritBonus = 0;

        this.bladeMail = false;
        this.pierce = false;

        this.damageReduction = 0;
        this.sphereLevel = 0;
        this.doubleTapLevel = 0;

        this.hasDashUnlocked = false;
        this.dashLevel = 0;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDuration = 0.2;
        this.dashSpeed = 1200;
        this.dashCooldown = 3.0;
        this.currentDashCooldown = 0;
        this.dashDir = { x: 0, y: 0 };

        this.postDashSpeedMultiplier = 0.6;
        this.dashPenaltyDuration = 1.5;
        this.dashPenaltyTimer = 0;
        this.currentSpeedMultiplier = 1.0;

        this.ghosts = [];
        this.ghostSpawnTimer = 0;
        this.lastGhostX = 1500;
        this.lastGhostY = 1500;

        this.isInvincible = false;
        this.invincibilityTimer = 0;
        this.stunTimer = 0;

        this.lastUpgradeId = -1;
        this.messageTimer = 0;

        this.walkTimer = 0;
        this.animTimer = 0;
        this.idleTimer = 0;
        this.baseScale = 1.0;

        this.facing = 'front';
        this.animFrame = 0;
        this.ANIM_FPS = 8;
        this.ANIM_FRAMES = 6;
        this.currentTexKey = null;

        this.sprite = scene.addWorld(scene.add.sprite(1500, 1500, 'player_front'));
        this.sprite.setOrigin(0.5, 0.5);
        this.shadow = scene.addWorld(scene.add.ellipse(1500, 1500, 90, 36, 0x000000, 120 / 255));
        this.shadow.setDepth(-1);
        this.applySprite(false);
    }

    computePostDashMultiplier() {
        if (this.dashLevel >= C.MAX_PERM_DASH_LEVEL) return 1.0;
        const minMul = this.postDashSpeedMultiplier;
        const t = this.dashLevel / C.MAX_PERM_DASH_LEVEL;
        return minMul + (1.0 - minMul) * t;
    }

    computeDashPenaltyDuration() {
        if (this.dashLevel >= C.MAX_PERM_DASH_LEVEL) return 0;
        const t = this.dashLevel / C.MAX_PERM_DASH_LEVEL;
        return this.dashPenaltyDuration * (1.0 - t);
    }

    applySprite(moving) {
        let texKey;
        if (moving) {
            texKey = 'panim_' + this.facing + (this.animFrame + 1);
            if (!this.scene.textures.exists(texKey)) texKey = 'player_' + this.facing;
        } else {
            texKey = 'player_' + this.facing;
        }
        if (this.currentTexKey !== texKey) {
            this.currentTexKey = texKey;
            this.sprite.setTexture(texKey);
            this.sprite.setOrigin(0.5, 0.5);
            this.baseScale = 120 / this.sprite.height;
        }
    }

    gainXP(amount) { this.currentXP += amount; }

    takeDamage(amount) {
        if (this.iFrames <= 0 && !this.isDashing && !this.isInvincible) {
            if (this.ironSkinCharges > 0) { this.ironSkinCharges--; this.iFrames = 0.3; return; }
            const reduction = Math.min(0.9, this.armor * 0.20);
            this.damageAcc += amount * (1 - reduction);
            const dealt = Math.floor(this.damageAcc);
            if (dealt > 0) { this.hp -= dealt; this.damageAcc -= dealt; }
            this.iFrames = 1.0;
        }
    }

    update(dt, arenaW, arenaH, input) {
        if (this.currentDashCooldown > 0) this.currentDashCooldown -= dt;
        if (this.stunTimer > 0) this.stunTimer -= dt;

        let mvx = 0, mvy = 0;
        const s = this.sprite;

        if (this.isDashing) {
            this.dashTimer -= dt;
            s.x += this.dashDir.x * this.dashSpeed * dt;
            s.y += this.dashDir.y * this.dashSpeed * dt;

            this.applySprite(false);
            s.angle = Math.atan2(this.dashDir.y, this.dashDir.x) * DEG;
            s.setScale(this.baseScale * 1.5, this.baseScale * 0.6);

            this.ghostSpawnTimer -= dt;
            if (this.ghostSpawnTimer <= 0) {
                const moved = Math.abs(s.x - this.lastGhostX) + Math.abs(s.y - this.lastGhostY);
                if (moved > 5) {
                    const g = this.scene.addWorld(this.scene.add.image(s.x, s.y, s.texture.key));
                    g.setOrigin(0.5, 0.5);
                    g.setScale(s.scaleX, s.scaleY);
                    g.angle = s.angle;
                    g.setTint(rgb(0, 255, 200));
                    g.setAlpha(150 / 255);
                    this.ghosts.push({ img: g, lifetime: 0.2, maxLifetime: 0.2 });
                    this.lastGhostX = s.x;
                    this.lastGhostY = s.y;
                }
                this.ghostSpawnTimer = 0.03;
            }

            if (this.dashTimer <= 0) {
                this.isDashing = false;
                s.angle = 0;
                s.setScale(this.baseScale, this.baseScale);
                this.currentSpeedMultiplier = this.computePostDashMultiplier();
                this.dashPenaltyTimer = this.computeDashPenaltyDuration();
            }
        } else {
            if (this.stunTimer <= 0) {
                if (input.left) { mvx -= 1; this.facing = 'left'; }
                if (input.right) { mvx += 1; this.facing = 'right'; }
                if (input.up) { mvy -= 1; if (mvx === 0) this.facing = 'back'; }
                if (input.down) { mvy += 1; if (mvx === 0) this.facing = 'front'; }
            }

            this.isMoving = (mvx !== 0 || mvy !== 0);

            if (this.hasDashUnlocked && input.space && this.currentDashCooldown <= 0 && this.stunTimer <= 0) {
                this.isDashing = true;
                this.dashTimer = this.dashDuration;
                this.currentDashCooldown = this.dashCooldown;
                if (this.scene.audio) this.scene.audio.play('sfx_dash', { volume: 0.7 });
                this.ghosts.forEach(g => g.img.destroy());
                this.ghosts.length = 0;
                this.lastGhostX = s.x;
                this.lastGhostY = s.y;
                if (this.isMoving) this.dashDir = normalize(mvx, mvy);
                else this.dashDir = { x: 0, y: -1 };
            }

            if (this.isMoving && !this.isDashing) {
                const n = normalize(mvx, mvy);
                s.x += n.x * this.speed * this.currentSpeedMultiplier * dt;
                s.y += n.y * this.speed * this.currentSpeedMultiplier * dt;

                this.animTimer += dt;
                this.walkTimer += dt;
                if (this.walkTimer >= 1 / this.ANIM_FPS) {
                    this.walkTimer -= 1 / this.ANIM_FPS;
                    this.animFrame = (this.animFrame + 1) % this.ANIM_FRAMES;
                }
                this.applySprite(true);

                s.angle = n.x * 5;
                const bob = Math.sin(this.animTimer * 12) * 0.07;
                s.setScale(this.baseScale * (1 - bob * 0.4), this.baseScale * (1 + bob));
                this.idleTimer = 0;
            } else if (!this.isDashing) {
                this.animTimer = 0;
                this.animFrame = 0;
                this.walkTimer = 0;
                this.applySprite(false);

                s.angle = 0;
                this.idleTimer += dt * 4;
                const breath = Math.sin(this.idleTimer) * 0.03;
                s.setScale(this.baseScale * (1 + breath), this.baseScale * (1 - breath));
            }

            if (this.invincibilityTimer > 0) {
                this.invincibilityTimer -= dt;
                if (this.invincibilityTimer <= 0) this.isInvincible = false;
                const pulse = (Math.sin(this.invincibilityTimer * 12) + 1) / 2;
                const goldG = clamp8(190 + 65 * pulse);
                s.setTint(rgb(255, goldG, 0));
                s.setAlpha(1);
            } else if (this.iFrames > 0) {
                this.iFrames -= dt;
                if (Math.floor(this.iFrames * 15) % 2 === 0) { s.setTint(rgb(255, 50, 50)); s.setAlpha(1); }
                else { s.clearTint(); s.setAlpha(150 / 255); }
            } else {
                s.clearTint();
                s.setAlpha(1);
            }
        }

        for (let i = this.ghosts.length - 1; i >= 0; i--) {
            const g = this.ghosts[i];
            g.lifetime -= dt;
            if (g.lifetime <= 0) { g.img.destroy(); this.ghosts.splice(i, 1); continue; }
            g.img.setAlpha(150 / 255 * Math.max(0, g.lifetime / g.maxLifetime));
        }

        if (this.messageTimer > 0) this.messageTimer -= dt;

        if (this.dashPenaltyTimer > 0) {
            this.dashPenaltyTimer -= dt;
            if (this.dashPenaltyTimer <= 0) {
                this.dashPenaltyTimer = 0;
                this.currentSpeedMultiplier = 1.0;
            }
        }

        const halfW = s.displayWidth / 2;
        const halfH = s.displayHeight / 2;
        if (s.x < halfW) s.x = halfW;
        if (s.x > arenaW - halfW) s.x = arenaW - halfW;
        if (s.y < halfH) s.y = halfH;
        if (s.y > arenaH - halfH) s.y = arenaH - halfH;

        if (this.currentCooldown > 0) this.currentCooldown -= dt;

        const sr = this.baseScale * 45;
        this.shadow.setScale(sr / 45, sr / 45);
        this.shadow.x = s.x;
        this.shadow.y = s.y + halfH - sr * 0.4;
    }
}
