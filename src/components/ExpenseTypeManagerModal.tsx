import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { ExpenseType } from "../db/database";
import { colors } from "../styles/commonStyles";
import { showConfirm, showError } from "../utils/alertHelper";
import { formatCurrency } from "../utils/formatCurrency";

interface ExpenseTypeManagerModalProps {
  visible: boolean;
  onDismiss: () => void;
  expenseTypes: ExpenseType[];
  onCreate: (name: string) => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export const ExpenseTypeManagerModal: React.FC<ExpenseTypeManagerModalProps> =
  React.memo(
    ({ visible, onDismiss, expenseTypes, onCreate, onUpdate, onDelete }) => {
      const [name, setName] = useState("");
      const [editingId, setEditingId] = useState<number | null>(null);
      const [submitting, setSubmitting] = useState(false);

      const resetForm = useCallback(() => {
        setName("");
        setEditingId(null);
      }, []);

      const handleDismiss = useCallback(() => {
        resetForm();
        onDismiss();
      }, [onDismiss, resetForm]);

      const actionLabel = useMemo(
        () => (editingId ? "Simpan Perubahan" : "Tambah Jenis"),
        [editingId]
      );

      const titleLabel = useMemo(
        () => (editingId ? "Edit Jenis Pengeluaran" : "Jenis Pengeluaran Baru"),
        [editingId]
      );

      const handleSubmit = useCallback(async () => {
        if (submitting) {
          return;
        }

        const trimmedName = name.trim();
        if (!trimmedName) {
          showError("Nama jenis pengeluaran tidak boleh kosong.");
          return;
        }

        try {
          setSubmitting(true);
          if (editingId) {
            await onUpdate(editingId, trimmedName);
          } else {
            await onCreate(trimmedName);
          }
          resetForm();
        } catch (error) {
          showError(
            editingId
              ? "Gagal memperbarui jenis pengeluaran."
              : "Gagal menambahkan jenis pengeluaran."
          );
        } finally {
          setSubmitting(false);
        }
      }, [submitting, name, editingId, onCreate, onUpdate, resetForm]);

      const handleEdit = useCallback((type: ExpenseType) => {
        if (!type.id) return;
        setEditingId(type.id);
        setName(type.name);
      }, []);

      const handleDelete = useCallback(
        (type: ExpenseType) => {
          if (!type.id || submitting) return;

          showConfirm(
            "Hapus Jenis",
            `Anda yakin ingin menghapus "${type.name}"?`,
            async () => {
              try {
                setSubmitting(true);
                await onDelete(type.id!);
                if (editingId === type.id) {
                  resetForm();
                }
              } catch (error) {
                showError("Gagal menghapus jenis pengeluaran.");
              } finally {
                setSubmitting(false);
              }
            }
          );
        },
        [onDelete, submitting, editingId, resetForm]
      );

      return (
        <Portal>
          <Modal
            visible={visible}
            onDismiss={handleDismiss}
            contentContainerStyle={styles.container}
          >
            <Text style={styles.title}>Kelola Jenis Pengeluaran</Text>

            <Text style={styles.subtitle}>{titleLabel}</Text>
            <TextInput
              label="Nama jenis pengeluaran"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              autoCorrect={false}
              placeholder="Contoh: Transportasi"
            />

            <View style={styles.formActions}>
              {editingId && (
                <Button
                  onPress={resetForm}
                  mode="text"
                  compact
                  disabled={submitting}
                >
                  Batal Edit
                </Button>
              )}
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
                style={styles.submitButton}
              >
                {actionLabel}
              </Button>
            </View>

            <Text style={styles.listTitle}>
              Daftar Jenis ({expenseTypes.length})
            </Text>

            {expenseTypes.length === 0 ? (
              <Text style={styles.emptyText}>
                Belum ada jenis pengeluaran. Tambahkan untuk mulai
                mengelompokkan pengeluaran.
              </Text>
            ) : (
              <ScrollView style={styles.listScroll} nestedScrollEnabled>
                {expenseTypes.map((type) => (
                  <View key={type.id} style={styles.listItem}>
                    <View style={styles.listInfo}>
                      <Text style={styles.listName}>{type.name}</Text>
                      <Text style={styles.listAmount}>
                        Total: {formatCurrency(type.total_spent)}
                      </Text>
                    </View>
                    <View style={styles.listActions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEdit(type)}
                        accessibilityLabel={`Edit ${type.name}`}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor={colors.error}
                        onPress={() => handleDelete(type)}
                        accessibilityLabel={`Hapus ${type.name}`}
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <Button
              mode="text"
              onPress={handleDismiss}
              style={styles.closeButton}
              disabled={submitting}
            >
              Selesai
            </Button>
          </Modal>
        </Portal>
      );
    }
  ); // ✅ FIXED: Added missing closing parenthesis for React.memo

const styles = StyleSheet.create({
  container: {
    margin: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 16,
  },
  submitButton: {
    marginLeft: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  listScroll: {
    maxHeight: 240,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  listInfo: {
    flex: 1,
    marginRight: 8,
  },
  listName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  listAmount: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
});

ExpenseTypeManagerModal.displayName = "ExpenseTypeManagerModal";
