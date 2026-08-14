import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import useTheme from '../../hooks/useTheme';
import { radius, spacing } from '../../styles/theme';

function Shimmer({ width, height, style }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,    duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, opacity, backgroundColor: colors.border, borderRadius: radius.sm }, style]}
    />
  );
}

export function DocumentSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Shimmer width={44} height={44} style={{ borderRadius: radius.md }} />
      <View style={{ flex: 1, marginLeft: spacing.md, gap: spacing.xs }}>
        <Shimmer width="70%" height={14} />
        <Shimmer width="40%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 6 }) {
  return <View>{Array.from({ length: count }).map((_, i) => <DocumentSkeleton key={i} />)}</View>;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
});