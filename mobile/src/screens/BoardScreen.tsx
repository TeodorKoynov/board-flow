import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useBoardStore } from "../store/boardStore";
import { useBoardSync } from "../ws/useBoardSync";
import { Column } from "../components/Column";
import { CardForm } from "../components/CardForm";
import { generatePosition } from "../utils/position";
import { sortByPosition } from "../utils/position";
import type { RootStackParamList } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Board">;

export function BoardScreen({ route, navigation }: Props) {
  const { boardId, boardName } = route.params;
  const {
    columns,
    cards,
    dependencies,
    loadingBoard,
    fetchBoard,
    createCard,
    moveCard,
    getCardsForColumn,
  } = useBoardStore();

  const { connected } = useBoardSync(boardId);

  const [cardFormVisible, setCardFormVisible] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [movingCardId, setMovingCardId] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: boardName,
      headerRight: () => (
        <View style={styles.connectionDot}>
          <View
            style={[
              styles.dot,
              { backgroundColor: connected ? "#10B981" : "#EF4444" },
            ]}
          />
        </View>
      ),
    });
  }, [navigation, boardName, connected]);

  useEffect(() => {
    fetchBoard(boardId);
  }, [boardId]);

  const handleAddCard = useCallback((columnId: string) => {
    setSelectedColumnId(columnId);
    setCardFormVisible(true);
  }, []);

  const handleCreateCard = useCallback(
    async (title: string, description: string) => {
      if (!selectedColumnId) return;
      try {
        await createCard(selectedColumnId, title, description);
        setCardFormVisible(false);
      } catch (err: any) {
        console.error("Failed to create card:", err);
      }
    },
    [selectedColumnId, createCard]
  );

  const handleCardPress = useCallback(
    (cardId: string) => {
      navigation.navigate("CardDetail", { cardId, boardId });
    },
    [navigation, boardId]
  );

  const handleCardMove = useCallback((cardId: string) => {
    setMovingCardId(cardId);
    setMoveModalVisible(true);
  }, []);

  const handleMoveToColumn = useCallback(
    async (targetColumnId: string) => {
      if (!movingCardId) return;

      const targetCards = sortByPosition(
        cards.filter((c) => c.column_id === targetColumnId)
      );
      const lastCard = targetCards[targetCards.length - 1];
      const position = lastCard
        ? generatePosition(lastCard.position, null)
        : "1000";

      try {
        await moveCard(movingCardId, targetColumnId, position);
      } catch (err) {
        console.error("Failed to move card:", err);
        Alert.alert("Error", "Failed to move card. Please try again.");
      } finally {
        setMoveModalVisible(false);
        setMovingCardId(null);
      }
    },
    [movingCardId, cards, moveCard]
  );

  if (loadingBoard) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const selectedColumn = columns.find((c) => c.id === selectedColumnId);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        contentContainerStyle={styles.columnsContainer}
        showsHorizontalScrollIndicator={false}
      >
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            cards={getCardsForColumn(column.id)}
            dependencies={dependencies}
            onCardPress={handleCardPress}
            onCardMove={handleCardMove}
            onAddCard={handleAddCard}
          />
        ))}
      </ScrollView>

      <CardForm
        visible={cardFormVisible}
        columnName={selectedColumn?.name || ""}
        onSubmit={handleCreateCard}
        onClose={() => setCardFormVisible(false)}
      />

      {/* Move card modal */}
      <Modal
        visible={moveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMoveModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.moveOverlay}
          activeOpacity={1}
          onPress={() => setMoveModalVisible(false)}
        >
          <View style={styles.moveContent}>
            <Text style={styles.moveTitle}>Move to Column</Text>
            {columns.map((col) => {
              const movingCard = cards.find((c) => c.id === movingCardId);
              const isCurrent = movingCard?.column_id === col.id;
              return (
                <TouchableOpacity
                  key={col.id}
                  style={[
                    styles.moveOption,
                    isCurrent && styles.moveOptionCurrent,
                  ]}
                  onPress={() => !isCurrent && handleMoveToColumn(col.id)}
                  disabled={isCurrent}
                >
                  <View
                    style={[styles.moveColorDot, { backgroundColor: col.color }]}
                  />
                  <Text
                    style={[
                      styles.moveOptionText,
                      isCurrent && styles.moveOptionTextCurrent,
                    ]}
                  >
                    {col.name}
                    {isCurrent ? " (current)" : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.moveCancelBtn}
              onPress={() => setMoveModalVisible(false)}
            >
              <Text style={styles.moveCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E5E7EB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
  },
  columnsContainer: {
    padding: 12,
    alignItems: "flex-start",
  },
  connectionDot: {
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moveOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  moveContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 320,
  },
  moveTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  moveOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  moveOptionCurrent: {
    backgroundColor: "#F3F4F6",
  },
  moveColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  moveOptionText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  moveOptionTextCurrent: {
    color: "#9CA3AF",
  },
  moveCancelBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  moveCancelText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
});
