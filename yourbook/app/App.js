import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const API_URL = "http://localhost:3000/api";

export default function App() {
  return (
    <SafeAreaProvider>
      <Book />
    </SafeAreaProvider>
  );
}

function Book() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", author: "" });

  const load = useCallback(async () => {
    const res = await fetch(`${API_URL}/posts`);
    setPosts(await res.json());
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const like = async (post) => {
    const res = await fetch(`${API_URL}/posts/${post.id}/like`, { method: "POST" });
    const updated = await res.json();
    setPosts((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
    setSelected((s) => (s && s.id === updated.id ? updated : s));
  };

  const submit = async () => {
    if (!form.title.trim() || !form.author.trim()) return;
    await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", content: "", author: "" });
    setComposing(false);
    onRefresh();
  };

  const renderCard = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.card, { marginTop: index < 2 ? 8 : 0 }]}
      onPress={() => setSelected(item)}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.author}>{item.author}</Text>
        <TouchableOpacity onPress={() => like(item)}>
          <Text style={styles.likes}>❤️ {item.likes}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#ff2442" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.logo}>
            your<Text style={{ color: "#ff2442" }}>book</Text>
          </Text>
          <TouchableOpacity style={styles.newBtn} onPress={() => setComposing(true)}>
            <Text style={styles.newBtnText}>＋ 發布</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>還沒有貼文，快來發布第一篇吧！</Text>}
        />

        <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
          {selected && (
            <SafeAreaView style={styles.container}>
              <ScrollView>
                <Image source={{ uri: selected.image }} style={styles.detailImage} />
                <View style={styles.detailBody}>
                  <Text style={styles.detailTitle}>{selected.title}</Text>
                  <Text style={styles.detailContent}>{selected.content}</Text>
                  <View style={styles.tagRow}>
                    {selected.tags.map((t) => (
                      <Text key={t} style={styles.tag}>
                        #{t}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.detailFooter}>
                    <Text style={styles.author}>👤 {selected.author}</Text>
                    <TouchableOpacity style={styles.likeBtn} onPress={() => like(selected)}>
                      <Text style={styles.likeBtnText}>❤️ {selected.likes}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                <Text style={styles.closeText}>✕ 關閉</Text>
              </TouchableOpacity>
            </SafeAreaView>
          )}
        </Modal>

        <Modal visible={composing} animationType="slide" onRequestClose={() => setComposing(false)}>
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setComposing(false)}>
                <Text style={styles.closeText}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.logo}>發布筆記</Text>
              <TouchableOpacity onPress={submit}>
                <Text style={{ color: "#ff2442", fontWeight: "700" }}>發布</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16, gap: 12 }}>
              <TextInput
                style={styles.input}
                placeholder="標題"
                value={form.title}
                onChangeText={(t) => setForm({ ...form, title: t })}
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="分享你的精彩瞬間..."
                multiline
                value={form.content}
                onChangeText={(t) => setForm({ ...form, content: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="你的暱稱"
                value={form.author}
                onChangeText={(t) => setForm({ ...form, author: t })}
              />
            </View>
          </SafeAreaView>
        </Modal>

        {PlatformBanner}
      </SafeAreaView>
  );
}

const PlatformBanner = null;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  logo: { fontSize: 22, fontWeight: "800", letterSpacing: 0.5 },
  newBtn: {
    backgroundColor: "#ff2442",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  newBtnText: { color: "#fff", fontWeight: "700" },
  list: { paddingHorizontal: 6, paddingBottom: 24 },
  column: { gap: 6 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 3,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardImage: { width: "100%", height: 170, backgroundColor: "#f3f3f3" },
  cardTitle: { fontSize: 14, fontWeight: "600", paddingHorizontal: 10, paddingTop: 8, minHeight: 40 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  author: { color: "#888", fontSize: 12 },
  likes: { fontSize: 12, color: "#ff2442" },
  empty: { textAlign: "center", marginTop: 60, color: "#999" },
  detailImage: { width: "100%", height: 320, backgroundColor: "#f3f3f3" },
  detailBody: { padding: 16, gap: 12 },
  detailTitle: { fontSize: 20, fontWeight: "800" },
  detailContent: { fontSize: 15, lineHeight: 24, color: "#333" },
  tagRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  tag: { color: "#ff2442", fontSize: 13 },
  detailFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  likeBtn: {
    backgroundColor: "#ffeef0",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  likeBtnText: { color: "#ff2442", fontWeight: "700" },
  closeBtn: { padding: 14, alignItems: "center" },
  closeText: { color: "#ff2442", fontSize: 16, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  textarea: { height: 140, textAlignVertical: "top" },
});
