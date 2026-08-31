import { BottomTabBar } from '@/components/bottom-tab-bar';
import { TopBar } from '@/components/top-bar';
import { ContactResponse, UserResponse, useGetContacts, useGetUsersMe } from '@/src/api';
import { unwrapData } from '@/src/api/unwrap';
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native';
import { styles } from './friends.styles';

export default function FriendsScreen() {
    const { data: meResponse } = useGetUsersMe();
    const { data: contactsResponse, isLoading, isError } = useGetContacts();
    const me = unwrapData<UserResponse>(meResponse);
    const contacts = unwrapData<ContactResponse[]>(contactsResponse);

    return (
        <View style={styles.flex}>
            <TopBar variant="tab" avatarUri={me?.avatarUrl} />
            {isLoading ? (
                <ActivityIndicator style={styles.content} />
            ) : isError ? (
                <View style={styles.content}>
                    <Text style={styles.emptyText}>
                        Couldn&apos;t load contacts. Try again later.
                    </Text>
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={styles.content}
                    data={contacts}
                    keyExtractor={(item) => item.id ?? item.tag ?? ''}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            You haven&apos;t added any contacts yet. Search by tag to find friends.
                        </Text>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.row} testID="friend-row">
                            {item.avatarUrl ? (
                                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatar} />
                            )}
                            <View>
                                <Text style={styles.name}>{item.displayName}</Text>
                                <Text style={styles.tag}>@{item.tag}</Text>
                            </View>
                        </View>
                    )}
                />
            )}
            <BottomTabBar activeTab="friends" />
        </View>
    );
}
