import type {
  Transaction,
  TransactionType,
} from "@/shared/transactions/transactionTypes";
import IncomeExpenseEditorModal from "./IncomeExpenseEditorModal";
import TransferEditorModal from "./TransferEditorModal";

type Props = {
  visible: boolean;
  initialType: TransactionType;
  transaction?: Transaction | null;
  onClose: () => void;
};

export default function TransactionEditorModal({
  visible,
  initialType,
  transaction = null,
  onClose,
}: Props) {
  const isTransfer =
    transaction?.type === "transfer" ||
    (!transaction && initialType === "transfer");
  if (isTransfer)
    return (
      <TransferEditorModal
        visible={visible}
        transaction={transaction}
        onClose={onClose}
      />
    );
  return (
    <IncomeExpenseEditorModal
      visible={visible}
      initialType={initialType === "income" ? "income" : "expense"}
      transaction={transaction}
      onClose={onClose}
    />
  );
}
