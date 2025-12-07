import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import theme from '../theme';

export default function ScreenLayout({ title, children, headerRight, onPressMenu, showHeader = true }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {showHeader && (
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.logoWrapper}>
            <Text style={styles.logoText}>LOGO</Text>
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerRightGroup}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconLabel}>U</Text>
            </TouchableOpacity>
            {onPressMenu ? (
              <TouchableOpacity style={styles.iconButton} onPress={onPressMenu}>
                <Text style={styles.iconLabel}>≡</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.headerBottomRow}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.iconPill}>
              <Text style={styles.iconPillLabel}>W</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconPill}>
              <Text style={styles.iconPillLabel}>N</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconPill}>
              <Text style={styles.iconPillLabel}>F</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      )}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoWrapper: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  logoText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'left',
    flex: 1,
    marginHorizontal: theme.spacing.md,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0FE',
  },
  iconLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerBottomRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#ffffff',
  },
  iconPillLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
});
