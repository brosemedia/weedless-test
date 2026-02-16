import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { useOnboardingStore } from '../store';
import { useStrings } from '../i18n/useStrings';
import { useOnboardingStep } from '../hooks';
import { colors, spacing, typography, radii } from '../theme';
import { track } from '../services/analytics';

const PRODUCT_TO_PLAN: Record<string, 'monthly' | 'yearly'> = {
  premium_monthly: 'monthly',
  premium_yearly: 'yearly',
};

// Mock-Funktion - später durch RevenueCat ersetzen
const mockPurchaseSubscription = async (productId: string): Promise<boolean> => {
  // Simuliere API-Call
  await new Promise(resolve => setTimeout(resolve, 1500));
  // In Produktion: return await Purchases.purchasePackage(package);
  return true; // Mock: immer erfolgreich
};

type MockProduct = {
  id: string;
  title: string;
  price: string;
  period: string;
  popular: boolean;
  savings?: string;
  originalPrice?: string;
};

// Mock-Produkte - später aus RevenueCat laden
const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'premium_monthly',
    title: 'Premium Monatlich',
    price: '39,99 €',
    period: 'pro Monat',
    popular: false,
  },
  {
    id: 'premium_yearly',
    title: 'Premium Jährlich',
    price: '39,99 €',
    period: 'pro Jahr',
    popular: true,
  },
];

export const PaymentScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Payment');
  const strings = useStrings();
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (!selectedProduct) {
      setError('Bitte wähle ein Abo aus');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      track('payment_purchase_attempted', { product_id: selectedProduct });
      
      // Mock-Purchase - später durch RevenueCat ersetzen
      const success = await mockPurchaseSubscription(selectedProduct);
      
      if (success) {
        track('payment_purchase_succeeded', { product_id: selectedProduct });
        mergeProfile({ subscriptionPlan: PRODUCT_TO_PLAN[selectedProduct] ?? 'monthly' });
        goNext();
      } else {
        throw new Error('Kauf fehlgeschlagen');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      track('payment_purchase_failed', { product_id: selectedProduct, error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepScreen
      title={strings.payment.title}
      subtitle={strings.payment.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={handlePurchase}
      onBack={goBack}
      nextDisabled={loading || !selectedProduct}
      nextLabel={loading ? 'Wird verarbeitet...' : strings.payment.cta}
      showBack={true}
    >
      <View style={styles.container}>
        <Text style={styles.description}>{strings.payment.description}</Text>
        
        {MOCK_PRODUCTS.map((product) => (
          <TouchableOpacity
            key={product.id}
            onPress={() => {
              setSelectedProduct(product.id);
              setError(null);
              mergeProfile({ subscriptionPlan: PRODUCT_TO_PLAN[product.id] ?? 'monthly' });
              track('payment_product_selected', { product_id: product.id });
            }}
            style={[
              styles.productCard,
              selectedProduct === product.id && styles.productCardSelected,
              product.popular && styles.productCardPopular,
            ]}
          >
            {product.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Beliebt</Text>
              </View>
            )}
            <View style={styles.productHeader}>
              <Text style={styles.productTitle}>{product.title}</Text>
              {product.savings && (
                <Text style={styles.savingsText}>{product.savings}</Text>
              )}
            </View>
            <View style={styles.productPriceRow}>
              <Text style={styles.productPrice}>{product.price}</Text>
              <Text style={styles.productPeriod}>{product.period}</Text>
            </View>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>{product.originalPrice}</Text>
            )}
            {selectedProduct === product.id && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.selectedIndicatorText}>✓ Ausgewählt</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => {
            mergeProfile({ subscriptionPlan: 'none' });
            goNext();
          }}
          style={styles.skipButton}
        >
          <Text style={styles.skipButtonText}>{strings.payment.skip}</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>{strings.payment.footer}</Text>
      </View>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  productCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0F9F0',
  },
  productCardPopular: {
    borderColor: colors.accent,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: spacing.lg,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  popularBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productTitle: {
    ...typography.subheading,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
  },
  savingsText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  productPrice: {
    ...typography.heading,
    fontSize: 28,
  },
  productPeriod: {
    ...typography.body,
    color: colors.muted,
  },
  originalPrice: {
    ...typography.body,
    color: colors.muted,
    textDecorationLine: 'line-through',
    fontSize: 14,
  },
  selectedIndicator: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectedIndicatorText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipButtonText: {
    ...typography.body,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  footerText: {
    ...typography.body,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
