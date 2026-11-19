import Phaser from "phaser";

const SPEED = 180;
const JUMP_VELOCITY = -520;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "courier", 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Keep consistent 32x64 gameplay hitbox aligned to the bottom boot baseline of the 88x96 frame
    this.body.setSize(32, 64);
    this.body.setOffset(28, 32);
    this.body.setCollideWorldBounds(true);

    this.facing = 1;
    this.inputEnabled = true;
    this.isPushing = false;
    this.isHiding = false;
    this.isOnLadder = false;
    this.setDepth(2);

    // Jump buffering and coyote time for responsive platforming
    this.jumpBuffer = 0;
    this.coyoteTimer = 0;

    const kb = scene.input.keyboard;
    this.cursors = kb.createCursorKeys();
    this.keys = kb.addKeys({ left: "A", right: "D", up: "W", down: "S", jump: "SPACE" });
  }

  setInputEnabled(value) {
    this.inputEnabled = value;
    if (!value) {
      this.body.setVelocityX(0);
      if (this.isOnLadder) {
        this.body.setVelocityY(0);
      }
      this.jumpBuffer = 0;
      this.coyoteTimer = 0;
    }
  }

  playAnimationSafe(key) {
    if (this.anims && this.scene.anims.exists(key) && this.anims.currentAnim?.key !== key) {
      this.anims.play(key, true);
    }
  }

  update(time, delta = 16.6) {
    if (this.inputEnabled) {
      const left = this.cursors.left.isDown || this.keys.left.isDown;
      const right = this.cursors.right.isDown || this.keys.right.isDown;
      const up = this.cursors.up.isDown || this.keys.up.isDown;
      const down = this.cursors.down.isDown || this.keys.down.isDown;

      // Check proximity to any environmental ladder
      let nearLadder = null;
      if (this.scene.ladders && this.scene.ladders.length > 0) {
        for (let i = 0; i < this.scene.ladders.length; i++) {
          const lad = this.scene.ladders[i];
          const dx = Math.abs(this.x - lad.x);
          const inYRange = this.y >= lad.yTop - 24 && this.y <= lad.yBottom + 20;
          if (dx < 26 && inYRange) {
            nearLadder = lad;
            break;
          }
        }
      }

      const onGroundOrObject = this.body.blocked.down || this.body.touching.down;

      // Handle climbing ladders
      if (nearLadder && (up || down || (this.isOnLadder && !onGroundOrObject))) {
        this.isOnLadder = true;
        this.body.setAllowGravity(false);
        this.x = Phaser.Math.Linear(this.x, nearLadder.x, 0.15);

        if (up) {
          this.body.setVelocityY(-160);
        } else if (down && this.y < nearLadder.yBottom - 10) {
          this.body.setVelocityY(160);
        } else {
          this.body.setVelocityY(0);
        }

        // Horizontal movement while on ladder
        if (left) {
          this.body.setVelocityX(-SPEED * 0.5);
          this.facing = -1;
        } else if (right) {
          this.body.setVelocityX(SPEED * 0.5);
          this.facing = 1;
        } else {
          this.body.setVelocityX(0);
        }
      } else {
        if (this.isOnLadder) {
          this.isOnLadder = false;
          this.body.setAllowGravity(true);
        }

        if (left === right) {
          this.body.setVelocityX(0);
        } else if (left) {
          this.body.setVelocityX(-SPEED);
          this.facing = -1;
        } else {
          this.body.setVelocityX(SPEED);
          this.facing = 1;
        }
      }

      const jumpPressed =
        Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.keys.up) ||
        Phaser.Input.Keyboard.JustDown(this.keys.jump);

      // Jump off ladder or ground
      if (this.isOnLadder && jumpPressed && (left || right)) {
        this.isOnLadder = false;
        this.body.setAllowGravity(true);
        this.body.setVelocityY(JUMP_VELOCITY * 0.85);
        this.body.setVelocityX(left ? -SPEED : SPEED);
      } else if (!this.isOnLadder) {
        if (jumpPressed) {
          this.jumpBuffer = 140; // 140ms input buffer
        } else if (this.jumpBuffer > 0) {
          this.jumpBuffer -= delta;
        }

        if (onGroundOrObject) {
          this.coyoteTimer = 100; // 100ms coyote grace period
        } else if (this.coyoteTimer > 0) {
          this.coyoteTimer -= delta;
        }

        if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
          this.body.setVelocityY(JUMP_VELOCITY);
          this.jumpBuffer = 0;
          this.coyoteTimer = 0;
        }
      }
    }

    // Update character animation state & horizontal facing flip
    const onGround = this.body.blocked.down || this.body.touching.down;
    if (this.isPushing) {
      this.playAnimationSafe("courier_push");
      if (Math.abs(this.body.velocity.x) > 10) {
        this.scene.soundSystem?.playFootstep(this.scene.time.now);
      }
    } else if (this.isOnLadder) {
      if (Math.abs(this.body.velocity.y) > 10 || Math.abs(this.body.velocity.x) > 10) {
        this.playAnimationSafe("courier_walk");
      } else {
        this.playAnimationSafe("courier_idle");
      }
    } else if (!onGround) {
      this.playAnimationSafe(this.body.velocity.y < -20 ? "courier_jump" : "courier_fall");
    } else if (Math.abs(this.body.velocity.x) > 10) {
      this.playAnimationSafe("courier_walk");
      this.scene.soundSystem?.playFootstep(this.scene.time.now);
    } else {
      this.playAnimationSafe("courier_idle");
    }

    this.setFlipX(this.facing === -1);
  }
}
