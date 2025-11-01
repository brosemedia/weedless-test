import React from 'react';
import { Card, ThemedText } from '../design/theme';

type Props = {
  label: string;
  value: string;
  helper?: string;
};

export default function KpiCard({ label, value, helper }: Props) {
  return (
    <Card>
      <ThemedText kind="label" muted>
        {label}
      </ThemedText>
      <ThemedText kind="h1" style={{ marginTop: 6 }}>
        {value}
      </ThemedText>
      {helper ? (
        <ThemedText kind="label" muted style={{ marginTop: 6 }}>
          {helper}
        </ThemedText>
      ) : null}
    </Card>
  );
}
