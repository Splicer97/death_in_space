import React from 'react';
import {View} from 'react-native';

function KeyboardProvider({children}: {children: React.ReactNode}) {
  return <View>{children}</View>;
}

function KeyboardAwareScrollView(props: Record<string, unknown>) {
  return <View {...props} />;
}

export {KeyboardProvider};
export default KeyboardAwareScrollView;