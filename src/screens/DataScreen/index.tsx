import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Card, Field, Screen, SectionTitle, Snackbar } from '../../components/ui';
import { useCharacterStore } from '../../store/characterStore';
import { backupToText, parseBackup, type BackupSummary } from '../../utils/backup';
import type { RootStackParamList } from '../../navigation/types';
import { styles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Data'>;

function plural(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return 'персонаж';
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'персонажа';
  }
  return 'персонажей';
}

function describe(summary: BackupSummary): string {
  const parts = [`${summary.characters} ${plural(summary.characters)}`];
  if (summary.hub) {
    parts.push(`хаб «${summary.hub}»`);
  }
  return parts.join(', ');
}

export default function DataScreen(_props: Props) {
  const characters = useCharacterStore(state => state.characters);
  const activeId = useCharacterStore(state => state.activeId);
  const hub = useCharacterStore(state => state.hub);
  const importBackup = useCharacterStore(state => state.importBackup);
  const [text, setText] = useState('');
  const [result, setResult] = useState<{characters: number; hub: string | null} | null>(
    null,
  );

  const current = useMemo(
    () => describe({characters: characters.length, hub: hub?.hull ?? null}),
    [characters.length, hub],
  );

  const check = useMemo(() => (text.trim() ? parseBackup(text) : null), [text]);

  const exportBackup = useCallback(() => {
    Share.share({
      title: 'Резервная копия',
      message: backupToText({characters, activeId, hub}),
    });
  }, [activeId, characters, hub]);

  const applyImport = useCallback(() => {
    if (!check || !check.ok) {
      return;
    }
    const backup = check.backup;
    Alert.alert(
      'Заменить данные?',
      `Текущие данные (${current}) будут удалены без возможности отмены. В копии: ${describe(
        check.summary,
      )}.`,
      [
        {text: 'Отмена', style: 'cancel'},
        {
          text: 'Заменить',
          style: 'destructive',
          onPress: () => {
            importBackup(backup);
            setText('');
            setResult(check.summary);
          },
        },
      ],
    );
  }, [check, current, importBackup]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <SectionTitle
            title="РЕЗЕРВНАЯ КОПИЯ"
            subtitle={`Сейчас в приложении: ${current}`}
          />
          <Text style={styles.text}>
            Копия содержит всех персонажей и хаб одним текстом. Отправьте его себе в
            мессенджер, почту или заметки — вернуть данные можно в любой момент.
          </Text>
          <Button title="ПОДЕЛИТЬСЯ КОПИЕЙ" onPress={exportBackup} />
        </Card>

        <Card style={styles.card}>
          <SectionTitle
            title="ИМПОРТ"
            subtitle="Вставьте скопированный JSON в поле ниже"
          />
          <Field
            label="ДАННЫЕ ИЗ КОПИИ"
            value={text}
            onChangeText={value => {
              setText(value);
              setResult(null);
            }}
            placeholder='{"app":"death-in-space",…}'
            multiline
            autoCapitalize="none"
            style={styles.field}
          />
          {check ? (
            check.ok ? (
              <Text style={styles.ok}>
                {`В копии: ${describe(check.summary)}`}
              </Text>
            ) : (
              <Text style={styles.error}>{check.error}</Text>
            )
          ) : null}
          <View style={styles.row}>
            <Button
              title="ИМПОРТИРОВАТЬ"
              variant="danger"
              disabled={!check || !check.ok}
              onPress={applyImport}
              style={styles.flex}
            />
            <Button
              title="ОЧИСТИТЬ"
              variant="ghost"
              disabled={!text}
              onPress={() => {
                setText('');
                setResult(null);
              }}
              style={styles.rowButton}
            />
          </View>
          <Text style={styles.hint}>
            Импорт заменяет текущих персонажей и хаб целиком. Сделайте копию перед
            заменой, если текущие данные ещё нужны.
          </Text>
        </Card>
      </ScrollView>

      <Snackbar
        visible={result !== null}
        message={result ? `Импортировано: ${describe(result)}` : ''}
        onDismiss={() => setResult(null)}
      />
    </Screen>
  );
}
