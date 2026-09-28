import { Alert, Platform } from "react-native";

/** Yes/no confirmation that also works on web (where RN's Alert buttons are unsupported). */
export function confirmAsync(options: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
}): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(globalThis.confirm?.(`${options.title}\n\n${options.message}`) ?? true);
  }
  return new Promise((resolve) => {
    Alert.alert(
      options.title,
      options.message,
      [
        { text: options.cancelLabel, style: "cancel", onPress: () => resolve(false) },
        { text: options.confirmLabel, style: options.destructive ? "destructive" : "default", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
