/**
 * PlayerSprite
 * Visual representation of a player in the game.
 * Shows a colored circle with a name label above it.
 * Handles visual feedback for taking damage.
 */

export default class PlayerSprite extends Phaser.GameObjects.Container {
  /**
   * Creates a new PlayerSprite
   * @param {Phaser.Scene} scene - The scene this sprite belongs to
   * @param {string} id - Unique player ID
   * @param {string} name - Player's display name
   * @param {number} color - Hex color for the player circle
   */
  constructor(scene, id, name, color = 0xffffff) {
    super(scene, 0, 0);
    
    this.id = id;
    this.hp = 3;
    this.playerName = name;
    this.baseColor = color;
    
    // Smooth interpolation targets for non-choppy movement
    this.targetX = 0;
    this.targetY = 0;
    this.lerpSpeed = 0.3; // Interpolation speed (0-1, higher = faster)

    // Create the player body (circle) - 12px radius = 25% of 50px grid box
    this.body = scene.add.circle(0, 0, 12, color);
    this.body.setStrokeStyle(2, 0xffffff, 0.8); // White outline for visibility
    
    // Create the name label above the player
    this.label = scene.add.text(0, -28, name, { 
      fontSize: "11px", 
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5);
    
    // Add HP hearts above the name
    this.hpText = scene.add.text(0, -40, "❤️❤️❤️", { 
      fontSize: "10px",
    }).setOrigin(0.5);

    // Add all elements to the container
    this.add([this.body, this.label, this.hpText]);
    
    // Add this container to the scene
    scene.add.existing(this);
  }

  /**
   * Sets the target position for smooth interpolation
   * @param {number} x - New x coordinate
   * @param {number} y - New y coordinate
   */
  updatePosition(x, y) {
    this.targetX = x;
    this.targetY = y;
  }
  
  /**
   * Smoothly interpolates to target position (call every frame)
   * Prevents choppy movement when network updates are throttled
   */
  smoothUpdate() {
    // Linear interpolation for smooth movement
    this.x += (this.targetX - this.x) * this.lerpSpeed;
    this.y += (this.targetY - this.y) * this.lerpSpeed;
  }

  /**
   * Updates the player's HP display
   * @param {number} hp - Current health points
   */
  updateHP(hp) {
    const previousHP = this.hp;
    this.hp = hp;
    const hearts = "❤️".repeat(Math.max(0, hp));
    this.hpText.setText(hearts);
    
    // Flash red when taking damage
    if (hp > 0 && hp < 3 && hp < previousHP) {
      this.flash();
    }
    
    // Fade out when dead
    if (hp <= 0 && previousHP > 0) {
      this.fadeOutOnDeath();
    }
  }
  
  /**
   * Fades out the player sprite when they die
   */
  fadeOutOnDeath() {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 1000,
      ease: "Power2",
      onComplete: () => {
        // Keep invisible but don't destroy (state sync handles removal)
        this.visible = false;
      }
    });
  }

  /**
   * Visual feedback when player takes damage
   * Briefly changes color to red, then returns to normal
   */
  flash() {
    this.body.setFillStyle(0xff0000);
    setTimeout(() => {
      if (this.body) {
        this.body.setFillStyle(this.baseColor);
      }
    }, 150);
  }

  /**
   * Shows attack animation with visual punch radius
   */
  showAttacking() {
    const originalScale = this.body.scale;
    
    // Scale up the body
    this.scene.tweens.add({
      targets: this.body,
      scale: originalScale * 1.3,
      duration: 150,
      yoyo: true,
      ease: "Power2",
    });
    
    // Show punch radius indicator (50 pixel radius from server)
    const punchRadius = this.scene.add.circle(0, 0, 50, 0xff0000, 0);
    punchRadius.setStrokeStyle(3, 0xff0000, 0.8);
    this.add(punchRadius);
    
    // Animate the punch radius
    this.scene.tweens.add({
      targets: punchRadius,
      scale: 1.2,
      alpha: 0,
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        punchRadius.destroy();
      }
    });
  }
}

