import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type {
  Account,
  Transaction,
  Category,
  RecurringTransaction,
  Bucket,
} from "../types";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  runTransaction,
  query,
  orderBy,
  writeBatch,
  getDocs,
  increment,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";

interface MoneyContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  buckets: Bucket[]; // Added
  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  addAccount: (account: Omit<Account, "id">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateAccountBalance: (id: string, amount: number) => Promise<void>;
  updateAccount: (
    id: string,
    data: Partial<Omit<Account, "id">>,
  ) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addRecurringTransaction: (
    rt: Omit<RecurringTransaction, "id" | "active" | "nextDueDate">,
  ) => Promise<void>;
  addBucket: (bucket: Omit<Bucket, "id">) => Promise<void>;
  updateBucket: (id: string, data: Partial<Bucket>) => Promise<void>;
  deleteBucket: (id: string) => Promise<void>;
  loading: boolean;
}

const MoneyContext = createContext<MoneyContextType | undefined>(undefined);

const INITIAL_CATEGORIES: Omit<Category, "id">[] = [
  // { name: "Food", type: "expense", color: "#EF4444" },
  // { name: "Transport", type: "expense", color: "#F59E0B" },
  // { name: "Bills", type: "expense", color: "#10B981" },
  // { name: "Salary", type: "income", color: "#3B82F6" },
];

const INITIAL_ACCOUNTS: Omit<Account, "id">[] = [
  // { name: "Cash", type: "cash", balance: 0, color: "#10B981" },
];

