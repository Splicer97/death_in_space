import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  ScrollView,
  type KeyboardEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type ScrollViewProps,
} from 'react-native';

type EnsureVisible = (target: unknown) => void;

const KeyboardScrollContext = createContext<EnsureVisible>(() => {});

export function useKeyboardScroll(): EnsureVisible {
  return useContext(KeyboardScrollContext);
}

const SCROLL_OFFSET = 12;
const BOTTOM_SAFE = 12;

type ScrollHandle = {
  scrollTo(options: { x?: number; y?: number; animated?: boolean }): void;
};

type Measurable = {
  measureInWindow(
    callback: (
      x: number,
      y: number,
      width: number,
      height: number,
    ) => void,
  ): void;
};

function isMeasurable(target: unknown): target is Measurable {
  return (
    typeof target === 'object' &&
    target !== null &&
    typeof (target as Measurable).measureInWindow === 'function'
  );
}

export function KeyboardScrollView({
  children,
  contentContainerStyle,
  onScroll,
  scrollEventThrottle,
  ...rest
}: ScrollViewProps) {
  const scrollRef = useRef<ScrollHandle | null>(null);
  const scrollTopRef = useRef(0);
  const lastTargetRef = useRef<unknown>(null);
  const keyboardHeightRef = useRef(0);
  const viewHeightRef = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const subs = [
      Keyboard.addListener('keyboardDidShow', (event: KeyboardEvent) => {
        keyboardHeightRef.current = event.endCoordinates.height;
        setKeyboardHeight(event.endCoordinates.height);
        const target = lastTargetRef.current;
        if (target) {
          setTimeout(() => ensureVisible(target), 120);
        }
      }),
      Keyboard.addListener('keyboardDidHide', () => {
        keyboardHeightRef.current = 0;
        setKeyboardHeight(0);
      }),
      Keyboard.addListener('keyboardWillHide', () => {
        keyboardHeightRef.current = 0;
        setKeyboardHeight(0);
      }),
    ];
    return () => subs.forEach(sub => sub.remove());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureVisible = useCallback<EnsureVisible>(
    target => {
      lastTargetRef.current = target;
      const kb = keyboardHeightRef.current;
      const vh = viewHeightRef.current;
      if (!kb) return;
      if (!vh) return;
      const keyboardTop = vh - kb;
      if (keyboardTop <= 0) return;
      const scrollView = scrollRef.current;
      if (!scrollView) return;
      if (!isMeasurable(target)) return;
      target.measureInWindow((_x, y, _width, height) => {
        if (y + height <= keyboardTop + BOTTOM_SAFE) return;
        const contentOffset = scrollTopRef.current;
        scrollView.scrollTo({
          y: Math.max(0, y + contentOffset - SCROLL_OFFSET),
          animated: true,
        });
      });
    },
    [],
  );

  return (
    <KeyboardScrollContext.Provider value={ensureVisible}>
      <ScrollView
        {...rest}
        ref={node => {
          scrollRef.current = node as unknown as ScrollHandle | null;
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          scrollTopRef.current = event.nativeEvent.contentOffset.y;
          onScroll?.(event);
        }}
        scrollEventThrottle={scrollEventThrottle ?? 32}
        onLayout={event => {
          viewHeightRef.current = event.nativeEvent.layout.height;
        }}
        contentContainerStyle={[
          contentContainerStyle,
          { paddingBottom: keyboardHeight + BOTTOM_SAFE },
        ]}
      >
        {children}
      </ScrollView>
    </KeyboardScrollContext.Provider>
  );
}