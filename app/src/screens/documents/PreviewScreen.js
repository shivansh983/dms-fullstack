import { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, ActivityIndicator, Alert, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

import StatusBadge from '../../components/documents/StatusBadge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import RoleGate from '../../components/layout/RoleGate';
import useTheme from '../../hooks/useTheme';
import { documentService } from '../../services/documentService';
import { useDocumentStore } from '../../store/documentStore';
import { formatSize, relativeDate, fileIcon } from '../../utils/formatters';
import { DOC_STATUS, ROLES } from '../../constants/enums';
import { radius, spacing, font } from '../../styles/theme';

export default function PreviewScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors } = useTheme();

  const [doc, setDoc] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [working, setWorking] = useState(false);
  const [busyAction, setBusyAction] = useState(null);  

  const toggleFavorite = useDocumentStore((s) => s.toggleFavorite);
  const removeDocument = useDocumentStore((s) => s.removeDocument);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [detail, history] = await Promise.all([
          documentService.getById(id),
          documentService.versions(id),
        ]);
        if (cancelled) return;
        if (!detail) throw new Error('This document no longer exists.');
        setDoc(detail);
        setVersions(history);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  const onToggleFavorite = async () => {
    const next = !doc.isFavorite;
    setDoc((d) => ({ ...d, isFavorite: next }));
    const res = await toggleFavorite(id, next);
    if (!res.ok) setDoc((d) => ({ ...d, isFavorite: !next }));
  };

  const onDecide = async (status) => {
    setWorking(true);
    try {
      const updated = await documentService.setStatus(id, status);
      setDoc(updated);
      useDocumentStore.setState((s) => ({
        documents: s.documents.map((d) => (d.id === id ? { ...d, status } : d)),
      }));
    } catch (e) {
      Alert.alert('Could not update', e.message);
    } finally {
      setWorking(false);
    }
  };

  const onDownload = async () => {
    setBusyAction('download');
    try {
      const uri = await documentService.download(doc);
      Alert.alert('Downloaded', `Saved to app storage as ${doc.name}.`, [
        { text: 'OK' },
        { text: 'Share', onPress: () => shareUri(uri) },
      ]);
    } catch (e) {
      Alert.alert('Download failed', e.message);
    } finally {
      setBusyAction(null);
    }
  };

  const shareUri = async (uri) => {
    if (!(await Sharing.isAvailableAsync())) {
      return Alert.alert('Sharing unavailable', 'This device cannot share files.');
    }
    await Sharing.shareAsync(uri, { mimeType: doc.type, dialogTitle: doc.name });
  };

  const onShare = async () => {
    setBusyAction('share');
    try {
      await shareUri(await documentService.download(doc));
    } catch (e) {
      Alert.alert('Share failed', e.message);
    } finally {
      setBusyAction(null);
    }
  };

  const onDelete = () => {
    Alert.alert('Delete document', `"${doc.name}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeDocument(id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !doc) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't open document"
          message={error}
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

 
  const isImage = doc.type?.startsWith('image') && !!doc.uri;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
    >
      <View style={[styles.hero, { backgroundColor: colors.surface }]}>
        {isImage ? (
          <Image source={{ uri: doc.uri }} style={styles.heroImage} resizeMode="contain" />
        ) : (
          <View style={[styles.heroImage, styles.center, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={fileIcon(doc.type)} size={64} color={colors.primary} />
            <Text style={{ ...font.small, color: colors.textMuted, marginTop: spacing.sm }}>
              Preview available after download
            </Text>
          </View>
        )}
      </View>

      <View style={styles.titleRow}>
        <Text style={{ ...font.h2, color: colors.text, flex: 1 }}>{doc.name}</Text>
        <TouchableOpacity onPress={onToggleFavorite} hitSlop={10}>
          <Ionicons
            name={doc.isFavorite ? 'star' : 'star-outline'}
            size={24}
            color={doc.isFavorite ? colors.warning : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatusBadge status={doc.status} />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <Button
          title="Download"
          variant="outline"
          onPress={onDownload}
          loading={busyAction === 'download'}
          disabled={busyAction !== null}
          style={{ flex: 1 }}
        />
        <Button
          title="Share"
          variant="outline"
          onPress={onShare}
          loading={busyAction === 'share'}
          disabled={busyAction !== null}
          style={{ flex: 1 }}
        />
      </View>

      <Section title="Details" colors={colors}>
        <Row label="Size"     value={formatSize(doc.size)} colors={colors} />
        <Row label="Type"     value={doc.type} colors={colors} />
        <Row label="Owner"    value={doc.ownerName} colors={colors} />
        <Row label="Uploaded" value={relativeDate(doc.createdAt)} colors={colors} />
        <Row label="Version"  value={`v${doc.version}`} colors={colors} />
        {doc.tags?.length ? <Row label="Tags" value={doc.tags.join(', ')} colors={colors} /> : null}
      </Section>

      <Section title="Version history" colors={colors}>
        {versions.map((v) => (
          <Row
            key={v.version}
            label={`v${v.version}`}
            value={`${formatSize(v.size)} · ${relativeDate(v.createdAt)}`}
            colors={colors}
          />
        ))}
      </Section>

      <RoleGate allow={[ROLES.ADMIN]}>
        {doc.status === DOC_STATUS.PENDING ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Button
              title="Approve"
              onPress={() => onDecide(DOC_STATUS.APPROVED)}
              loading={working}
              style={{ flex: 1 }}
            />
            <Button
              title="Reject"
              variant="danger"
              onPress={() => onDecide(DOC_STATUS.REJECTED)}
              loading={working}
              style={{ flex: 1 }}
            />
          </View>
        ) : null}
      </RoleGate>

      <Button title="Delete document" variant="outline" onPress={onDelete} />
    </ScrollView>
  );
}

function Section({ title, children, colors }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{ ...font.h3, color: colors.text, marginBottom: spacing.sm }}>{title}</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md }}>
        {children}
      </View>
    </View>
  );
}

function Row({ label, value, colors }) {
  return (
    <View style={styles.row}>
      <Text style={{ ...font.small, color: colors.textMuted }}>{label}</Text>
      <Text style={{ ...font.small, color: colors.text, flex: 1, textAlign: 'right' }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md },
  heroImage: { width: '100%', height: 240 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.xs },
});
