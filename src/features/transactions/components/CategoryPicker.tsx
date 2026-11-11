import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { CategoryIcon } from '../../../components/finance/CategoryIcon';
import { Text } from '../../../components/ui/Text';
import { haptics } from '../../../lib/haptics';
import { radius, spacing, useTheme } from '../../../theme';
import type { Category } from '../../../types/models';

/** Grid selector for categories — 4 columns, tinted selection state. */
export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId?: string;
  onSelect: (category: Category) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {categories.map((category, index) => {
        const selected = category.id === selectedId;
        return (
          <Animated.View
            key={category.id}
            entering={FadeIn.delay(Math.min(index * 18, 260)).duration(240)}
            style={styles.cell}
          >
            <Pressable
              onPress={() => {
                haptics.select();
                onSelect(category);
              }}
              style={[
                styles.inner,
                {
                  borderColor: selected ? category.color : theme.colors.hairline,
                  backgroundColor: selected ? `${category.color}1F` : theme.colors.surfaceSunken,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <CategoryIcon icon={category.icon} color={category.color} size={34} />
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 10,
                  lineHeight: 13,
                  minHeight: 26,
                  letterSpacing: -0.2,
                  textAlign: 'center',
                  color: selected ? theme.colors.text : theme.colors.textSecondary,
                }}
              >
                {category.name}
              </Text>
              {selected ? (
                <View style={[styles.check, { backgroundColor: category.color }]}>
                  <Ionicons name="checkmark" size={10} color="#0B0D12" />
                </View>
              ) : null}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  cell: { width: '25%', paddingHorizontal: spacing.xs, marginBottom: spacing.sm },
  inner: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: 3,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    position: 'relative',
  },
  check: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
