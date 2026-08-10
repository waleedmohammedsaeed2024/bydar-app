import { forwardRef } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { Press } from '@/constants/theme';

type TapProps = PressableProps & {
  /** Skip the scale part of the press feedback (backdrops, full-width rows). */
  noScale?: boolean;
};

/**
 * Pressable with the app's uniform press feedback: a quick dim plus a barely
 * perceptible shrink. Flat surfaces have no shadow to lift, so the press state
 * is what makes a control feel tappable — use this instead of raw Pressable.
 */
export const Tap = forwardRef<View, TapProps>(function Tap(
  { style, noScale, ...rest }, ref,
) {
  return (
    <Pressable
      ref={ref}
      style={(state) => {
        const base = (typeof style === 'function' ? style(state) : style) as StyleProp<ViewStyle>;
        if (!state.pressed) return base;
        return [
          base,
          {
            opacity: Press.opacity,
            transform: noScale ? [] : [{ scale: Press.scale }],
          },
        ];
      }}
      {...rest}
    />
  );
});
