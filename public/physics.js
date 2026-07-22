/**
 * Golf Ball Physics Engine
 * Calculates trajectory accounting for:
 * - Initial launch conditions
 * - Magnus effect (spin-induced curve)
 * - Air resistance (drag coefficient)
 * - Gravity
 * - Environmental factors (wind, air density)
 */

class GolfPhysics {
  constructor() {
    this.G = 32.174; // gravity in ft/s^2
    this.golfBallRadius = 0.847 / 12; // inches to feet
    this.golfBallMass = 1.62 / 16; // ounces to pounds / g (assuming 1 oz = 1/16 lb)
  }

  /**
   * Calculate air density based on environmental conditions
   * Uses standard atmosphere model with adjustments for humidity
   */
  calculateAirDensity(temperatureF, humidityPercent, airPressureInHg) {
    const temperatureC = (temperatureF - 32) * 5 / 9;
    const temperatureK = temperatureC + 273.15;
    
    // Convert inHg to Pascals
    const pressurePa = airPressureInHg * 3386.39;
    
    // Saturation vapor pressure (approximation)
    const saturationVaporPressure = 611.2 * Math.exp((17.62 * temperatureC) / (243.12 + temperatureC));
    const vaporPressure = (humidityPercent / 100) * saturationVaporPressure;
    
    // Dry air pressure
    const dryAirPressure = pressurePa - vaporPressure;
    
    // Density calculation using ideal gas law
    // ρ = (P_dry * Md + P_vapor * Mv) / (R * T)
    const Rd = 287.05; // specific gas constant for dry air
    const Rv = 461.495; // specific gas constant for water vapor
    
    const density = (dryAirPressure / (Rd * temperatureK)) + 
                   (vaporPressure / (Rv * temperatureK));
    
    return density; // kg/m^3
  }

  /**
   * Convert mph to m/s
   */
  mphToMps(mph) {
    return mph * 0.44704;
  }

  /**
   * Convert m/s to mph
   */
  mpsToMph(mps) {
    return mps / 0.44704;
  }

  /**
   * Convert meters to yards
   */
  metersToYards(meters) {
    return meters * 1.09361;
  }

  /**
   * Calculate Magnus coefficient (lift coefficient due to spin)
   */
  calculateMagnusCoefficient(spinRpm, velocity) {
    // Simplified Magnus coefficient model
    const spinParameter = (this.golfBallRadius * 2 * Math.PI * spinRpm / 60) / velocity;
    // Magnus coefficient typically ranges from 0 to ~0.1 for golf balls
    return Math.min(spinParameter * 0.15, 0.1);
  }

  /**
   * Calculate drag coefficient
   */
  calculateDragCoefficient(velocity) {
    // Golf ball drag coefficient increases with velocity due to transition from laminar to turbulent flow
    // This is a simplified model
    const reynoldsNumber = velocity * this.golfBallRadius * 2 * 1.225 / 0.00001827; // 1.225 kg/m^3 density, viscosity
    
    if (reynoldsNumber < 100000) {
      return 0.2;
    } else if (reynoldsNumber < 200000) {
      return 0.1 + (reynoldsNumber - 100000) / 100000 * 0.1; // transition region
    } else {
      return 0.2;
    }
  }

