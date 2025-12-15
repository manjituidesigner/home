import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  SafeAreaView,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';

export default function PropertyImageSlider({
  photos,
  maxImages = 5,
  autoSlide = true,
  autoSlideIntervalMs = 3000,
  height = 200,
  borderRadius = 12,
  showThumbnails = true,
}) {
  const normalizedPhotos = useMemo(() => {
    if (!Array.isArray(photos)) return [];
    return photos
      .filter((p) => typeof p === 'string' && p.trim().length > 0)
      .slice(0, maxImages);
  }, [photos, maxImages]);

  const scrollRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(
    Dimensions.get('window').width,
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef(null);
  const viewerScrollRef = useRef(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const photoCount = normalizedPhotos.length;

  const scrollToIndex = (index, animated = true) => {
    if (!containerWidth || !scrollRef.current) return;
    scrollRef.current.scrollTo({ x: index * containerWidth, animated });
  };

  const openViewerAt = (index) => {
    if (!photoCount) return;
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const closeViewer = () => {
    setViewerVisible(false);
    setActiveIndex(viewerIndex);
    scrollToIndex(viewerIndex, false);
  };

  useEffect(() => {
    setActiveIndex(0);
    if (photoCount > 0) {
      scrollToIndex(0, false);
    }
  }, [photoCount, containerWidth]);

  useEffect(() => {
    if (!autoSlide) return;
    if (photoCount <= 1) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % photoCount;
        scrollToIndex(nextIndex, true);
        return nextIndex;
      });
    }, autoSlideIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoSlide, autoSlideIntervalMs, photoCount, containerWidth]);

  if (!photoCount) {
    return (
      <View
        style={[
          styles.placeholder,
          { height, borderRadius, backgroundColor: '#dfe9f3' },
        ]}
      >
        <Ionicons
          name="image-outline"
          size={40}
          color={theme.colors.textSecondary}
        />
        <Text style={styles.placeholderText}>No image</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        {
          height,
          borderRadius,
        },
      ]}
      onLayout={(e) => {
        const w = e?.nativeEvent?.layout?.width;
        if (typeof w === 'number' && w > 0 && w !== containerWidth) {
          setContainerWidth(w);
        }
      }}
    >
      <Modal
        visible={viewerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={closeViewer}
      >
        <SafeAreaView style={styles.viewerSafe}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerCounter}>
              {photoCount ? `${viewerIndex + 1} / ${photoCount}` : ''}
            </Text>
            <TouchableOpacity
              style={styles.viewerCloseBtn}
              onPress={closeViewer}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={26} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={viewerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onLayout={() => {
              const screenWidth = Dimensions.get('window').width;
              if (viewerScrollRef.current) {
                viewerScrollRef.current.scrollTo({
                  x: viewerIndex * screenWidth,
                  animated: false,
                });
              }
            }}
            onMomentumScrollEnd={(e) => {
              const screenWidth = Dimensions.get('window').width;
              const x = e?.nativeEvent?.contentOffset?.x || 0;
              const next = screenWidth ? Math.round(x / screenWidth) : 0;
              setViewerIndex(next);
            }}
          >
            {normalizedPhotos.map((uri) => (
              <View key={`viewer-${uri}`} style={styles.viewerSlide}>
                <Image
                  source={{ uri }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const x = e?.nativeEvent?.contentOffset?.x || 0;
          if (!containerWidth) return;
          const next = Math.round(x / containerWidth);
          setActiveIndex(next);
        }}
        onScrollBeginDrag={() => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }}
      >
        {normalizedPhotos.map((uri) => (
          <Image
            key={uri}
            source={{ uri }}
            style={{ width: containerWidth, height }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {showThumbnails && photoCount > 1 ? (
        <View style={styles.thumbBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbBarContent}
          >
            {normalizedPhotos.map((uri, idx) => {
              const selected = idx === activeIndex;
              return (
                <TouchableOpacity
                  key={`${uri}-${idx}`}
                  activeOpacity={0.85}
                  onPress={() => openViewerAt(idx)}
                  style={[
                    styles.thumbButton,
                    selected && styles.thumbButtonSelected,
                  ]}
                >
                  <Image source={{ uri }} style={styles.thumbImage} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#dfe9f3',
  },
  viewerSafe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  viewerHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  viewerCounter: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewerCloseBtn: {
    padding: 6,
  },
  viewerSlide: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  viewerImage: {
    width: '100%',
    height: '70%',
  },
  placeholder: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: theme.colors.textSecondary,
  },
  thumbBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
  },
  thumbBarContent: {
    paddingHorizontal: 10,
    gap: 8,
  },
  thumbButton: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  thumbButtonSelected: {
    borderColor: '#ffffff',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
