import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle, Line, Path, G } from 'react-native-svg';

interface VectorClockIconProps {
  size?: number;
}

export default function VectorClockIcon({ size = 200 }: VectorClockIconProps) {
  return (
    <View style={{ 
      width: size, 
      height: size, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 20 }, 
      shadowOpacity: 0.4, 
      shadowRadius: 25, 
      elevation: 20 
    }}>
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#A8287F" />
            <Stop offset="1" stopColor="#2D083A" />
          </LinearGradient>
          
          <LinearGradient id="shadowGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="rgba(0,0,0,0.5)" />
            <Stop offset="1" stopColor="rgba(0,0,0,0)" />
          </LinearGradient>
        </Defs>

        {/* Main gradient square (with transparent surroundings) */}
        <Rect x="10" y="10" width="180" height="180" rx="45" fill="url(#bgGradient)" />

        {/* Drop shadow under the clock face */}
        <Circle cx="102" cy="102" r="62" fill="url(#shadowGradient)" />

        {/* Clock Face Ring */}
        <Circle cx="100" cy="100" r="60" stroke="#FFFFFF" strokeWidth="10" fill="none" />

        {/* Tick marks */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          // Inner radius for ticks
          const r1 = 45;
          const r2 = 52;
          
          const x1 = 100 + r1 * Math.sin(angle);
          const y1 = 100 - r1 * Math.cos(angle);
          const x2 = 100 + r2 * Math.sin(angle);
          const y2 = 100 - r2 * Math.cos(angle);
          
          return (
            <Line 
              key={i} 
              x1={x1} y1={y1} x2={x2} y2={y2} 
              stroke="#FFFFFF" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
            />
          );
        })}

        {/* Hour Hand (pointing roughly to 10:10 -> Hour hand at ~305 degrees) */}
        <Line 
          x1="100" y1="100" 
          x2="72" y2="82" 
          stroke="#FFFFFF" 
          strokeWidth="8" 
          strokeLinecap="round" 
        />

        {/* Minute Hand (long, sharp, pointing to ~2:00 -> ~60 degrees) */}
        {/* Center is 100,100. Tip is extending past the outer ring (r=60), so length is ~75 */}
        <Path 
          d="M 95 105 L 105 95 L 165 35 Z" 
          fill="#FFFFFF" 
        />

        {/* Center Ring (Hole) - Rendered last so it sits on top of the hands */}
        <Circle cx="100" cy="100" r="10" fill="none" stroke="#FFFFFF" strokeWidth="6" />
      </Svg>
    </View>
  );
}
