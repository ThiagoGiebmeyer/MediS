/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#fff";
const tintColorDark = "#38E0A8";

const backgroundColorLight = "#E3FEF7";
const backgroundColorDark = "#2E2E2E";

const textColorLight = "#000";
const textColorDark = "#FFFFFF";

export const Colors = {
  light: {
    text: textColorLight,
    textInvert: textColorDark,
    background: backgroundColorLight,
    backgroundInvert: backgroundColorDark,
    tint: tintColorLight,
    icon: tintColorLight,
    focusedIcon: "#FFFFFF",
    complementary: "#e03870",
    tonalColor: "#38E0A8",
    drawer: {
      background: "#424242",
    },
  },
  dark: {
    text: textColorDark,
    textInvert: textColorLight,
    background: backgroundColorDark,
    backgroundInvert: backgroundColorLight,
    tint: tintColorDark,
    icon: tintColorDark,
    focusedIcon: "#FFFFFF",
    complementary: "#e03870",
    tonalColor: "#38E0A8",
    drawer: {
      background: "#424242",
    },
  },
};
