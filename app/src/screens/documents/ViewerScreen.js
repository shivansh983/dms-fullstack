import { useEffect, useState, useCallback, useRef } from 'react';
import { View, ActivityIndicator, Image, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import Pdf from 'react-native-pdf';

import EmptyState from '../../components/ui/EmptyState';
import useTheme from '../../hooks/useTheme';
import { documentService } from '../../services/documentService';

export default function ViewerScreen({ route, navigation }) {
  const { id, name, type } = route.params;
  const { colors } = useTheme();

  const [uri, setUri] = useState(null);
  const [error, setError] = useState(null);
  const retried = useRef(false);

  const isImage = type?.startsWith('image');
  const isPdf = type === 'application/pdf';

  useEffect(() => {
    navigation.setOptions({ title: name || 'Document' });
  }, [name, navigation]);

  const load = useCallback(async () => {
    setError(null);
    return documentService.openUrl(id);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    retried.current = false;

    load()
      .then((url) => {
        if (!cancelled) setUri(url);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [load]);

  const onLoadError = async () => {
    if (retried.current) {
      return setError('This file could not be displayed.');
    }

    retried.current = true;

    try {
      setUri(await load());
    } catch (e) {
      setError(e.message);
    }
  };

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load the file"
          message={error}
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  if (!uri) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isImage) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        maximumZoomScale={4}
        minimumZoomScale={1}
      >
        <Image
          source={{ uri }}
          style={{ width: '100%', height: 500 }}
          resizeMode="contain"
          onError={onLoadError}
        />
      </ScrollView>
    );
  }

  if (isPdf) {
    return (
      <Pdf
        source={{ uri, cache: false }}
        style={{ flex: 1, width: '100%', backgroundColor: colors.background }}
        trustAllCerts={false}
        onError={onLoadError}
        renderActivityIndicator={() => (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      />
    );
  }

  return (
    <WebView
      source={{ uri }}
      style={{ flex: 1, backgroundColor: colors.background }}
      startInLoadingState
      scalesPageToFit
      onError={onLoadError}
    />
  );
}