const MoneyProviderInner = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]); // Added
  const [loading, setLoading] = useState(!!user);

  // Initialize data for new users
  useEffect(() => {
    const initializeData = async () => {
      if (!user) return;

      const categoriesRef = collection(db, `users/${user.uid}/categories`);
      const accountsRef = collection(db, `users/${user.uid}/accounts`);

      const [catSnapshot, accSnapshot] = await Promise.all([
        getDocs(categoriesRef),
        getDocs(accountsRef),
      ]);

      if (catSnapshot.empty && accSnapshot.empty) {
        const batch = writeBatch(db);

        INITIAL_CATEGORIES.forEach((cat) => {
          const docRef = doc(categoriesRef);
          batch.set(docRef, cat);
        });

        INITIAL_ACCOUNTS.forEach((acc) => {
          const docRef = doc(accountsRef);
          batch.set(docRef, acc);
        });

        await batch.commit();
      }
    };

    initializeData();
  }, [user]);

  // Subscriptions
  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubAccounts = onSnapshot(
      query(collection(db, `users/${user.uid}/accounts`)),
      (snapshot) => {
        setAccounts(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Account),
        );
      },
    );

    const unsubTransactions = onSnapshot(
      query(
        collection(db, `users/${user.uid}/transactions`),
        orderBy("date", "desc"),
      ),
      (snapshot) => {
        setTransactions(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction),
        );
      },
    );

    const unsubCategories = onSnapshot(
      query(collection(db, `users/${user.uid}/categories`)),
      (snapshot) => {
        setCategories(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Category),
        );
      },
    );

    const unsubRecurring = onSnapshot(
      query(collection(db, `users/${user.uid}/recurringTransactions`)),
      (snapshot) => {
        setRecurringTransactions(
          snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as RecurringTransaction,
          ),
        );
      },
    );

    const unsubBuckets = onSnapshot(
      query(collection(db, `users/${user.uid}/buckets`)),
      (snapshot) => {
        setBuckets(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Bucket),
        );
        setLoading(false); // Move setLoading(false) here or keep it in last sub?
        // Best to do it in Promise.all for initial load but for snapshot it's tricky.
        // We'll leave it here as it was before, just triggering after buckets load too.
      },
    );

    return () => {
      unsubAccounts();
      unsubTransactions();
      unsubCategories();
      unsubRecurring();
      unsubBuckets(); // Added
    };
  }, [user]);

  // Check recurring transactions
  useEffect(() => {
    const checkRecurring = async () => {
      if (!user || recurringTransactions.length === 0) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const batch = writeBatch(db);
      let hasUpdates = false;

      for (const rt of recurringTransactions) {
        const dueDate = new Date(rt.nextDueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (rt.active && dueDate <= today) {
          hasUpdates = true;

          // Create new transaction
          const newTransactionRef = doc(
            collection(db, `users/${user.uid}/transactions`),
          );
          const transactionData: Transaction = {
            id: newTransactionRef.id,
            amount: rt.amount,
            type: rt.type,
            categoryId: rt.categoryId,
            accountId: rt.accountId,
            toAccountId: rt.toAccountId,
            date: rt.nextDueDate,
            note: `Recurring: ${rt.note || ""}`,
          };
          batch.set(newTransactionRef, transactionData);

          // Update recurring next due date
          const nextDate = new Date(dueDate);
          switch (rt.frequency) {
            case "daily":
              nextDate.setDate(nextDate.getDate() + 1);
              break;
            case "weekly":
              nextDate.setDate(nextDate.getDate() + 7);
              break;
            case "monthly":
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;
            case "yearly":
              nextDate.setFullYear(nextDate.getFullYear() + 1);
              break;
          }

          const rtRef = doc(
            db,
            `users/${user.uid}/recurringTransactions`,
            rt.id,
          );
          batch.update(rtRef, {
            nextDueDate: nextDate.toISOString().split("T")[0],
          });

          // Update Account Balance
          const accountRef = doc(
            db,
            `users/${user.uid}/accounts`,
            rt.accountId,
          );
          let amountChange = 0;
          if (rt.type === "expense") amountChange = -rt.amount;
          else if (rt.type === "income") amountChange = rt.amount;
          else if (rt.type === "transfer") amountChange = -rt.amount;

          batch.update(accountRef, { balance: increment(amountChange) });

          if (rt.type === "transfer" && rt.toAccountId) {
            const toAccountRef = doc(
              db,
              `users/${user.uid}/accounts`,
              rt.toAccountId,
            );
            batch.update(toAccountRef, { balance: increment(rt.amount) });
          }
        }
      }

      if (hasUpdates) {
        await batch.commit();
        // Note: We need to handle balance updates. Since we can't do `increment` on the client easily
        // without importing it... wait, we can import it.
      }
    };

    checkRecurring();
  }, [user, recurringTransactions]);
  // Warning: recurringTransactions changes when we update it. Infinite loop risk if logic is wrong.
  // The check `dueDate <= today` should prevent infinite loop as we advance the date.

  const addTransaction = async (transactionData: Omit<Transaction, "id">) => {
    if (!user) return;

    await runTransaction(db, async (transaction) => {
      console.log("Starting runTransaction payload:", transactionData);
      // 1. Get all necessary docs first (Reads must come before Writes)
      const accountRef = doc(
        db,
        `users/${user.uid}/accounts`,
        transactionData.accountId,
      );
      const accountDoc = await transaction.get(accountRef);
      if (!accountDoc.exists()) throw new Error("Account does not exist");

      let toAccountDoc;
      let toAccountRef;
      if (transactionData.type === "transfer" && transactionData.toAccountId) {
        toAccountRef = doc(
          db,
          `users/${user.uid}/accounts`,
          transactionData.toAccountId,
        );
        toAccountDoc = await transaction.get(toAccountRef);
        if (!toAccountDoc.exists())
          throw new Error("Target account does not exist");
      }

      // 2. Calculate new balance for Source Account
      let newBalance = accountDoc.data().balance;
      if (transactionData.type === "expense") {
        newBalance -= transactionData.amount;
      } else if (transactionData.type === "income") {
        newBalance += transactionData.amount;
      } else if (transactionData.type === "transfer") {
        newBalance -= transactionData.amount;
      }

      // 3. Perform Writes
      transaction.update(accountRef, { balance: newBalance });

      // Handle Transfer target write
      if (transactionData.type === "transfer" && toAccountRef && toAccountDoc) {
        const toBalance = toAccountDoc.data().balance + transactionData.amount;
        transaction.update(toAccountRef, { balance: toBalance });
      }

      // 4. Create Transaction
      const newTransactionRef = doc(
        collection(db, `users/${user.uid}/transactions`),
      );

      // Sanitize data to remove undefined fields which Firestore hates
      const cleanData = Object.fromEntries(
        Object.entries({
          ...transactionData,
          id: newTransactionRef.id,
        }).filter(([, v]) => v !== undefined),
      );

      transaction.set(newTransactionRef, cleanData);
    });
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    await runTransaction(db, async (transaction) => {
      // 1. READS
      const txRef = doc(db, `users/${user.uid}/transactions`, id);
      const txDoc = await transaction.get(txRef);
      if (!txDoc.exists()) throw new Error("Transaction does not exist");

      const txData = txDoc.data() as Transaction;

      const accountRef = doc(
        db,
        `users/${user.uid}/accounts`,
        txData.accountId,
      );
      const accountDoc = await transaction.get(accountRef);

      let toAccountDoc;
      let toAccountRef;
      if (txData.type === "transfer" && txData.toAccountId) {
        toAccountRef = doc(
          db,
          `users/${user.uid}/accounts`,
          txData.toAccountId,
        );
        toAccountDoc = await transaction.get(toAccountRef);
      }

      // 2. WRITES

      // Revert balance Source
      if (accountDoc.exists()) {
        let newBalance = accountDoc.data().balance;
        if (txData.type === "expense") {
          newBalance += txData.amount;
        } else if (txData.type === "income") {
          newBalance -= txData.amount;
        } else if (txData.type === "transfer") {
          newBalance += txData.amount;
        }
        transaction.update(accountRef, { balance: newBalance });
      }

      // Revert balance Target
      if (
        txData.type === "transfer" &&
        toAccountRef &&
        toAccountDoc &&
        toAccountDoc.exists()
      ) {
        const toBalance = toAccountDoc.data().balance - txData.amount;
        transaction.update(toAccountRef, { balance: toBalance });
      }

      transaction.delete(txRef);
    });
  };

  const addAccount = async (accountData: Omit<Account, "id">) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/accounts`), accountData);
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/accounts`, id));
  };

  const updateAccountBalance = async (id: string, amount: number) => {
    if (!user) return;
    const accountRef = doc(db, `users/${user.uid}/accounts`, id);
    await updateDoc(accountRef, { balance: amount });
  };

  const updateAccount = async (
    id: string,
    data: Partial<Omit<Account, "id">>,
  ) => {
    if (!user) return;
    const accountRef = doc(db, `users/${user.uid}/accounts`, id);
    await updateDoc(accountRef, data);
  };

  const addRecurringTransaction = async (
    rtData: Omit<RecurringTransaction, "id" | "active" | "nextDueDate">,
  ) => {
    if (!user) return;
    const newRt = {
      ...rtData,
      active: true,
      nextDueDate: rtData.startDate,
    };
    await addDoc(
      collection(db, `users/${user.uid}/recurringTransactions`),
      newRt,
    );
  };

  const addCategory = async (categoryData: Omit<Category, "id">) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/categories`), categoryData);
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/categories`, id));
  };

  const addBucket = async (bucketData: Omit<Bucket, "id">) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/buckets`), bucketData);
  };

  const updateBucket = async (id: string, data: Partial<Bucket>) => {
    if (!user) return;
    const bucketRef = doc(db, `users/${user.uid}/buckets`, id);
    await updateDoc(bucketRef, data);
  };

  const deleteBucket = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/buckets`, id));
  };

  return (
    <MoneyContext.Provider
      value={{
        accounts,
        transactions,
        categories,
        buckets,
        addCategory,
        deleteCategory,
        addTransaction,
        addAccount,
        deleteTransaction,
        updateAccountBalance,
        updateAccount,
        deleteAccount,
        addRecurringTransaction,
        addBucket,
        updateBucket,
        deleteBucket,
        loading,
      }}
    >
      {children}
    </MoneyContext.Provider>
  );
};

export const MoneyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  return <MoneyProviderInner key={user?.uid}>{children}</MoneyProviderInner>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMoney = () => {
  const context = useContext(MoneyContext);
  if (context === undefined) {
    throw new Error("useMoney must be used within a MoneyProvider");
  }
  return context;
};
