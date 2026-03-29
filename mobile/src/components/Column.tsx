import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { CardItem } from "./CardItem";
import type { Card, Column as ColumnType, Dependency } from "../types";

interface Props {
  column: ColumnType;
  cards: Card[];
  dependencies: Dependency[];
  onCardPress: (cardId: string) => void;
  onCardMove: (cardId: string) => void;
  onAddCard: (columnId: string) => void;
}

export function Column({
  column,
  cards,
  dependencies,
  onCardPress,
  onCardMove,
  onAddCard,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderTopColor: column.color }]}>
        <Text style={styles.headerText}>{column.name}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{cards.length}</Text>
        </View>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardItem
            card={item}
            dependencies={dependencies}
            onPress={onCardPress}
            onMove={onCardMove}
          />
        )}
        style={styles.cardList}
        contentContainerStyle={styles.cardListContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => onAddCard(column.id)}
      >
        <Text style={styles.addButtonText}>+ Add Card</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginRight: 12,
    maxHeight: "100%",
    borderTopWidth: 3,
    borderTopColor: "#6B7280",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  cardList: {
    flex: 1,
  },
  cardListContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  addButton: {
    padding: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  addButtonText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
});
