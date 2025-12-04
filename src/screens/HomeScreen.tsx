import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { CategoryBalanceCard } from "../components/CategoryBalanceCard";
import { ExpenseCharts } from "../components/ExpenseCharts";
import { ExpenseTypeHighlight } from "../components/ExpenseTypeHighlight";
import { FinancialSummary } from "../components/FinancialSummary";
import { LazyExpenseTypeManagerModal } from "../components/LazyExpenseTypeManagerModal";
import { useApp } from "../context/AppContext";
import { ExpenseType } from "../db/database";
import { useAllocationValidator } from "../hooks/useAllocationValidator";
import { colors } from "../styles/commonStyles";
import { TIMING } from "../utils/constants";
import { getCurrentMonthYear, getMonthName } from "../utils/dateHelper";

// Hook untuk animasi count-up
const useCountUp = (
  targetValue: number,
  duration: number = TIMING.COUNTUP_DEFAULT
) => {
  const [currentValue, setCurrentValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetValue === 0) {
      setCurrentValue(0);
      return;
    }

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function untuk animasi yang lebih smooth
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setCurrentValue(targetValue * easedProgress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
        startTimeRef.current = null;
      }
    };

    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return Math.round(currentValue);
};

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const {
    categories,
    monthlyStats,
    loadCategories,
    loadMonthlyStats,
    addExpenseType,
    updateExpenseType,
    deleteExpenseType,
    getExpenseTypeTotalsByMonth,
    loadExpenseTypes,
    expenseTypes,
    initializeApp,
  } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState<"current" | "previous">(
    "current"
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isLoadingSelection, setIsLoadingSelection] = useState(true);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [expenseTypeManagerVisible, setExpenseTypeManagerVisible] =
    useState(false);
  const [expenseTypeBreakdown, setExpenseTypeBreakdown] = useState<
    ExpenseType[]
  >([]);
  const [summarySnapshot, setSummarySnapshot] = useState<{
    totalSaldo: number;
    saldoBersih: number;
  } | null>(null);

  useEffect(() => {
    if (selectedPeriod === "current") {
      setSummarySnapshot({
        totalSaldo: monthlyStats.totalSaldo,
        saldoBersih: monthlyStats.saldoBersih,
      });
    }
  }, [monthlyStats.totalSaldo, monthlyStats.saldoBersih, selectedPeriod]);

  const displayTotalSaldo =
    summarySnapshot?.totalSaldo ?? monthlyStats.totalSaldo;
  const displaySaldoBersih =
    summarySnapshot?.saldoBersih ?? monthlyStats.saldoBersih;

  // Hook untuk animasi count-up Saldo Bersih
  const animatedSaldoBersih = useCountUp(
    displaySaldoBersih,
    TIMING.COUNTUP_NET
  );

  // Hook untuk animasi count-up saldo kategori (fixed amount untuk menghindari hook rules violation)
  const selectedCategories = useMemo(() => {
    return categories.filter(
      (cat) => cat.id && selectedCategoryIds.includes(cat.id)
    );
  }, [categories, selectedCategoryIds]);

  // Pre-define hooks untuk maksimal 2 kategori (sesuai design app)
  const category1Balance = selectedCategories[0]?.balance || 0;
  const category2Balance = selectedCategories[1]?.balance || 0;

  const animatedCategory1Balance = useCountUp(
    category1Balance,
    TIMING.COUNTUP_BALANCE
  );
  const animatedCategory2Balance = useCountUp(
    category2Balance,
    TIMING.COUNTUP_BALANCE
  );

  // Hook untuk animasi Total Gabungan kategori
  const totalCombinedBalance = useMemo(() => {
    return selectedCategories.reduce((sum, cat) => sum + cat.balance, 0);
  }, [selectedCategories]);

  const animatedTotalCombined = useCountUp(
    totalCombinedBalance,
    TIMING.COUNTUP_TOTAL
  );

  // Helper function untuk mendapatkan nilai animasi berdasarkan index
  const getAnimatedCategoryBalance = useCallback(
    (index: number) => {
      if (index === 0) return animatedCategory1Balance;
      if (index === 1) return animatedCategory2Balance;
      return 0;
    },
    [animatedCategory1Balance, animatedCategory2Balance]
  );

  // ✅ OPTIMIZED: Memoize current date to avoid repeated Date creation
  const currentDate = useMemo(() => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }, []);

  const resolvePeriodDate = useCallback(
    (period: "current" | "previous") => {
      if (period === "current") {
        return currentDate;
      }

      const prevMonth = currentDate.month === 1 ? 12 : currentDate.month - 1;
      const prevYear =
        currentDate.month === 1 ? currentDate.year - 1 : currentDate.year;
      return { month: prevMonth, year: prevYear };
    },
    [currentDate]
  );

  const refreshExpenseBreakdown = useCallback(
    async (period: "current" | "previous") => {
      const { month, year } = resolvePeriodDate(period);
      const breakdown = await getExpenseTypeTotalsByMonth(year, month);
      setExpenseTypeBreakdown(breakdown);
    },
    [getExpenseTypeTotalsByMonth, resolvePeriodDate]
  );

  // Initialize app dan load data
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;

      const initApp = async () => {
        if (cancelled) return;
        if (!isInitialized) {
          await initializeApp();
          setIsInitialized(true);
        } else {
          await loadCategories();
          await loadExpenseTypes();

          const target = resolvePeriodDate(selectedPeriod);
          await loadMonthlyStats(target.year, target.month);
        }

        await refreshExpenseBreakdown(selectedPeriod);
      };

      void initApp();

      return () => {
        cancelled = true;
      };
    }, [
      initializeApp,
      isInitialized,
      loadCategories,
      loadExpenseTypes,
      loadMonthlyStats,
      refreshExpenseBreakdown,
      resolvePeriodDate,
      selectedPeriod,
    ])
  );

  // Load saved category selection dari AsyncStorage
  useEffect(() => {
    const loadSavedSelection = async () => {
      try {
        const saved = await AsyncStorage.getItem("@selectedCategoryIds");
        if (saved) {
          const parsed = JSON.parse(saved) as number[];
          setSelectedCategoryIds(parsed);
        }
      } catch (error) {
      } finally {
        setIsLoadingSelection(false);
      }
    };

    loadSavedSelection();
  }, []);

  // Auto-select top 2 categories with highest balance as default (hanya jika belum ada saved selection)
  useFocusEffect(
    React.useCallback(() => {
      if (
        !isLoadingSelection &&
        categories.length > 0 &&
        selectedCategoryIds.length === 0
      ) {
        const topCategories = categories
          .filter((cat) => cat.balance > 0 && cat.id)
          .sort((a, b) => b.balance - a.balance)
          .slice(0, 2)
          .map((cat) => cat.id!);

        setSelectedCategoryIds(topCategories);
      }
    }, [categories, selectedCategoryIds.length, isLoadingSelection])
  );

  // Gunakan custom hook untuk validasi alokasi
  const { hasCategories, validateAllocationForNavigation } =
    useAllocationValidator();

  // Helper functions untuk kategori selector dengan useCallback
  const handleCategoryToggle = useCallback((categoryId: number) => {
    setSelectedCategoryIds((prev) => {
      const isSelected = prev.includes(categoryId);
      let newSelection: number[];

      if (isSelected) {
        newSelection = prev.filter((id) => id !== categoryId);
      } else if (prev.length < 2) {
        // ✅ OPTIMIZED: Use .concat() for single item append
        newSelection = prev.concat(categoryId);
      } else {
        return prev;
      }

      // Save ke AsyncStorage
      // ✅ OPTIMIZED: Silent error handling - no console.error in production
      AsyncStorage.setItem(
        "@selectedCategoryIds",
        JSON.stringify(newSelection)
      ).catch(() => {
        // Silently fail - AsyncStorage errors are non-critical
      });

      return newSelection;
    });
  }, []);

  const toggleCategorySelector = useCallback(() => {
    setShowCategorySelector((prev) => !prev);
  }, []);

  const openExpenseTypeManager = useCallback(() => {
    setExpenseTypeManagerVisible(true);
  }, []);

  const closeExpenseTypeManager = useCallback(() => {
    setExpenseTypeManagerVisible(false);
  }, []);

  const handleCreateExpenseType = useCallback(
    async (name: string) => {
      await addExpenseType(name);
      await refreshExpenseBreakdown(selectedPeriod);
    },
    [addExpenseType, refreshExpenseBreakdown, selectedPeriod]
  );

  const handleUpdateExpenseType = useCallback(
    async (id: number, name: string) => {
      await updateExpenseType(id, name);
      await refreshExpenseBreakdown(selectedPeriod);
    },
    [refreshExpenseBreakdown, selectedPeriod, updateExpenseType]
  );

  const handleDeleteExpenseType = useCallback(
    async (id: number) => {
      await deleteExpenseType(id);
      await refreshExpenseBreakdown(selectedPeriod);
    },
    [deleteExpenseType, refreshExpenseBreakdown, selectedPeriod]
  );

  const handleTransactionNavigation = useCallback(
    (type: "income" | "expense") => {
      if (!validateAllocationForNavigation()) {
        return;
      }

      router.push({
        pathname: "/(tabs)/transaction",
        params: { action: type },
      } as any);
    },
    [validateAllocationForNavigation, router]
  );

  const handlePeriodChange = useCallback(
    async (period: "current" | "previous") => {
      setSelectedPeriod(period);
      const target = resolvePeriodDate(period);
      await loadMonthlyStats(target.year, target.month);
      await refreshExpenseBreakdown(period);
    },
    [loadMonthlyStats, refreshExpenseBreakdown, resolvePeriodDate]
  );

  // Data untuk chart
  const { month, year } = getCurrentMonthYear();
  const currentMonthName = getMonthName(month);
  const previousMonthName = getMonthName(month === 1 ? 12 : month - 1);

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title="💸 Kemenku"
          subtitle="Aplikasi Catatan Keuangan"
          titleStyle={styles.headerTitle}
          subtitleStyle={styles.headerSubtitle}
        />
        <Appbar.Action
          icon="cog"
          iconColor="#FFFFFF"
          onPress={() => router.push("/reset" as any)}
          style={{ marginTop: -20 }}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FinancialSummary
          currentMonthName={currentMonthName}
          previousMonthName={previousMonthName}
          year={year}
          selectedPeriod={selectedPeriod}
          totalSaldo={displayTotalSaldo}
          totalIncome={monthlyStats.totalIncome}
          totalExpense={monthlyStats.totalExpense}
          saldoBersih={displaySaldoBersih}
          animatedSaldoBersih={animatedSaldoBersih}
          onPeriodChange={handlePeriodChange}
        />

        <CategoryBalanceCard
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          showCategorySelector={showCategorySelector}
          animatedCategory1Balance={animatedCategory1Balance}
          animatedCategory2Balance={animatedCategory2Balance}
          animatedTotalCombined={animatedTotalCombined}
          onToggleSelector={toggleCategorySelector}
          onCategoryToggle={handleCategoryToggle}
        />

        <ExpenseCharts categories={categories} />

        <ExpenseTypeHighlight
          expenseTypeBreakdown={expenseTypeBreakdown}
          onOpenManager={openExpenseTypeManager}
        />
      </ScrollView>

      <LazyExpenseTypeManagerModal
        visible={expenseTypeManagerVisible}
        onDismiss={closeExpenseTypeManager}
        expenseTypes={expenseTypes}
        onCreate={handleCreateExpenseType}
        onUpdate={handleUpdateExpenseType}
        onDelete={handleDeleteExpenseType}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: colors.home,
    elevation: 4,
    height: 20,
    minHeight: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    marginTop: -25,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#E3F2FD",
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 75,
  },
});
