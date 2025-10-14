/**
 * Joystick
 * Virtual joystick for controlling player movement.
 * Detects touch/mouse input and converts it to a movement vector.
 */

export default class Joystick {
  /**
   * Creates a virtual joystick in the bottom-left of the screen
   * @param {Phaser.Scene} scene - The scene to add the joystick to
   */
  constructor(scene) {
    this.scene = scene;
    this.pointer = null;
    this.startPos = null;
    this.vec = { x: 0, y: 0 };
    
    const JOYSTICK_SIZE = 120;
    const JOYSTICK_X = 80;
    const JOYSTICK_Y = scene.scale.height - 80;
    
    // Create the joystick base (outer circle)
    this.base = scene.add.circle(JOYSTICK_X, JOYSTICK_Y, JOYSTICK_SIZE / 2, 0x333333, 0.3);
    this.base.setStrokeStyle(2, 0x666666, 0.5);
    
    // Create the joystick knob (inner circle)
    this.knob = scene.add.circle(JOYSTICK_X, JOYSTICK_Y, 30, 0x5555ff, 0.7);
    this.knob.setStrokeStyle(2, 0xaaaaff, 0.8);
    
    // Create interactive zone for touch/mouse input
    const zone = scene.add.zone(JOYSTICK_X, JOYSTICK_Y, JOYSTICK_SIZE, JOYSTICK_SIZE)
      .setOrigin(0.5)
      .setInteractive();

    // Handle pointer down (start dragging)
    zone.on("pointerdown", (pointer) => {
      this.pointer = pointer;
      this.startPos = { x: pointer.x, y: pointer.y };
    });

    // Handle pointer move (update joystick direction)
    zone.on("pointermove", (pointer) => {
      if (!this.pointer) return;
      
      const dx = pointer.x - this.startPos.x;
      const dy = pointer.y - this.startPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 40;
      
      // Normalize and clamp the movement vector
      if (distance > 0) {
        const magnitude = Math.min(distance / maxDistance, 1);
        const angle = Math.atan2(dy, dx);
        
        this.vec.x = Math.cos(angle) * magnitude;
        this.vec.y = Math.sin(angle) * magnitude;
        
        // Update knob position
        this.knob.x = JOYSTICK_X + this.vec.x * maxDistance;
        this.knob.y = JOYSTICK_Y + this.vec.y * maxDistance;
      }
    });

    // Handle pointer up (stop dragging)
    zone.on("pointerup", () => {
      this.pointer = null;
      this.vec = { x: 0, y: 0 };
      
      // Reset knob position
      this.knob.x = JOYSTICK_X;
      this.knob.y = JOYSTICK_Y;
    });

    // Keep UI elements on top
    this.base.setDepth(1000);
    this.knob.setDepth(1001);
  }

  /**
   * Gets the current movement vector
   * @returns {{x: number, y: number}} Normalized movement vector
   */
  getVector() {
    return this.vec;
  }
}

