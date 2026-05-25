// No-op mock — expo-haptics has no web implementation.
// Components using it should already guard with process.env.EXPO_OS === 'ios',
// but this prevents the import from throwing in the Vite/web context.
export const ImpactFeedbackStyle = {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
} as const;

export const NotificationFeedbackType = {
    Success: 'Success',
    Warning: 'Warning',
    Error: 'Error',
} as const;

export async function impactAsync(_style?: unknown): Promise<void> {}
export async function notificationAsync(_type?: unknown): Promise<void> {}
export async function selectionAsync(): Promise<void> {}
