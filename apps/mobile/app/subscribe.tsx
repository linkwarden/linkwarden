import { Button } from "@/components/ui/Button";
import { rawTheme, ThemeName } from "@/lib/colors";
import {
  hasInactiveSubscription,
  shouldRouteToSubscribe,
} from "@/lib/subscription";
import { ensureCloudIsReachable } from "@/lib/ensureCloudIsReachable";
import {
  formatPrice,
  getPlanOption,
  SUBSCRIPTION_SKUS,
  verifyPurchaseWithServer,
} from "@/lib/iap";
import useAuthStore from "@/store/auth";
import { useConfig } from "@linkwarden/router/config";
import { useUser } from "@linkwarden/router/user";
import { Plan } from "@linkwarden/types/global";
import { router, useFocusEffect } from "expo-router";
import { useColorScheme } from "nativewind";
import {
  Archive,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Search,
  Sparkles,
} from "lucide-react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import {
  ErrorCode,
  getAvailablePurchases,
  isEligibleForIntroOfferIOS,
  useIAP,
  type Purchase,
} from "expo-iap";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const features = [
  { title: "Save & organize", icon: Bookmark },
  { title: "Permanent archives", icon: Archive },
  { title: "Reader view & highlights", icon: BookOpen },
  { title: "Full-text search", icon: Search },
  { title: "And more...", icon: Sparkles },
];

const paymentButton = Platform.select({
  ios: {
    accessibilityLabel: "Subscribe with Apple Pay",
    icon: "apple-pay",
    iconSize: 40,
  },
  android: {
    accessibilityLabel: "Subscribe with Google Pay",
    icon: "google-pay",
    iconSize: 40,
  },
  default: {
    accessibilityLabel: "Complete Subscription",
    iconSize: 0,
  },
});

