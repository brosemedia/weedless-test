import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text, type ImageSourcePropType } from 'react-native';

const LOADING_IMAGES: ImageSourcePropType[] = [
  require('../../assets/loadingscreenassets/Element 1.png'),
  require('../../assets/loadingscreenassets/Element 2.png'),
  require('../../assets/loadingscreenassets/Element 3.png'),
  require('../../assets/loadingscreenassets/Element 4.png'),
  require('../../assets/loadingscreenassets/Element 5.png'),
  require('../../assets/loadingscreenassets/Element 6.png'),
  require('../../assets/loadingscreenassets/Element 7.png'),
  require('../../assets/loadingscreenassets/Element 8.png'),
];

type LoadingBarAnimationProps = {
  message?: string;
  imageSize?: number;
  textColor?: string;
};

const ANIMATION_INTERVAL_MS = 150; // Mittlere Geschwindigkeit: ~6-7 Bilder pro Sekunde

export function LoadingBarAnimation({ message, imageSize = 200, textColor }: LoadingBarAnimationProps) {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    // Starte sofort mit dem ersten Frame
    setCurrentFrame(0);
    
    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = (prev + 1) % LOADING_IMAGES.length;
        return next;
      });
    }, ANIMATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const currentImage = LOADING_IMAGES[currentFrame];

  return (
    <View style={styles.container}>
      {currentImage && (
        <Image
          source={currentImage}
          style={[styles.image, { width: imageSize, height: imageSize }]}
          resizeMode="contain"
        />
      )}
      {message && (
        <Text style={[styles.message, textColor ? { color: textColor } : undefined]}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

