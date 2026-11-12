import { useAccounts } from "@/shared/context/AccountContext";
import { useTransactions } from "@/shared/context/TransactionContext";
import {
  DEFAULT_CURRENCY_CODE,
  getCurrencyByCode,
} from "@/shared/lib/currencies";
import { formatCurrency } from "@/shared/lib/format";
import { useTheme } from "@/shared/theme/ThemeContext";
import { getThemeCssVariables } from "@/shared/theme/themeVariables";
import {
  calculateAccountBalance,
  type Transaction,
  type TransactionDraft,
} from "@/shared/transactions/transactionTypes";
import DatePickerField from "@/shared/ui/DatePickerField";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { vars } from "nativewind";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  transaction?: Transaction | null;
  onClose: () => void;
};
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function TransferEditorModal({
  visible,
  transaction = null,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { accounts } = useAccounts();
  const { transactions, addTransaction, updateTransaction } = useTransactions();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [picker, setPicker] = useState<"from" | "to" | null>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const historyEntry = useRef(false);
  const suppressPop = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const from = accounts.find((a) => a.id === fromId);
  const to = accounts.find((a) => a.id === toId);
  const crossCurrency = Boolean(
    from && to && from.currencyCode !== to.currencyCode,
  );

  useEffect(() => {
    if (!visible || Platform.OS !== "web" || typeof window === "undefined")
      return;
    suppressPop.current = false;
    window.history.pushState(
      { finoraTransferModal: true },
      "",
      window.location.href,
    );
    historyEntry.current = true;
    const handlePop = () => {
      if (suppressPop.current) {
        suppressPop.current = false;
        historyEntry.current = false;
        return;
      }
      if (historyEntry.current) {
        historyEntry.current = false;
        closeRef.current();
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("popstate", handlePop);
      if (historyEntry.current) {
        suppressPop.current = true;
        window.history.back();
        historyEntry.current = false;
      }
    };
  }, [visible]);

  function closeModal() {
    if (
      Platform.OS === "web" &&
      historyEntry.current &&
      typeof window !== "undefined"
    ) {
      suppressPop.current = true;
      historyEntry.current = false;
      window.history.back();
    }
    onClose();
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => visible,
        onMoveShouldSetPanResponder: (_event, gesture) =>
          visible &&
          gesture.dy > 6 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_event, gesture) => {
          if (gesture.dy > 0) translateY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy > 110 || gesture.vy > 0.9) {
            Animated.timing(translateY, {
              toValue: 700,
              duration: 180,
              useNativeDriver: Platform.OS !== "web",
            }).start(({ finished }) => {
              if (finished) closeModal();
            });
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: Platform.OS !== "web",
              damping: 24,
              stiffness: 260,
            }).start();
          }
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: () =>
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: Platform.OS !== "web",
          }).start(),
      }),
    [visible, translateY],
  );

  useEffect(() => {
    if (visible) translateY.setValue(0);
  }, [visible, translateY]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    const initialize = async () => {
      if (transaction?.type === "transfer") {
        setFromId(transaction.accountId);
        setToId(transaction.toAccountId ?? "");
        setAmount(String(transaction.amount));
        setToAmount(String(transaction.toAmount ?? transaction.amount));
        setDate(transaction.date);
        setNote(transaction.note ?? "");
      } else {
        let rememberedId = "";
        try {
          rememberedId =
            (await AsyncStorage.getItem("@finora/last-used-account")) ?? "";
        } catch {}
        const first =
          accounts.find((a) => a.id === rememberedId) ?? accounts[0];
        const second = accounts.find((a) => a.id !== first?.id);
        if (!active) return;
        setFromId(first?.id ?? "");
        setToId(second?.id ?? "");
        setAmount("");
        setToAmount("");
        setDate(today());
        setNote("");
      }
      setError("");
    };
    void initialize();
    return () => {
      active = false;
    };
  }, [visible, transaction, accounts]);

  function save() {
    const value = Number(amount.replace(",", ".").trim());
    const credited = crossCurrency
      ? Number(toAmount.replace(",", ".").trim())
      : value;
    if (!Number.isFinite(value) || value <= 0) {
      setError(t("validation.amountMustBePositive"));
      return;
    }
    if (!fromId) {
      setError(t("transactions.validation.accountRequired"));
      return;
    }
    if (!toId) {
      setError(t("transactions.validation.destinationRequired"));
      return;
    }
    if (fromId === toId) {
      setError(t("transactions.validation.differentAccounts"));
      return;
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(new Date(`${date}T00:00:00`).getTime())
    ) {
      setError(t("transactions.validation.dateRequired"));
      return;
    }
    if (crossCurrency && (!Number.isFinite(credited) || credited <= 0)) {
      setError(t("transactions.validation.destinationAmountRequired"));
      return;
    }
    const draft: TransactionDraft = {
      type: "transfer",
      amount: value,
      toAmount: credited,
      accountId: fromId,
      toAccountId: toId,
      categoryId: null,
      date,
      note: note.trim(),
    };
    if (transaction) updateTransaction(transaction.id, draft);
    else addTransaction(draft);
    void AsyncStorage.setItem("@finora/last-used-account", fromId).catch(
      () => {},
    );
    closeModal();
  }

  function swapAccounts() {
    if (!fromId || !toId) return;

    setFromId(toId);
    setToId(fromId);

    setAmount(toAmount);
    setToAmount(amount);

    setError("");
  }

  const accountPicker = (kind: "from" | "to") => (
    <Modal
      visible={picker === kind}
      transparent
      animationType="slide"
      onRequestClose={() => setPicker(null)}
    >
      <View
        className="flex-1 justify-end bg-black/50"
        style={vars(getThemeCssVariables(colors))}
      >
        <Pressable
          className="absolute inset-0"
          onPress={() => setPicker(null)}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
        />
        <View
          className="max-h-[70%] rounded-t-[24px] border border-border bg-background p-5"
          style={[
            vars(getThemeCssVariables(colors)),
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-extrabold text-foreground">
              {kind === "from"
                ? t("transactions.fromAccount")
                : t("transactions.toAccount")}
            </Text>
            <Pressable onPress={() => setPicker(null)}>
              <Ionicons name="close" size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView>
            {accounts
              .filter((a) => kind === "from" || a.id !== fromId)
              .filter((a) => kind === "to" || a.id !== toId)
              .map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    if (kind === "from") setFromId(a.id);
                    else setToId(a.id);
                    setPicker(null);
                  }}
                  className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-surface p-3"
                >
                  <Ionicons name={a.icon} size={20} color={a.color} />
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">
                      {a.name}
                    </Text>
                    <Text className="text-xs text-muted">{a.currencyCode}</Text>
                  </View>
                  <Text className="text-sm font-bold text-foreground">
                    {formatCurrency(
                      calculateAccountBalance(a.id, transactions),
                      getCurrencyByCode(
                        a.currencyCode ?? DEFAULT_CURRENCY_CODE,
                      ),
                    )}
                  </Text>
                </Pressable>
              ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const accountField = (kind: "from" | "to") => {
    const account = kind === "from" ? from : to;
    return (
      <View className="gap-2">
        <Text className="text-xs font-bold uppercase text-muted">
          {kind === "from"
            ? t("transactions.fromAccount")
            : t("transactions.toAccount")}
        </Text>
        <Pressable
          onPress={() => setPicker(kind)}
          className="flex-row items-center gap-3 rounded-[14px] border border-border bg-surface p-3"
        >
          <Ionicons
            name={account?.icon ?? "wallet-outline"}
            size={20}
            color={account?.color ?? colors.subtle}
          />
          <View className="flex-1">
            <Text className="font-semibold text-foreground">
              {account?.name ?? t("transactions.selectAccount")}
            </Text>
            <Text className="text-xs text-muted">
              {account?.currencyCode ?? ""}
            </Text>
          </View>
          <Ionicons name="chevron-forward" color={colors.subtle} size={17} />
        </Pressable>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/50"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={vars(getThemeCssVariables(colors))}
      >
        <Pressable
          className="absolute inset-0"
          onPress={closeModal}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
        />
        <Animated.View
          className="max-h-[92%] rounded-t-[26px] border border-border bg-background"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
            transform: [{ translateY }],
          }}
        >
          <View
            className="items-center pb-2 pt-3"
            {...panResponder.panHandlers}
          >
            <View className="h-1.5 w-10 rounded-full bg-muted" />
          </View>
          <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
            <View>
              <Text className="text-lg font-extrabold text-foreground">
                {transaction
                  ? t("transactions.editTransfer")
                  : t("transactions.newTransfer")}
              </Text>
              <Text className="mt-1 text-xs text-muted">
                {t("transactions.transferDescription")}
              </Text>
            </View>
            <Pressable
              onPress={closeModal}
              className="h-9 w-9 items-center justify-center rounded-xl bg-surface"
            >
              <Ionicons name="close" size={21} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView
            className="shrink"
            contentContainerStyle={{ padding: 20, gap: 15 }}
            keyboardShouldPersistTaps="handled"
          >
            {accountField("from")}
            <View className="items-center">
              <View className="items-center">
                <Pressable
                  onPress={swapAccounts}
                  disabled={!fromId || !toId}
                  accessibilityRole="button"
                  accessibilityLabel="Поменять счета местами"
                  hitSlop={10}
                  className="rounded-full border border-border bg-accent-dark p-3 active:opacity-60"
                >
                  <Ionicons
                    name="swap-vertical"
                    size={20}
                    color={colors.accent}
                  />
                </Pressable>
              </View>
            </View>
            {accountField("to")}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t("transactions.amount")}
                {from ? ` · ${from.currencyCode}` : ""}
              </Text>
              <View className="flex-row items-center rounded-[15px] border border-border bg-surface px-4">
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0"
                  placeholderTextColor={colors.subtle}
                  keyboardType="decimal-pad"
                  className="min-w-0 flex-1 py-3 text-[24px] font-extrabold text-foreground"
                />
                <Text className="font-bold text-muted">
                  {
                    getCurrencyByCode(
                      from?.currencyCode ?? DEFAULT_CURRENCY_CODE,
                    ).symbol
                  }
                </Text>
              </View>
            </View>
            {crossCurrency ? (
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  {t("transactions.receivedAmount")} · {to?.currencyCode}
                </Text>
                <View className="flex-row items-center rounded-[15px] border border-border bg-surface px-4">
                  <TextInput
                    value={toAmount}
                    onChangeText={setToAmount}
                    placeholder="0"
                    placeholderTextColor={colors.subtle}
                    keyboardType="decimal-pad"
                    className="min-w-0 flex-1 py-3 text-[22px] font-extrabold text-foreground"
                  />
                  <Text className="font-bold text-muted">
                    {
                      getCurrencyByCode(
                        to?.currencyCode ?? DEFAULT_CURRENCY_CODE,
                      ).symbol
                    }
                  </Text>
                </View>
                <Text className="text-xs text-muted">
                  {t("transactions.transferCurrencyHint")}
                </Text>
              </View>
            ) : null}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t("transactions.date")}
              </Text>
              <DatePickerField
                value={date}
                onChange={setDate}
                label={t("transactions.date")}
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t("transactions.note")}
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t("transactions.notePlaceholder")}
                placeholderTextColor={colors.subtle}
                className="rounded-[14px] border border-border bg-surface px-4 py-3 text-sm text-foreground"
                maxLength={120}
              />
            </View>
            {error ? (
              <Text className="text-sm font-semibold text-expense">
                {error}
              </Text>
            ) : null}
          </ScrollView>
          <View className="border-t border-border px-5 py-4">
            <Pressable
              onPress={save}
              className="min-h-[50px] items-center justify-center rounded-[15px] bg-accent"
            >
              <Text
                className="font-bold"
                style={{ color: colors.accentContrastText }}
              >
                {transaction
                  ? t("transactions.saveChanges")
                  : t("transactions.transferAction")}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
      {accountPicker("from")}
      {accountPicker("to")}
    </Modal>
  );
}
