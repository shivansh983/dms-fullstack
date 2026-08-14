import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import useTheme from '../../hooks/useTheme';
import { documentService } from '../../services/documentService';
import { radius, spacing, font } from '../../styles/theme';

function extractDocumentId(raw = '') {
  const value = raw.trim();
  const link = value.match(/document\/([A-Za-z0-9_-]+)/);
  if (link) return link[1];
  if (/^[A-Za-z0-9_-]+$/.test(value)) return value;
  return null;
}

export default function ScanQRScreen({ navigation }) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const [handling, setHandling] = useState(false);
  const [message, setMessage] = useState(null);

  const onBarcodeScanned = async ({ data }) => {
    if (handling) return;          
    setHandling(true);
    setMessage(null);

    const id = extractDocumentId(data);
    if (!id) {
      setMessage("That QR code doesn't look like a document code.");
      setHandling(false);
      return;
    }

    try {
      const doc = await documentService.getById(id);
      if (!doc) {
        setMessage(`No document found for code "${id}".`);
        setHandling(false);
        return;
      }
      navigation.replace('Preview', { id });
    } catch (e) {
      setMessage(e.message);
      setHandling(false);
    }
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <EmptyState
          icon="camera-outline"
          title="Camera access needed"
          message="Allow camera access to scan a document QR code."
          actionLabel="Grant permission"
          onAction={requestPermission}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handling ? undefined : onBarcodeScanned}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={[styles.frame, { borderColor: colors.primary }]} />

        <Text style={styles.hint}>
          {handling ? 'Looking up document...' : 'Point the camera at a document QR code'}
        </Text>

        {message ? (
          <View style={[styles.error, { backgroundColor: colors.dangerSoft }]}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={{ ...font.small, color: colors.danger, flex: 1 }}>{message}</Text>
          </View>
        ) : null}

        {message ? (
          <Button
            title="Scan again"
            onPress={() => { setMessage(null); setHandling(false); }}
            style={{ marginTop: spacing.md, minWidth: 180 }}
          />
        ) : null}

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancel}>
          <Text style={{ ...font.label, color: '#fff' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  frame: { width: 240, height: 240, borderWidth: 3, borderRadius: radius.lg, backgroundColor: 'transparent' },
  hint: { ...font.body, color: '#fff', textAlign: 'center', marginTop: spacing.lg },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md, maxWidth: 320,
  },
  cancel: { position: 'absolute', bottom: spacing.xl, padding: spacing.md },
});
