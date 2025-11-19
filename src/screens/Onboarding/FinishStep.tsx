import { useApp } from '../../store/app';
import { useNavigation } from '@react-navigation/native';

type Values = {
  pricePerGram?: number;
  costPerJoint?: number;
  gramsPerDayBaseline?: number;
  jointsPerDayBaseline?: number;
  avgSessionMinutes?: number;
  startTimestamp?: number;
  locale?: string;
};

export default function FinishStep({ values }: { values: Values }) {
  const setProfile = useApp((s) => s.setProfile);
  const nav = useNavigation();

  const onDone = () => {
    setProfile({
      ...values,
      startTimestamp: values.startTimestamp ?? Date.now(),
      locale: values.locale ?? 'de-DE',
    });
    // Immediately show Dashboard with live values
    // @ts-ignore
    nav.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
  };

  // Replace with your UI; just call onDone() on the final button
  return null;
}
