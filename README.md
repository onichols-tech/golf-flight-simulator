# Golf Flight Simulator

A comprehensive golf ball flight simulation system with physics engine, interactive UI, and 3D animation.

## Features

### Physics Engine
- **Realistic Trajectory Calculation**: Implements Magnus effect, drag coefficient, and gravity
- **Environmental Factors**: Wind speed/direction, air pressure, humidity, and temperature affect flight
- **Spin Physics**: Backspin and spin axis calculations for ball curve
- **Air Density Model**: Accounts for altitude, temperature, and humidity

### Launch Parameters
- Vertical Launch Angle (0-90°)
- Horizontal Launch Angle (-45 to 45°)
- Launch Velocity (0-200 mph)
- Backspin (0-10,000 rpm)
- Spin Axis (-90 to 90°)

### Environmental Factors
- Wind Speed (-50 to 50 mph)
- Wind Direction (0-360°)
- Temperature (-50 to 120°F)
- Humidity (0-100%)
- Air Pressure (28-31 inHg)

### Results Tracking
Each simulation records:
- **Carry Distance**: Distance to landing point (yards)
- **Total Distance**: Total distance traveled (yards)
- **Hang Time**: Time ball is in air (seconds)
- **Max Height**: Peak altitude reached (yards)
- **Off Center**: Lateral deviation from expected path (yards)
- **Landing Angle**: Angle at which ball lands (degrees)

### Visualization
- 3D golf course visualization with Three.js
- Distance markers at 50, 100, 150, 200, 250, 300 yards
- Real-time trajectory animation
- Ball flight path displayed with transparency gradient
- Landing position marker
- Dynamic camera following during animation

### Shot History
- Records all shots with timestamp
- Shows parameters and results for each shot
- Compare multiple shots
- Easy reference for analysis

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

Then navigate to `http://localhost:3000` in your browser.

## Usage

1. **Set Launch Parameters**: Input values from your launch monitor
   - Vertical Launch Angle
   - Horizontal Launch Angle
   - Launch Velocity
   - Backspin
   - Spin Axis

2. **Set Environmental Factors**: Input conditions from weather device
   - Wind Speed and Direction
   - Temperature
   - Humidity
   - Air Pressure

3. **Run Simulation**:
   - Click "Simulate & Animate" to see animation
   - Click "Simulate Only" for quick results without animation

4. **Review Results**: All metrics displayed immediately

5. **Modify Parameters**: Change any input and simulate again

6. **Compare Shots**: View entire shot history with parameters and results

## Physics Model

### Air Density Calculation
Air density affects both drag and Magnus forces. Calculated using:
- Saturation vapor pressure model
- Ideal gas law with humidity adjustment
- Accounts for temperature, pressure, and humidity

### Drag Force
- Variable drag coefficient based on Reynolds number
- Transition from laminar to turbulent flow
- Opposes ball motion

### Magnus Force
- Perpendicular to both spin axis and velocity
- Spin-dependent lift coefficient
- Creates ball curve effect

### Integration
- Euler method for numerical integration
- 0.01 second time steps
- Adaptive trajectory recording

## Architecture

- **physics.js**: Core physics engine with trajectory calculation
- **simulator.js**: Shot simulation manager and metrics calculator
- **ui.js**: 3D visualization with Three.js
- **app.js**: Main application controller and event handling
- **index.html**: UI layout and controls
- **styles.css**: Responsive styling

## Technical Details

### Coordinate System
- X-axis: Down the fairway
- Y-axis: Vertical (height)
- Z-axis: Lateral (left/right)
- Origin at tee

### Physics Constants
- Gravity: 32.174 ft/s²
- Golf ball radius: 0.847 inches
- Golf ball mass: 1.62 ounces

### Performance Optimization
- Trajectory recording at regular intervals
- 3D visualization with efficient mesh generation
- Animation frame updates
- Responsive canvas resizing

## Future Enhancements

- Terrain elevation changes
- Rough/hazard modeling
- Multiple ball types
- Club selection presets
- Data export to CSV/JSON
- Comparison view for multiple shots
- Atmospheric pressure wave effects
- Ball degradation over flight
- Spin rate decay model

## License

MIT
