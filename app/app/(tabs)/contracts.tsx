import { BottomTabBar } from '@/components/bottom-tab-bar';
import { TopBar } from '@/components/top-bar';
import { ContractSummaryResponse, UserResponse, useGetContractsMe, useGetUsersMe } from '@/src/api';
import { unwrapData } from '@/src/api/unwrap';
import { Href, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { styles } from './contracts.styles';

// Contract overview screens (active/unsettled/settled) aren't built yet — the
// path is cast since Expo Router's typed routes can't know about a route that
// doesn't exist on disk.
function overviewPath(contractId: string, cycleNumber: number, status: string): Href {
    const suffix =
        status === 'settled' ? 'settled' : status === 'pending_resolution' ? 'unsettled' : 'active';
    return `/contract/${contractId}/${cycleNumber}/${suffix}` as Href;
}

export default function ContractsScreen() {
    const router = useRouter();
    const { data: meResponse } = useGetUsersMe();
    const { data: contractsResponse, isLoading, isError } = useGetContractsMe();
    const me = unwrapData<UserResponse>(meResponse);
    const contracts = unwrapData<ContractSummaryResponse[]>(contractsResponse);

    return (
        <View style={styles.flex}>
            <TopBar variant="tab" avatarUri={me?.avatarUrl} />
            {isLoading ? (
                <ActivityIndicator style={styles.content} />
            ) : isError ? (
                <View style={styles.content}>
                    <Text style={styles.emptyText}>
                        Couldn&apos;t load contracts. Try again later.
                    </Text>
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={styles.content}
                    data={contracts}
                    keyExtractor={(item) => item.contractId ?? ''}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            No contracts yet. Challenge your friends!
                        </Text>
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            testID="contract-row"
                            style={styles.row}
                            onPress={() =>
                                item.contractId &&
                                item.cycleNumber !== undefined &&
                                item.status &&
                                router.push(
                                    overviewPath(item.contractId, item.cycleNumber, item.status)
                                )
                            }
                        >
                            <View style={styles.rowTop}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.status}>{item.status?.replace('_', ' ')}</Text>
                            </View>
                            <Text style={styles.opponents}>
                                vs {item.opponentNames?.join(', ')}
                            </Text>
                        </Pressable>
                    )}
                />
            )}
            <BottomTabBar activeTab="contracts" />
        </View>
    );
}
