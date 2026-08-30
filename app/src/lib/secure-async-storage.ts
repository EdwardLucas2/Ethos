// Backs @react-native-async-storage/async-storage's minimal API (the only
// surface supertokens-react-native actually calls: getItem/setItem/removeItem)
// with expo-secure-store, so auth tokens land in the OS keychain/keystore
// instead of plaintext AsyncStorage.
//
// supertokens-react-native (5.1.5) hardcodes an AsyncStorage import with no
// pluggable storage option in its public config, so this is aliased in via
// metro.config.js's resolver rather than passed as an init option. Nothing
// else in this app imports @react-native-async-storage/async-storage
// directly — it isn't even a direct dependency, only a transitive one of
// supertokens-react-native — so this redirect is scoped to auth tokens only.
import * as SecureStore from 'expo-secure-store';

async function getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
}

export default { getItem, setItem, removeItem };
