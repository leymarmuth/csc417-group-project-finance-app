import { View } from 'react-native';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { Text } from './Text';
import { spacing, useTheme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmSheet({
  visible,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  const theme = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} hideChrome scrollable={false}>
      <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: destructive ? theme.colors.negativeSoft : theme.colors.accentSoft,
          }}
        >
          <Ionicons
            name={destructive ? 'trash-outline' : 'help-circle-outline'}
            size={24}
            color={destructive ? theme.colors.negative : theme.colors.accent}
          />
        </View>
        <Text variant="subheading" align="center">
          {title}
        </Text>
        {description ? (
          <Text variant="body" tone="secondary" align="center">
            {description}
          </Text>
        ) : null}
      </View>
      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <Button
          label={confirmLabel}
          variant={destructive ? 'danger' : 'primary'}
          onPress={() => {
            onConfirm();
            onClose();
          }}
        />
        <Button label={cancelLabel} variant="ghost" onPress={onClose} />
      </View>
    </Sheet>
  );
}
