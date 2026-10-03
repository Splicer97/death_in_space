declare module 'react-native-keyboard-controller' {
  import type { ComponentType, PropsWithChildren } from 'react';
  import type { ScrollViewProps } from 'react-native';

  export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
    bottomOffset?: number;
  }

  export const KeyboardAwareScrollView: ComponentType<KeyboardAwareScrollViewProps>;

  export const KeyboardProvider: ComponentType<PropsWithChildren>;
}

declare module 'react-native-keyboard-controller/lib/commonjs/components/KeyboardAwareScrollView' {
  import type { ComponentType } from 'react';
  import type { KeyboardAwareScrollViewProps } from 'react-native-keyboard-controller';
  const KeyboardAwareScrollView: ComponentType<KeyboardAwareScrollViewProps>;
  export default KeyboardAwareScrollView;
}

declare module 'react-native-keyboard-controller/lib/commonjs/components/KeyboardProvider' {
  import type { ComponentType, PropsWithChildren } from 'react';
  const KeyboardProvider: ComponentType<PropsWithChildren>;
  export default KeyboardProvider;
}