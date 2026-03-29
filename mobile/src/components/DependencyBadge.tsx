import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  blockerCount: number;
  blockingCount: number;
}

export function DependencyBadge({ blockerCount, blockingCount }: Props) {
  if (blockerCount === 0 && blockingCount === 0) return null;

  return (
    <View style={styles.container}>
      {blockerCount > 0 && (
        <View style={[styles.badge, styles.blockedBadge]}>
          <Text style={styles.badgeText}>
            Blocked by {blockerCount}
          </Text>
        </View>
      )}
      {blockingCount > 0 && (
        <View style={[styles.badge, styles.blockingBadge]}>
          <Text style={styles.badgeText}>
            Blocks {blockingCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  blockedBadge: {
    backgroundColor: "#FEE2E2",
  },
  blockingBadge: {
    backgroundColor: "#FEF3C7",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#374151",
  },
});
