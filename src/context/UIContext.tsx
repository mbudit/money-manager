
import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import type { Transaction } from "../types";

interface UIContextType {
    isAddTransactionModalOpen: boolean;
    editingTransaction: Transaction | undefined;
    openAddTransactionModal: (transaction?: Transaction) => void;
    closeAddTransactionModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] =
        useState(false);
    const [editingTransaction, setEditingTransaction] = useState<
        Transaction | undefined
    >(undefined);

    const openAddTransactionModal = useCallback(
        (transaction?: Transaction) => {
            setEditingTransaction(transaction);
            setIsAddTransactionModalOpen(true);
        },
        [],
    );

    const closeAddTransactionModal = useCallback(() => {
        setIsAddTransactionModalOpen(false);
        setEditingTransaction(undefined);
    }, []);

    return (
        <UIContext.Provider
            value={{
                isAddTransactionModalOpen,
                editingTransaction,
                openAddTransactionModal,
                closeAddTransactionModal,
            }}
        >
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error("useUI must be used within a UIProvider");
    }
    return context;
}
