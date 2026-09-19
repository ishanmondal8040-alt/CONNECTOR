import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { fetchPostsApi, createPostApi, likePostApi } from '../../services/postService';

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPosts = async () => {
    try {
      const response = await fetchPostsApi();
      setPosts(response?.data?.data || response?.data?.posts || response?.data || []);
    } catch (error) {
      console.log('Fetch posts error', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setSelectedImage('data:image/jpeg;base64,' + asset.base64);
      } else if (asset.uri) {
        setSelectedImage(asset.uri);
      }
    }
  };

  const handleCreatePost = async () => {
    const trimmedCaption = text.trim();

    if (!trimmedCaption && !selectedImage) {
      Alert.alert('Error', 'Please enter some text or select an image.');
      return;
    }

    setIsPosting(true);
    try {
      await createPostApi({
        caption: trimmedCaption,
        image: selectedImage || undefined,
      });

      setText('');
      setSelectedImage(null);
      loadPosts();
    } catch (error: any) {
      console.error('Post creation error:', error?.response?.data || error.message);
      Alert.alert('Error', 'Failed to create post. Check console for details.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await likePostApi(postId);
      loadPosts();
    } catch (error) {
      console.log('Like error', error);
    }
  };

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <View style={styles.authorRow}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.author?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <View>
          <Text style={styles.authorName}>{item.author?.name || 'User'}</Text>
          <Text style={styles.postTime}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}
          </Text>
        </View>
      </View>

      {item.caption ? <Text style={styles.postContent}>{item.caption}</Text> : null}

      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.likeBtn} onPress={() => handleLike(item._id || item.id)}>
          <Text style={{ color: '#64748b', fontWeight: 'bold' }}>
            ♥ {item.likes?.length || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.createCard}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          value={text}
          onChangeText={setText}
          multiline
        />

        {selectedImage && (
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        )}

        <View style={styles.createActions}>
          <TouchableOpacity onPress={pickImage} style={styles.imagePickBtn}>
            <Text style={styles.imagePickText}>📷 Add Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.postBtn, isPosting && { opacity: 0.6 }]}
            onPress={handleCreatePost}
            disabled={isPosting}
          >
            {isPosting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#0f172a" />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item, index) => item._id || item.id || String(index)}
          renderItem={renderPost}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadPosts();
              }}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 12 },
  createCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 16 },
  input: { minHeight: 60, fontSize: 14, color: '#0f172a', textAlignVertical: 'top' },
  previewImage: { width: '100%', height: 160, borderRadius: 12, marginVertical: 8 },
  createActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  imagePickBtn: { padding: 8 },
  imagePickText: { color: '#0f172a', fontWeight: '600', fontSize: 13 },
  postBtn: { backgroundColor: '#0f172a', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  postCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarPlaceholder: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  authorName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  postTime: { fontSize: 11, color: '#94a3b8' },
  postContent: { fontSize: 14, color: '#334155', marginBottom: 10, lineHeight: 20 },
  postImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 10 },
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
  likeBtn: { paddingVertical: 4, paddingHorizontal: 10 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
});
