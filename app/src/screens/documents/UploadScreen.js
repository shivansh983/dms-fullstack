import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useTheme from '../../hooks/useTheme';
import { documentService } from '../../services/documentService';
import { useDocumentStore } from '../../store/documentStore';
import { fromDocumentPicker, fromImageAsset, compressImage, validateFile } from '../../utils/fileHelpers';
import { formatSize } from '../../utils/formatters';
import { radius, spacing, font } from '../../styles/theme';

export default function UploadScreen({ navigation }) {
  const { colors } = useTheme();
  const refresh = useDocumentStore((s) => s.refresh);

  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [progress, setProgress] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [uploading, setUploading] = useState(false);

  const accept = (incoming) => {
    const good = [];
    const bad = [];

    for (const f of incoming) {
      const error = validateFile(f);
      error ? bad.push(`${f.name}: ${error}`) : good.push(f);
    }

    if (bad.length) Alert.alert('Some files were skipped', bad.join('\n'));
    if (!good.length) return;

    setFiles((prev) => [...prev, ...good]);
    if (!title && good.length === 1 && files.length === 0) {
      setTitle(good[0].name.replace(/\.[^.]+$/, ''));   
    }
  };

  const pickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (res.canceled) return;
    accept(res.assets.map(fromDocumentPicker));
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to continue.');

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: true,
    });
    if (res.canceled) return;
    accept(await Promise.all(res.assets.map((a) => compressImage(fromImageAsset(a)))));
  };

  const scan = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow camera access to scan.');

    const res = await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: true });
    if (res.canceled) return;
    accept([await compressImage(fromImageAsset(res.assets[0]))]);
  };

  const removeAt = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const reset = () => {
    setFiles([]); setTitle(''); setTags(''); setProgress(0); setDoneCount(0);
  };

  const onUpload = async () => {
    if (!files.length) return Alert.alert('Select a file first');

    setUploading(true);
    setProgress(0);
    setDoneCount(0);

    const failures = [];

  
    for (let i = 0; i < files.length; i++) {
      try {
        await documentService.upload(
          files[i],
          { title: files.length === 1 ? title : undefined, tags },
          (p) => setProgress(Math.round(((i + p / 100) / files.length) * 100))
        );
        setDoneCount(i + 1);
      } catch (e) {
        failures.push(`${files[i].name}: ${e.message}`);
      }
    }

    setUploading(false);
    refresh();

    if (failures.length) {
      Alert.alert(
        failures.length === files.length ? 'Upload failed' : 'Some uploads failed',
        failures.join('\n')
      );
      return;
    }

    reset();
    Alert.alert(
      'Uploaded',
      `${files.length} ${files.length === 1 ? 'document is' : 'documents are'} being processed.`,
      [{ text: 'View documents', onPress: () => navigation.navigate('Documents') }]
    );
  };

  const Source = ({ icon, label, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={uploading}
      style={[styles.source, { borderColor: colors.border, backgroundColor: colors.surface }]}
    >
      <Ionicons name={icon} size={26} color={colors.primary} />
      <Text style={{ ...font.small, color: colors.text }}>{label}</Text>
    </TouchableOpacity>
  );

  const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
        <Text style={{ ...font.h1, color: colors.text, marginBottom: spacing.lg }}>Upload Document</Text>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          <Source icon="document-attach" label="Browse" onPress={pickDocument} />
          <Source icon="images" label="Gallery" onPress={pickImage} />
          <Source icon="camera" label="Scan" onPress={scan} />
        </View>

        {files.length > 0 ? (
          <View style={styles.listHeader}>
            <Text style={{ ...font.label, color: colors.text }}>
              {files.length} {files.length === 1 ? 'file' : 'files'} · {formatSize(totalBytes)}
            </Text>
            {!uploading ? (
              <TouchableOpacity onPress={reset} hitSlop={10}>
                <Text style={{ ...font.small, color: colors.danger }}>Clear all</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {files.map((file, index) => (
          <View key={`${file.uri}-${index}`} style={[styles.preview, { backgroundColor: colors.surface }]}>
            {file.mimeType?.startsWith('image') ? (
              <Image source={{ uri: file.uri }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.center, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="document-text" size={28} color={colors.primary} />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={{ ...font.label, color: colors.text }} numberOfLines={1}>{file.name}</Text>
              <Text style={{ ...font.small, color: colors.textMuted }}>{formatSize(file.size || 0)}</Text>
            </View>

            {uploading ? (
              <Ionicons
                name={index < doneCount ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={index < doneCount ? colors.success : colors.textMuted}
              />
            ) : (
              <TouchableOpacity onPress={() => removeAt(index)} hitSlop={10}>
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {files.length === 1 ? (
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="Q3 Invoice" />
        ) : null}
        <Input label="Tags (comma separated)" value={tags} onChangeText={setTags} placeholder="finance, 2026" />

        {uploading ? (
          <View style={{ marginBottom: spacing.md }}>
            <View style={{ height: 6, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' }}>
              <View style={{ height: 6, width: `${progress}%`, backgroundColor: colors.primary }} />
            </View>
            <Text style={{ ...font.small, color: colors.textMuted, marginTop: spacing.xs }}>
              {progress}% · {doneCount} of {files.length} uploaded
            </Text>
          </View>
        ) : null}

        <Button
          title={files.length > 1 ? `Upload ${files.length} Documents` : 'Upload Document'}
          onPress={onUpload}
          loading={uploading}
          disabled={files.length === 0}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  source: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg,
            borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: spacing.sm },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md,
             borderRadius: radius.lg, marginBottom: spacing.sm },
  thumb: { width: 52, height: 52, borderRadius: radius.md },
});
