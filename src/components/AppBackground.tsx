import React from 'react';
import { ImageBackground, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

type Props = {
  children: React.ReactNode;
};

const AppBackground: React.FC<Props> = ({ children }) => {
  const { theme } = useTheme();

  if (theme.backgroundImage) {
    return (
      <ImageBackground
        source={theme.backgroundImage}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          {children}
        </View>
      </ImageBackground>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {children}
    </View>
  );
};

export default AppBackground;
