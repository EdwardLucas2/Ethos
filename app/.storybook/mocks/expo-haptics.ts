// No-op mock — expo-haptics has no web implementation.
// Components using it should already guard with process.env.EXPO_OS === 'ios',
// but this prevents the import from throwing in the Vite/web context.
export const ImpactFeedbackStyle = {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
    Rigid: 'rigid',
    Soft: 'soft',
} as const;

export const NotificationFeedbackType = {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
} as const;

export async function impactAsync(_style?: unknown): Promise<void> {}
export async function notificationAsync(_type?: unknown): Promise<void> {}
export async function selectionAsync(): Promise<void> {}
