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

    // Create the player body (circle)
    this.body = scene.add.circle(0, 0, 20, color);
    
    // Create the name label above the player
    this.label = scene.add.text(0, -35, name, { 
      fontSize: "14px", 
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);
    
    // Add HP hearts below the name
    this.hpText = scene.add.text(0, -50, "❤️❤️❤️", { 
      fontSize: "12px",
    }).setOrigin(0.5);

    // Add all elements to the container
    this.add([this.body, this.label, this.hpText]);
    
    // Add this container to the scene
    scene.add.existing(this);
  }

  /**
   * Updates the player's position on screen
   * @param {number} x - New x coordinate
   * @param {number} y - New y coordinate
   */
  updatePosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Updates the player's HP display
   * @param {number} hp - Current health points
   */
  updateHP(hp) {
    this.hp = hp;
    const hearts = "❤️".repeat(Math.max(0, hp));
    this.hpText.setText(hearts);
    
    // Flash red when taking damage
    if (hp > 0 && hp < 3) {
      this.flash();
    }
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
   * Shows attack animation
   */
  showAttacking() {
    const originalScale = this.body.scale;
    this.scene.tweens.add({
      targets: this.body,
      scale: originalScale * 1.3,
      duration: 150,
      yoyo: true,
      ease: "Power2",
    });
  }
}

