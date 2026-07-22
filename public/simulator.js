/**
 * Golf Shot Simulator
 * Manages simulation results and calculations
 */

class GolfSimulator {
  constructor() {
    this.physics = new GolfPhysics();
    this.lastShot = null;
    this.shotHistory = [];
  }

  /**
   * Run simulation and calculate all metrics
   */
  simulate(parameters) {
    const trajectory = this.physics.simulateTrajectory(parameters);
    
    if (trajectory.length < 2) {
      return null;
    }

    const results = this.calculateMetrics(trajectory, parameters);
    
    // Store in history
    this.lastShot = {
      parameters,
      results,
      trajectory,
      timestamp: new Date()
    };
    
    this.shotHistory.push(this.lastShot);
    
    return results;
  }

  /**
   * Calculate all shot metrics from trajectory
   */
  calculateMetrics(trajectory, parameters) {
    const finalPoint = trajectory[trajectory.length - 1];
    
    // Carry distance (in yards)
    const carryDistanceMeters = Math.sqrt(
      finalPoint.x * finalPoint.x + 
      finalPoint.z * finalPoint.z
    );
    const carryDistance = this.physics.metersToYards(carryDistanceMeters);
    
    // Horizontal distance
    const horizontalDistance = Math.sqrt(
      finalPoint.x * finalPoint.x + 
      finalPoint.z * finalPoint.z
    );
    
    // Hang time
    const hangTime = finalPoint.time;
    
    // Max height
    let maxHeight = 0;
    let maxHeightTime = 0;
    trajectory.forEach(point => {
      if (point.y > maxHeight) {
        maxHeight = point.y;
        maxHeightTime = point.time;
      }
    });
    const maxHeightYards = this.physics.metersToYards(maxHeight);
    
    // Off-center (lateral deviation)
    const launchAngleRad = parameters.horizontalLaunchAngle * Math.PI / 180;
    const expectedX = carryDistanceMeters * Math.cos(launchAngleRad);
    const expectedZ = carryDistanceMeters * Math.sin(launchAngleRad);
    
    const actualX = finalPoint.x;
    const actualZ = finalPoint.z;
    
    const offCenterMeters = Math.sqrt(
      (actualX - expectedX) * (actualX - expectedX) + 
      (actualZ - expectedZ) * (actualZ - expectedZ)
    );
    const offCenter = this.physics.metersToYards(offCenterMeters);
    
    // Landing angle
    const landingVelocityMagnitude = Math.sqrt(
      finalPoint.vx * finalPoint.vx + 
      finalPoint.vy * finalPoint.vy + 
      finalPoint.vz * finalPoint.vz
    );
    const landingAngle = Math.asin(-finalPoint.vy / landingVelocityMagnitude) * 180 / Math.PI;
    
    return {
      carryDistance: carryDistance.toFixed(2),
      totalDistance: carryDistance.toFixed(2), // Same as carry for now
      hangTime: hangTime.toFixed(2),
      maxHeight: maxHeightYards.toFixed(2),
      offCenter: offCenter.toFixed(2),
      landingAngle: landingAngle.toFixed(2),
      trajectory: trajectory
    };
  }

  /**
   * Get all recorded shots
   */
  getHistory() {
    return this.shotHistory;
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.shotHistory = [];
    this.lastShot = null;
  }

  /**
   * Export shot data
   */
  exportShot(shotIndex) {
    if (shotIndex < 0 || shotIndex >= this.shotHistory.length) {
      return null;
    }
    return JSON.stringify(this.shotHistory[shotIndex], null, 2);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GolfSimulator;
}
