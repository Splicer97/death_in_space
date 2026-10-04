import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { colors } from '../theme';

// Интенсивность фона. Подкрутите эти числа, если звёзды слишком заметны или незаметны.
const STAR_COUNT = 58;
const GLOW_STEPS = 12;
const FRACTAL_LEVEL = 3;

type Star = {
  left: number;
  top: number;
  size: number;
  opacity: number;
  halo: number;
  tint: string;
};

// Детерминированный генератор: одна и та же карта звёзд при каждом запуске.
function random(seed: number): () => number {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

const TINTS = [
  colors.text,
  colors.text,
  colors.text,
  colors.violet,
  colors.blue,
];

function makeStars(seed: number, count: number, scale: number): Star[] {
  const next = random(seed);
  return Array.from({ length: count }, () => {
    const size = (0.8 + next() * 1.7) * scale;
    const bright = next();
    return {
      left: next() * 100,
      top: next() * 100,
      size,
      opacity: 0.12 + bright * 0.46,
      halo: bright > 0.82 ? size * 4.2 : 0,
      tint: TINTS[Math.floor(next() * TINTS.length)],
    };
  });
}

function Stars({ stars }: { stars: Star[] }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.layer}
    >
      {stars.map((star, index) => (
        <View
          key={index}
          style={[
            styles.star,
            {
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              borderRadius: star.size,
              backgroundColor: star.tint,
              opacity: star.opacity,
            },
          ]}
        >
          {star.halo > 0 ? (
            <View
              style={[
                styles.halo,
                {
                  left: -star.halo / 2,
                  top: -star.halo / 2,
                  width: star.halo,
                  height: star.halo,
                  borderRadius: star.halo,
                  backgroundColor: star.tint,
                },
              ]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function Glow({
  size,
  tint,
  strength,
  left,
  top,
}: {
  size: number;
  tint: string;
  strength: number;
  left: number;
  top: number;
}) {
  const rings = useMemo(
    () =>
      Array.from({ length: GLOW_STEPS }, (_, index) => {
        const step = (index + 1) / GLOW_STEPS;
        return {
          diameter: size * step,
          opacity: strength * (1 - step) ** 1.5,
        };
      }),
    [size, strength],
  );

  return (
    <View pointerEvents="none" style={[styles.glow, { left, top }]}>
      {rings.map((ring, index) => (
        <View
          key={index}
          style={[
            styles.ring,
            {
              width: ring.diameter,
              height: ring.diameter,
              borderRadius: ring.diameter,
              backgroundColor: tint,
              opacity: ring.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

function FractalBranch({
  size,
  level,
  tint,
}: {
  size: number;
  level: number;
  tint: string;
}) {
  if (level <= 0) {
    return null;
  }
  const half = size / 2;
  const quarter = size / 4;
  const placements = [
    [{ rotate: '60deg' }, { translateX: quarter }, { translateY: -quarter }],
    [{ rotate: '-60deg' }, { translateX: quarter }, { translateY: quarter }],
    [{ translateY: half }],
  ];

  return (
    <>
      {placements.map((transform, index) => (
        <View
          key={index}
          pointerEvents="none"
          style={[styles.branch, { width: size, height: size, transform }]}
        >
          <View
            style={{
              width: half,
              height: half,
              backgroundColor: tint,
              borderRadius: half * 0.07,
            }}
          />
          <FractalBranch size={half} level={level - 1} tint={tint} />
        </View>
      ))}
    </>
  );
}

function VoidFractal({
  size,
  level,
  tint,
}: {
  size: number;
  level: number;
  tint: string;
}) {
  return (
    <View
      pointerEvents="none"
      style={[styles.fractal, { width: size, height: size }]}
    >
      <View
        style={{ width: size, height: size, transform: [{ rotate: '12deg' }] }}
      >
        <FractalBranch size={size} level={level} tint={tint} />
      </View>
    </View>
  );
}

export function Starfield() {
  const { width, height } = useWindowDimensions();
  const far = useMemo(
    () => makeStars(7, Math.round(STAR_COUNT * 0.64), 0.8),
    [],
  );
  const near = useMemo(
    () => makeStars(31, Math.round(STAR_COUNT * 0.36), 1.3),
    [],
  );

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.field}
    >
      <Glow
        size={Math.min(width * 1.5, 620)}
        tint={colors.violet}
        strength={0.2}
        left={-width * 0.55}
        top={-height * 0.08}
      />
      <Glow
        size={Math.min(width * 1.3, 520)}
        tint={colors.blue}
        strength={0.14}
        left={width * 0.55}
        top={height * 0.28}
      />
      <Glow
        size={Math.min(width, 420)}
        tint={colors.yellow}
        strength={0.07}
        left={-width * 0.4}
        top={height * 0.86}
      />
      <View
        style={[
          styles.fractalGhost,
          {
            width: Math.min(width, 420),
            height: Math.min(width, 420),
            left: width - Math.min(width, 420) * 0.55,
            top: height * 0.72,
          },
        ]}
      >
        <VoidFractal
          size={Math.min(width, 420)}
          level={FRACTAL_LEVEL}
          tint={colors.violet}
        />
      </View>
      <Stars stars={far} />
      <Stars stars={near} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  star: {
    position: 'absolute',
  },
  halo: {
    position: 'absolute',
    opacity: 0.12,
  },
  glow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  fractal: {
    position: 'absolute',
  },
  fractalGhost: {
    position: 'absolute',
    opacity: 0.06,
  },
  branch: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