  /**
   * Main trajectory simulation
   * Returns array of {x, y, z, time} points along the flight path
   */
  simulateTrajectory({
    verticalLaunchAngle,      // degrees
    horizontalLaunchAngle,    // degrees
    launchVelocity,           // mph
    backspin,                 // rpm
    spinAxis,                 // degrees
    windSpeed,                // mph
    windDirection,            // degrees (0 = into ball, 180 = with ball)
    temperatureF,             // Fahrenheit
    humidity,                 // percent
    airPressure,              // inHg
    timeStep = 0.01           // seconds
  }) {
    // Convert inputs to SI units
    const vLaunch = this.mphToMps(launchVelocity);
    const windSpeedMs = this.mphToMps(windSpeed);
    
    // Convert angles to radians
    const vAngle = verticalLaunchAngle * Math.PI / 180;
    const hAngle = horizontalLaunchAngle * Math.PI / 180;
    const spinAxisRad = spinAxis * Math.PI / 180;
    const windDirRad = windDirection * Math.PI / 180;
    
    // Initial velocity components
    let vx = vLaunch * Math.cos(vAngle) * Math.cos(hAngle);
    let vy = vLaunch * Math.sin(vAngle);
    let vz = vLaunch * Math.cos(vAngle) * Math.sin(hAngle);
    
    // Wind velocity components
    const wVx = windSpeedMs * Math.cos(windDirRad);
    const wVz = windSpeedMs * Math.sin(windDirRad);
    
    // Position
    let x = 0, y = 0, z = 0;
    let time = 0;
    
    const trajectory = [{x: 0, y: 0, z: 0, time: 0}];
    const airDensity = this.calculateAirDensity(temperatureF, humidity, airPressure);
    
    // Simulation loop
    const maxTime = 15; // seconds
    while (time < maxTime && y >= -0.1) { // stop when ball hits ground
      // Current velocity relative to air
      const relVx = vx - wVx;
      const relVy = vy;
      const relVz = vz - wVz;
      const relVelocity = Math.sqrt(relVx*relVx + relVy*relVy + relVz*relVz);
      
      if (relVelocity < 0.1) break; // ball essentially stopped
      
      // Drag force (opposes motion)
      const dragCoeff = this.calculateDragCoefficient(relVelocity);
      const dragForce = 0.5 * airDensity * dragCoeff * Math.PI * this.golfBallRadius * this.golfBallRadius * relVelocity * relVelocity;
      
      // Magnus force (perpendicular to spin axis and velocity)
      const magnusCoeff = this.calculateMagnusCoefficient(backspin, relVelocity);
      const magnusForce = 0.5 * airDensity * magnusCoeff * Math.PI * this.golfBallRadius * this.golfBallRadius * relVelocity * relVelocity;
      
      // Spin vector (axis of rotation)
      const spinVectorX = Math.cos(spinAxisRad);
      const spinVectorZ = Math.sin(spinAxisRad);
      
      // Magnus acceleration (cross product of spin vector and velocity)
      const magnusAccelX = magnusForce * (spinVectorZ * relVy) / this.golfBallMass;
      const magnusAccelY = magnusForce * (spinVectorX * relVz - spinVectorZ * relVx) / this.golfBallMass;
      const magnusAccelZ = magnusForce * (-spinVectorX * relVy) / this.golfBallMass;
      
      // Drag acceleration
      const dragAccelX = -dragForce * relVx / (this.golfBallMass * relVelocity);
      const dragAccelY = -dragForce * relVy / (this.golfBallMass * relVelocity);
      const dragAccelZ = -dragForce * relVz / (this.golfBallMass * relVelocity);
      
      // Total acceleration (including gravity)
      const ax = dragAccelX + magnusAccelX;
      const ay = -this.G + dragAccelY + magnusAccelY;
      const az = dragAccelZ + magnusAccelZ;
      
      // Update velocity
      vx += ax * timeStep;
      vy += ay * timeStep;
      vz += az * timeStep;
      
      // Update position
      x += vx * timeStep;
      y += vy * timeStep;
      z += vz * timeStep;
      
      time += timeStep;
      
      // Record trajectory point (every 0.05s for performance)
      if (trajectory.length % 5 === 0) {
        trajectory.push({
          x: x,
          y: Math.max(y, 0),
          z: z,
          time: time,
          vx: vx,
          vy: vy,
          vz: vz
        });
      }
    }
    
    // Ensure we end at ground level
    if (y < 0) {
      // Interpolate final position
      const lastPoint = trajectory[trajectory.length - 1];
      const ratio = -lastPoint.y / (y - lastPoint.y);
      const finalTime = lastPoint.time + ratio * timeStep;
      trajectory.push({
        x: lastPoint.x + (x - lastPoint.x) * ratio,
        y: 0,
        z: lastPoint.z + (z - lastPoint.z) * ratio,
        time: finalTime,
        vx: vx,
        vy: vy,
        vz: vz
      });
    }
    
    return trajectory;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GolfPhysics;
}
