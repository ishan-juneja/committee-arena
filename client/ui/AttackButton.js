/**
 * AttackButton
 * Button for triggering attack action.
 * Positioned in the bottom-right of the screen.
 */

export default class AttackButton {
  /**
   * Creates an attack button
   * @param {Phaser.Scene} scene - The scene to add the button to
   * @param {Function} onAttack - Callback function when button is pressed
   */
  constructor(scene, onAttack) {
    this.scene = scene;
    this.onAttack = onAttack;
    
    const BUTTON_SIZE = 50;
    const BUTTON_X = scene.scale.width - 80;
    const BUTTON_Y = scene.scale.height - 80;
    
    // Create the button background
    this.button = scene.add.circle(BUTTON_X, BUTTON_Y, BUTTON_SIZE, 0xff5555, 0.8);
    this.button.setStrokeStyle(3, 0xffaaaa, 1);
    this.button.setInteractive();
    
    // Add punch icon (fist emoji)
    this.icon = scene.add.text(BUTTON_X, BUTTON_Y, "👊", {
      fontSize: "32px",
    }).setOrigin(0.5);
    
    // Handle button press
    this.button.on("pointerdown", () => {
      // Visual feedback - scale down
      scene.tweens.add({
        targets: [this.button, this.icon],
        scale: 0.85,
        duration: 100,
        yoyo: true,
        ease: "Power2",
      });
      
      // Trigger attack callback
      if (this.onAttack) {
        this.onAttack();
      }
    });
    
    // Hover effect
    this.button.on("pointerover", () => {
      this.button.setFillStyle(0xff7777);
    });
    
    this.button.on("pointerout", () => {
      this.button.setFillStyle(0xff5555);
    });
    
    // Keep UI elements on top
    this.button.setDepth(1000);
    this.icon.setDepth(1001);
  }
}

