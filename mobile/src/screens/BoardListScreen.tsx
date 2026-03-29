import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useBoardStore } from "../store/boardStore";
import type { RootStackParamList } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "BoardList">;

export function BoardListScreen({ navigation }: Props) {
  const { boards, loadingBoards, fetchBoards, createBoard, deleteBoard } =
    useBoardStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreate = async () => {
    if (!newBoardName.trim()) return;
    try {
      await createBoard(newBoardName.trim());
      setNewBoardName("");
      setShowCreate(false);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDelete = (boardId: string, boardName: string) => {
    Alert.alert("Delete Board", `Delete "${boardName}" and all its cards?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteBoard(boardId).catch((e: any) => Alert.alert("Error", e.message)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {loadingBoards && boards.length === 0 ? (
        <ActivityIndicator style={styles.loader} size="large" color="#6366F1" />
      ) : (
        <FlatList
          data={boards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.boardCard}
              onPress={() =>
                navigation.navigate("Board", {
                  boardId: item.id,
                  boardName: item.name,
                })
              }
              onLongPress={() => handleDelete(item.id, item.name)}
            >
              <View style={styles.boardInfo}>
                <Text style={styles.boardName}>{item.name}</Text>
                <Text style={styles.boardDate}>
                  Created {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.arrow}>{">"}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No boards yet. Create one to get started.
            </Text>
          }
          refreshing={loadingBoards}
          onRefresh={fetchBoards}
        />
      )}

      {showCreate ? (
        <View style={styles.createForm}>
          <TextInput
            style={styles.createInput}
            value={newBoardName}
            onChangeText={setNewBoardName}
            placeholder="Board name"
            autoFocus
            onSubmitEditing={handleCreate}
          />
          <View style={styles.createActions}>
            <TouchableOpacity
              onPress={() => {
                setShowCreate(false);
                setNewBoardName("");
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleCreate}
              disabled={!newBoardName.trim()}
            >
              <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreate(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loader: {
    marginTop: 60,
  },
  list: {
    padding: 16,
  },
  boardCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  boardInfo: {
    flex: 1,
  },
  boardName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  boardDate: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },
  arrow: {
    fontSize: 18,
    color: "#D1D5DB",
    fontWeight: "300",
  },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 15,
    marginTop: 40,
  },
  createForm: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  createInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  createActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelText: {
    fontSize: 15,
    color: "#6B7280",
    paddingVertical: 8,
  },
  createBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createBtnText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "300",
    marginTop: -2,
  },
});
