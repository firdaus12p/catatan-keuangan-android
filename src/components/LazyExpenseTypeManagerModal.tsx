import React, { useEffect, useState } from "react";
import { ActivityIndicator, InteractionManager } from "react-native";
import { Modal, Portal, Text } from "react-native-paper";
import { ExpenseType } from "../db/database";
import { colors } from "../styles/commonStyles";

interface LazyExpenseTypeManagerModalProps {
  visible: boolean;
  onDismiss: () => void;
  expenseTypes: ExpenseType[];
  onCreate: (name: string) => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

// ✅ OPTIMIZATION: Lazy load ExpenseTypeManagerModal (~50KB)
// Modal hanya di-load saat user membuka modal pertama kali
let ExpenseTypeManagerModalComponent: any = null;

export const LazyExpenseTypeManagerModal: React.FC<
  LazyExpenseTypeManagerModalProps
> = ({ visible, onDismiss, ...props }) => {
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  useEffect(() => {
    // Load modal component hanya saat visible=true untuk pertama kali
    if (visible && !ExpenseTypeManagerModalComponent && !isLoadingModal) {
      setIsLoadingModal(true);

      // Defer loading sampai UI idle
      const task = InteractionManager.runAfterInteractions(async () => {
        try {
          // Dynamic import modal component
          const module = await import("./ExpenseTypeManagerModal");
          ExpenseTypeManagerModalComponent = module.ExpenseTypeManagerModal;
          setIsComponentReady(true);
        } catch (error) {
          console.warn("Failed to load ExpenseTypeManagerModal:", error);
        } finally {
          setIsLoadingModal(false);
        }
      });

      return () => task.cancel();
    }

    // Jika component sudah pernah di-load, set ready immediately
    if (visible && ExpenseTypeManagerModalComponent) {
      setIsComponentReady(true);
    }
  }, [visible, isLoadingModal]);

  // Reset ready state saat modal ditutup untuk cleanup
  useEffect(() => {
    if (!visible) {
      setIsComponentReady(false);
    }
  }, [visible]);

  // Jika modal belum ready, tampilkan loading placeholder
  if (visible && !isComponentReady) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={{
            backgroundColor: "white",
            padding: 40,
            margin: 20,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={colors.income} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 14,
              color: colors.income,
              fontStyle: "italic",
            }}
          >
            Memuat modal...
          </Text>
        </Modal>
      </Portal>
    );
  }

  // Render actual modal jika sudah ready
  if (isComponentReady && ExpenseTypeManagerModalComponent) {
    return (
      <ExpenseTypeManagerModalComponent
        visible={visible}
        onDismiss={onDismiss}
        {...props}
      />
    );
  }

  // Jika tidak visible, return null
  return null;
};

LazyExpenseTypeManagerModal.displayName = "LazyExpenseTypeManagerModal";
