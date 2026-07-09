import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface Props {
  onFinished: () => void;
}

export function SplashScreenView({ onFinished }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 400 }),
      withDelay(600, withTiming(0, { duration: 350 }))
    );
    scale.value = withSequence(
      withTiming(1, { duration: 400 }),
      withDelay(600, withTiming(1.05, { duration: 350, }, () => runOnJS(onFinished)()))
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, animatedStyle]}>
        <Image
          source={require("../assets/images/logo.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
});