export default function SubscribeScreen() {
  const { auth, signOut } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];
  const accentColor = colorScheme === "dark" ? "#A78BFA" : theme.accent;
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<Plan>(Plan.yearly);
  const {
    data: user,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useUser(auth);
  const config = useConfig(auth);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [productsError, setProductsError] = useState(false);
  const [fetchAttempt, setFetchAttempt] = useState(0);

  const [introOfferEligible, setIntroOfferEligible] = useState(
    Platform.OS !== "ios"
  );

  const showForeignPurchaseAlert = () => {
    Alert.alert(
      "Subscription already in use",
      Platform.OS === "ios"
        ? "The App Store subscription on this device belongs to a different Linkwarden account. Sign in with that account to use it, or subscribe with a different Apple Account."
        : "The Google Play subscription on this device belongs to a different Linkwarden account. Sign in with that account to use it, or subscribe with a different Google account."
    );
  };

  const activateSubscription = async () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const { data } = await refetchUser();

      if (data?.subscription?.active || data?.parentSubscription?.active) {
        router.replace("/(tabs)/dashboard");
        return;
      }

      await wait(1000);
    }

    Alert.alert(
      "Subscription syncing",
      "Your purchase was completed and is still syncing. Please try again in a moment."
    );
  };

  const handlePurchaseSuccess = async (purchase: Purchase) => {
    try {
      // Ask-to-Buy / slow payment methods complete later; the purchase comes back
      // through this listener again once it's actually purchased.
      if (purchase.purchaseState === "pending") {
        Alert.alert(
          "Purchase pending",
          "Your purchase is awaiting approval and will activate once it completes."
        );
        return;
      }

      const verified = await verifyPurchaseWithServer(
        useAuthStore.getState().auth,
        purchase
      );

      if (verified.active) {
        // Only finish after the server has validated it — unfinished purchases are
        // redelivered on the next launch, which is the retry mechanism.
        await finishTransaction({ purchase, isConsumable: false }).catch(
          () => {}
        );
        await activateSubscription();
      } else if (verified.foreignAccount) {
        showForeignPurchaseAlert();
      } else {
        Alert.alert(
          "Subscription syncing",
          "Your purchase was completed and is still syncing. Please try again in a moment."
        );
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    reconnect,
  } = useIAP({
    onPurchaseSuccess: handlePurchaseSuccess,
    onPurchaseError: (error) => {
      setPurchaseLoading(false);

      if (error.code === ErrorCode.AlreadyOwned) {
        restorePurchases();
        return;
      }

      if (
        error.code !== ErrorCode.UserCancelled &&
        error.code !== ErrorCode.DeferredPayment
      ) {
        Alert.alert("Purchase failed", "Could not complete purchase.");
      }
    },
  });

  const isForcedSubscribe = shouldRouteToSubscribe(user, config.data);
  const showSubscribe = hasInactiveSubscription(user, config.data);
  const isChecking =
    auth.status === "loading" ||
    (auth.status === "authenticated" && (isUserLoading || config.isLoading));

  useEffect(() => {
    if (auth.status === "unauthenticated") router.replace("/");
    if (auth.status === "authenticated" && !isChecking && !showSubscribe)
      router.replace("/(tabs)/dashboard");
  }, [auth.status, isChecking, showSubscribe]);

  useFocusEffect(
    useCallback(() => {
      if (auth.status === "authenticated") refetchUser();
    }, [auth.status, refetchUser])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (
        state === "active" &&
        useAuthStore.getState().auth.status === "authenticated"
      )
        refetchUser();
    });

    return () => subscription.remove();
  }, [refetchUser]);

  useEffect(() => {
    if (!connected) return;

    let active = true;

    fetchProducts({ skus: SUBSCRIPTION_SKUS, type: "subs" })
      .then(() => active && setProductsError(false))
      .catch(() => active && setProductsError(true));

    return () => {
      active = false;
    };
  }, [connected, fetchAttempt]);

  const monthlyPlan = useMemo(
    () => getPlanOption(subscriptions, "monthly"),
    [subscriptions]
  );
  const yearlyPlan = useMemo(
    () => getPlanOption(subscriptions, "yearly"),
    [subscriptions]
  );

  const plansLoaded = Boolean(monthlyPlan && yearlyPlan);

  // A trial-expired user is forced onto this screen, so a failed store
  // connection or product fetch must keep retrying instead of dead-ending.
  useEffect(() => {
    if (plansLoaded) return;

    const timer = setInterval(() => {
      if (!connected) {
        reconnect().catch(() => {});
      } else {
        setFetchAttempt((attempt) => attempt + 1);
      }
    }, 8000);

    return () => clearInterval(timer);
  }, [plansLoaded, connected]);

  // iOS product metadata always advertises the intro offer; whether this Apple ID
  // is still eligible for it has to be checked separately.
  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const groupId = subscriptions
      .map((subscription) =>
        subscription.platform === "ios"
          ? subscription.subscriptionGroupIdIOS
          : null
      )
      .find(Boolean);

    if (!groupId) return;

    let active = true;

    isEligibleForIntroOfferIOS(groupId)
      .then((eligible) => active && setIntroOfferEligible(eligible))
      .catch(() => active && setIntroOfferEligible(false));

    return () => {
      active = false;
    };
  }, [subscriptions]);

  const planCards = useMemo(
    () => [
      {
        key: Plan.yearly,
        label: "Yearly",
        price: yearlyPlan?.displayPrice ?? null,
        suffix: "/yr",
        caption: yearlyPlan?.priceAmount
          ? `Only ${formatPrice(
              yearlyPlan.priceAmount / 12,
              yearlyPlan.currency
            )}/mo`
          : null,
      },
      {
        key: Plan.monthly,
        label: "Monthly",
        price: monthlyPlan?.displayPrice ?? null,
        suffix: "/mo",
        caption: monthlyPlan?.displayPrice
          ? `Billed at ${monthlyPlan.displayPrice}/mo.`
          : null,
      },
    ],
    [monthlyPlan, yearlyPlan]
  );

  const savingsPercent = useMemo(() => {
    const monthlyPrice = monthlyPlan?.priceAmount;
    const yearlyPrice = yearlyPlan?.priceAmount;
    if (!monthlyPrice || !yearlyPrice) return null;
    const percent = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);
    return percent > 0 ? percent : null;
  }, [monthlyPlan, yearlyPlan]);

  const selectedPlan = useMemo(() => {
    const option = plan === Plan.monthly ? monthlyPlan : yearlyPlan;
    const total = option?.displayPrice;
    const period = plan === Plan.monthly ? "month" : "year";
    const freeTrialPeriod = introOfferEligible ? option?.freeTrialPeriod : null;

    return {
      option: option ?? null,
      footnote: total
        ? freeTrialPeriod
          ? `${freeTrialPeriod} free, then ${total}/${period}`
          : `${total}/${period}`
        : null,
    };
  }, [plan, monthlyPlan, yearlyPlan, introOfferEligible]);

  if (isChecking || auth.status !== "authenticated" || !showSubscribe) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const restorePurchases = async () => {
    if (restoreLoading) return;

    setRestoreLoading(true);

    try {
      const purchases = await getAvailablePurchases();
      const owned = purchases.filter((purchase) =>
        SUBSCRIPTION_SKUS.includes(purchase.productId)
      );

      let restored = false;
      let foreignAccount = false;

      for (const purchase of owned) {
        const result = await verifyPurchaseWithServer(auth, purchase);

        if (result.active) {
          await finishTransaction({ purchase, isConsumable: false }).catch(
            () => {}
          );
          restored = true;
          break;
        }

        if (result.foreignAccount) foreignAccount = true;
      }

      if (restored) {
        await activateSubscription();
      } else if (foreignAccount) {
        showForeignPurchaseAlert();
      } else {
        Alert.alert("No purchases found", "No active purchases were found.");
      }
    } catch {
      Alert.alert("Restore failed", "Could not restore purchases.");
    } finally {
      setRestoreLoading(false);
    }
  };

  const purchase = async () => {
    if (!selectedPlan.option || purchaseLoading || !user?.uuid) return;

    setPurchaseLoading(true);

    try {
      const serverReachable = await ensureCloudIsReachable(auth.instance);
      if (!serverReachable) {
        setPurchaseLoading(false);
        return;
      }

      const { data: freshUser } = await refetchUser();
      if (
        freshUser?.subscription?.active ||
        freshUser?.parentSubscription?.active
      ) {
        router.replace("/(tabs)/dashboard");
        setPurchaseLoading(false);
        return;
      }

      // The store account may already hold a subscription (reinstall, new device,
      // signed-out repurchase attempt) — re-link it instead of buying again.
      const existing = await getAvailablePurchases().catch(
        () => [] as Purchase[]
      );
      const owned = existing.find((purchase) =>
        SUBSCRIPTION_SKUS.includes(purchase.productId)
      );

      if (owned) {
        const result = await verifyPurchaseWithServer(auth, owned);

        if (result.active) {
          await finishTransaction({
            purchase: owned,
            isConsumable: false,
          }).catch(() => {});
          await activateSubscription();
          setPurchaseLoading(false);
          return;
        }

        // The store won't sell this product again to the same store account, so
        // don't even open the payment sheet — explain instead.
        if (result.foreignAccount) {
          showForeignPurchaseAlert();
          setPurchaseLoading(false);
          return;
        }
      }

      const { sku, offerToken } = selectedPlan.option;

      // The result is delivered to onPurchaseSuccess/onPurchaseError, which also
      // clear the loading state.
      await requestPurchase({
        request: {
          apple: {
            sku,
            appAccountToken: user.uuid,
          },
          google: {
            skus: [sku],
            subscriptionOffers: offerToken ? [{ sku, offerToken }] : undefined,
            obfuscatedAccountId: user.uuid,
          },
        },
        type: "subs",
      });
    } catch {
      // Failures (including cancellation) are surfaced through onPurchaseError
      setPurchaseLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-zinc-100 dark:bg-zinc-900">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingTop: insets.top + 8,
          paddingBottom: 16,
        }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center px-6 pt-2 pb-1">
          <Image
            source={require("@/assets/images/linkwarden.png")}
            className="w-[60px] h-[60px]"
          />
          <Text className="text-base-content text-3xl font-bold text-center mt-5">
            Get Linkwarden Cloud
          </Text>
          <Text className="text-neutral text-lg text-center mt-2">
            Collect, read, annotate, and fully preserve what matters, all in one
            place.
          </Text>
        </View>

        <View className="mx-4 mt-6 px-5 py-5 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <View key={feature.title} className="flex-row items-center gap-3">
                <Icon size={20} color={accentColor} strokeWidth={2.5} />
                <Text className="text-base-content text-lg">
                  {feature.title}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <SafeAreaView
        edges={["bottom"]}
        className="bg-zinc-100 dark:bg-zinc-900 px-4 pt-5 pb-2"
      >
        <View className="flex-row gap-3">
          {planCards.map((card) => {
            const isSelected = plan === card.key;
            const showBadge = card.key === Plan.yearly && savingsPercent;

            return (
              // The card is rounded (clips overflow), so the badge lives on an
              // unclipped wrapper and overlaps the card from outside.
              <View key={card.label} className="flex-1">
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setPlan(card.key)}
                  className="rounded-2xl border-2 bg-base-100 p-4"
                  style={{
                    borderColor: isSelected
                      ? accentColor
                      : theme["neutral-content"],
                  }}
                >
                  <View className="flex-row items-start justify-between">
                    <Text className="text-base-content text-lg font-bold">
                      {card.label}
                    </Text>
                    {isSelected ? (
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-accent">
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    ) : (
                      <View className="h-6 w-6 rounded-full border-2 border-neutral-content" />
                    )}
                  </View>

                  {card.price ? (
                    <Text className="text-base-content text-xl font-bold mt-1">
                      {card.price}
                      <Text className="text-neutral text-sm font-normal">
                        {card.suffix}
                      </Text>
                    </Text>
                  ) : (
                    <View className="h-6 w-20 rounded-md bg-base-200 mt-1" />
                  )}

                  {card.caption ? (
                    <Text className="text-neutral text-xs mt-1">
                      {card.caption}
                    </Text>
                  ) : (
                    <View className="h-3 w-16 rounded bg-base-200 mt-2" />
                  )}
                </TouchableOpacity>

                {showBadge ? (
                  <View className="absolute -top-3 left-3 rounded-full bg-accent px-2 py-0.5">
                    <Text className="text-white text-xs font-bold">
                      {savingsPercent}% OFF
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Also shown when fetches "succeed" with no matching products (e.g. SKU
            env vars not matching the store's product ids — unknown ids are
            silently omitted rather than erroring) */}
        {(productsError || fetchAttempt >= 2) && !plansLoaded ? (
          <TouchableOpacity
            activeOpacity={0.7}
            className="mt-3"
            onPress={() => setFetchAttempt((attempt) => attempt + 1)}
          >
            <Text className="text-neutral text-center text-sm">
              Couldn't load subscription plans.{" "}
              <Text className="text-primary font-semibold">Retry</Text>
            </Text>
          </TouchableOpacity>
        ) : null}

        <Button
          variant="accent"
          size="lg"
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={paymentButton.accessibilityLabel}
          className={`w-full h-16 mt-4 flex-col gap-0`}
          disabled={!selectedPlan.option || purchaseLoading || !user?.uuid}
          onPress={purchase}
          isLoading={purchaseLoading}
        >
          <Text className="text-xl font-semibold text-white">
            Start Free Trial
          </Text>
          <Text className="text-white">{selectedPlan.footnote}</Text>
        </Button>

        {selectedPlan.footnote ? (
          <Text className="text-neutral text-center text-xs mt-3">
            Cancel anytime from your device settings.
          </Text>
        ) : null}

        <View className="flex-row items-center justify-center gap-6 mt-3">
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={restoreLoading}
            onPress={restorePurchases}
          >
            {restoreLoading ? (
              <ActivityIndicator color={theme.primary} size="small" />
            ) : (
              <Text className="text-primary text-sm font-semibold">
                Restore Purchases
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL("https://linkwarden.app/tos")}
          >
            <Text className="text-primary text-sm font-semibold">Terms</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Linking.openURL("https://linkwarden.app/privacy-policy")
            }
          >
            <Text className="text-primary text-sm font-semibold">Privacy</Text>
          </TouchableOpacity>
        </View>

        {isForcedSubscribe ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <TouchableOpacity
                activeOpacity={0.7}
                className="self-center mt-3 flex-row items-center gap-1"
              >
                <Text className="text-neutral text-center text-sm font-semibold">
                  Manage your account
                </Text>
                <ChevronDown size={15} color={theme["neutral"]} />
              </TouchableOpacity>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content>
              {Platform.OS === "ios" /* Reverse order for iOS */ ? (
                <>
                  <DropdownMenu.Item
                    key="delete-account"
                    destructive
                    onSelect={() => SheetManager.show("delete-account-sheet")}
                  >
                    <DropdownMenu.ItemTitle>
                      Delete account
                    </DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item key="sign-out" onSelect={() => signOut()}>
                    <DropdownMenu.ItemTitle>Sign out</DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                </>
              ) : (
                <>
                  <DropdownMenu.Item key="sign-out" onSelect={() => signOut()}>
                    <DropdownMenu.ItemTitle>Sign out</DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    key="delete-account"
                    destructive
                    onSelect={() => SheetManager.show("delete-account-sheet")}
                  >
                    <DropdownMenu.ItemTitle>
                      Delete account
                    </DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                </>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            className="self-center mt-3"
            onPress={() => router.replace("/(tabs)/dashboard")}
          >
            <Text className="text-neutral text-center text-sm font-semibold">
              Subscribe Later
            </Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      <TouchableOpacity
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Need help?"
        className="absolute right-4 items-center justify-center rounded-full"
        style={{ top: insets.top + 4 }}
        onPress={() => SheetManager.show("support-sheet")}
      >
        <CircleHelp size={25} color={theme["base-content"]} />
      </TouchableOpacity>
    </View>
  );
}
