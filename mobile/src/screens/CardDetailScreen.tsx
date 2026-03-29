import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useBoardStore } from "../store/boardStore";
import { api } from "../api/client";
import type { RootStackParamList, CardBlocker, CardBlocking } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "CardDetail">;

export function CardDetailScreen({ route, navigation }: Props) {
  const { cardId, boardId } = route.params;
  const { cards, columns, dependencies, updateCard, deleteCard } =
    useBoardStore();

  const card = cards.find((c) => c.id === cardId);
  const column = columns.find((c) => c.id === card?.column_id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState(false);

  const [blockers, setBlockers] = useState<CardBlocker[]>([]);
  const [blocking, setBlocking] = useState<CardBlocking[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(true);

  const [showAddDep, setShowAddDep] = useState(false);
  const [depTargetCardId, setDepTargetCardId] = useState("");

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description);
      setAssignee(card.assignee || "");
    }
  }, [card]);

  const loadDependencies = useCallback(async () => {
    setLoadingDeps(true);
    try {
      const deps = await api.dependencies.get(cardId);
      setBlockers(deps.blockers);
      setBlocking(deps.blocking);
    } catch (err) {
      console.error("Failed to load dependencies:", err);
    }
    setLoadingDeps(false);
  }, [cardId]);

  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCard(cardId, {
        title: title.trim(),
        description: description.trim(),
        assignee: assignee.trim() || null,
      });
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
    setSaving(false);
  };

  const handleDelete = () => {
    Alert.alert("Delete Card", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCard(cardId);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const handleAddBlocker = async () => {
    if (!depTargetCardId.trim()) return;
    try {
      await api.dependencies.create(depTargetCardId.trim(), cardId);
      setDepTargetCardId("");
      setShowAddDep(false);
      await loadDependencies();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    try {
      await api.dependencies.delete(depId);
      await loadDependencies();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  if (!card) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Card not found</Text>
      </View>
    );
  }

  const hasChanges =
    title !== card.title ||
    description !== card.description ||
    (assignee || null) !== (card.assignee || null);

  // Get all other cards on the same board for dependency selection
  const otherCards = cards.filter((c) => c.id !== cardId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.columnBadge}>
        <View
          style={[
            styles.columnDot,
            { backgroundColor: column?.color || "#6B7280" },
          ]}
        />
        <Text style={styles.columnName}>{column?.name || "Unknown"}</Text>
      </View>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Card title"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Add a description..."
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Assignee</Text>
      <TextInput
        style={styles.input}
        value={assignee}
        onChangeText={setAssignee}
        placeholder="Assignee name"
      />

      {hasChanges && (
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Dependencies Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blocked By</Text>
        {loadingDeps ? (
          <ActivityIndicator size="small" color="#6366F1" />
        ) : blockers.length === 0 ? (
          <Text style={styles.emptyDeps}>No blockers</Text>
        ) : (
          blockers.map((b) => (
            <View key={b.dependency_id} style={styles.depItem}>
              <Text style={styles.depTitle}>{b.title}</Text>
              <TouchableOpacity
                onPress={() => handleRemoveDependency(b.dependency_id)}
              >
                <Text style={styles.removeBtn}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blocks</Text>
        {loadingDeps ? (
          <ActivityIndicator size="small" color="#6366F1" />
        ) : blocking.length === 0 ? (
          <Text style={styles.emptyDeps}>Not blocking any cards</Text>
        ) : (
          blocking.map((b) => (
            <View key={b.dependency_id} style={styles.depItem}>
              <Text style={styles.depTitle}>{b.title}</Text>
              <TouchableOpacity
                onPress={() => handleRemoveDependency(b.dependency_id)}
              >
                <Text style={styles.removeBtn}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Add dependency */}
      {showAddDep ? (
        <View style={styles.addDepForm}>
          <Text style={styles.label}>Select a card that blocks this one:</Text>
          <ScrollView style={styles.cardPicker} nestedScrollEnabled>
            {otherCards.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.pickerItem,
                  depTargetCardId === c.id && styles.pickerItemSelected,
                ]}
                onPress={() => setDepTargetCardId(c.id)}
              >
                <Text style={styles.pickerItemText}>{c.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.addDepActions}>
            <TouchableOpacity onPress={() => setShowAddDep(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.addDepBtn,
                !depTargetCardId && styles.btnDisabled,
              ]}
              onPress={handleAddBlocker}
              disabled={!depTargetCardId}
            >
              <Text style={styles.addDepBtnText}>Add Blocker</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addDepTrigger}
          onPress={() => setShowAddDep(true)}
        >
          <Text style={styles.addDepTriggerText}>+ Add Dependency</Text>
        </TouchableOpacity>
      )}

      {/* Meta info */}
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          Created: {new Date(card.created_at).toLocaleString()}
        </Text>
        <Text style={styles.metaText}>
          Updated: {new Date(card.updated_at).toLocaleString()}
        </Text>
        <Text style={styles.metaText}>ID: {card.id}</Text>
      </View>

      {/* Delete */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Delete Card</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFound: {
    fontSize: 16,
    color: "#6B7280",
  },
  columnBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  columnDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  columnName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#111827",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 100,
  },
  saveBtn: {
    backgroundColor: "#6366F1",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptyDeps: {
    fontSize: 13,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  depItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  depTitle: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  removeBtn: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "500",
  },
  addDepTrigger: {
    paddingVertical: 12,
    alignItems: "center",
  },
  addDepTriggerText: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "600",
  },
  addDepForm: {
    marginBottom: 20,
  },
  cardPicker: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerItemSelected: {
    backgroundColor: "#EEF2FF",
  },
  pickerItemText: {
    fontSize: 14,
    color: "#111827",
  },
  addDepActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelText: {
    fontSize: 15,
    color: "#6B7280",
    paddingVertical: 8,
  },
  addDepBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  addDepBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  meta: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  metaText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  deleteBtn: {
    marginTop: 24,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
  },
  deleteBtnText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "600",
  },
});
