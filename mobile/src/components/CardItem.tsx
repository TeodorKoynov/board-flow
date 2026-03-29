import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { DependencyBadge } from "./DependencyBadge";
import type { Card, Dependency } from "../types";

interface Props {
  card: Card;
  dependencies: Dependency[];
  onPress: (cardId: string) => void;
  onMove: (cardId: string) => void;
}

export function CardItem({ card, dependencies, onPress, onMove }: Props) {
  const blockerCount = dependencies.filter(
    (d) => d.blocked_card_id === card.id
  ).length;
  const blockingCount = dependencies.filter(
    (d) => d.blocker_card_id === card.id
  ).length;

  const labels: string[] = (() => {
    try {
      return JSON.parse(card.labels);
    } catch {
      return [];
    }
  })();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(card.id)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {card.title}
        </Text>
        <TouchableOpacity
          style={styles.moveButton}
          onPress={(e) => {
            e.stopPropagation?.();
            onMove(card.id);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.moveIcon}>{"⇄"}</Text>
        </TouchableOpacity>
      </View>

      {card.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {card.description}
        </Text>
      ) : null}

      {labels.length > 0 && (
        <View style={styles.labels}>
          {labels.map((label, i) => (
            <View key={i} style={styles.label}>
              <Text style={styles.labelText}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      <DependencyBadge
        blockerCount={blockerCount}
        blockingCount={blockingCount}
      />

      {card.assignee && (
        <View style={styles.footer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {card.assignee[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.assignee}>{card.assignee}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  moveButton: {
    padding: 4,
  },
  moveIcon: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  description: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 16,
  },
  labels: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 8,
  },
  label: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    fontSize: 10,
    color: "#4F46E5",
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  assignee: {
    fontSize: 11,
    color: "#6B7280",
  },
});
