"use client";

import React, { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/* ════════════════════════════════════════════════════════════
   INTERFACES
   ════════════════════════════════════════════════════════════ */
interface Group {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
}

interface Member {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  profiles: { username: string; full_name: string; avatar_url: string };
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  created_at: string;
  paid_by: string;
  profiles: { full_name: string; username: string }; // Who paid?
}

interface SearchResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function GroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const supabase = createClient();

  // ── State ────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]); // New State for Expenses
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // ── Modal States ─────────────────────────────────────────
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false); // New Modal

  // ── Search Member State ──────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingMember, setAddingMember] = useState<string | null>(null);

  // ── Add Expense State ────────────────────────────────────
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [submittingExpense, setSubmittingExpense] = useState(false);

  /* ════════════════════════════════════════════════════════════
     DATA FETCHING
     ════════════════════════════════════════════════════════════ */
  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      setCurrentUser(session.user.id);

      // 1. Fetch Group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();
      
      if (groupError) throw groupError;
      setGroup(groupData as Group);

      // 2. Fetch Members
      const { data: membersData } = await supabase
        .from("group_members")
        .select(`*, profiles ( username, full_name, avatar_url )`)
        .eq("group_id", groupId);

      if (membersData) {
        // @ts-ignore
        setMembers(membersData.map(m => ({
          id: m.user_id, // Important: use user_id not row id
          ...m.profiles,
          profiles: m.profiles
        })));
      }

      // 3. Fetch Expenses (New)
      const { data: expensesData, error: expError } = await supabase
        .from("expenses")
        .select(`
          id, title, amount, created_at, paid_by,
          profiles:paid_by ( full_name, username )
        `)
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (expError) console.error("Error fetching expenses:", expError);
      if (expensesData) {
        // @ts-ignore
        setExpenses(expensesData);
      }

    } catch (err) {
      console.error(err);
      setError("Failed to load group data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [groupId]);

  /* ════════════════════════════════════════════════════════════
     HANDLERS
     ════════════════════════════════════════════════════════════ */
  
  // 1. Add Member Logic
  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearching(true);
    const { data } = await supabase.rpc("search_users", { search_term: searchTerm.toLowerCase() });
    setSearchResults(data || []);
    setSearching(false);
  }

  async function handleAddMember(targetUserId: string) {
    setAddingMember(targetUserId);
    const { error } = await supabase.rpc("add_member_to_group", { _group_id: groupId, _user_id: targetUserId });
    if (!error) {
      setIsMemberModalOpen(false);
      setSearchTerm("");
      fetchData(); // Refresh list
    } else {
      alert(error.message);
    }
    setAddingMember(null);
  }

  // 2. Add Expense Logic (The New Magic ✨)
  async function handleAddExpense(e: FormEvent) {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;
    setSubmittingExpense(true);

    const { error } = await supabase.rpc("add_expense_equal_split", {
      _group_id: groupId,
      _title: expenseTitle,
      _amount: parseFloat(expenseAmount)
    });

    if (error) {
      alert("Error adding expense: " + error.message);
    } else {
      // Success! Reset and Refresh
      setIsExpenseModalOpen(false);
      setExpenseTitle("");
      setExpenseAmount("");
      fetchData(); // Refresh expenses list
    }
    setSubmittingExpense(false);
  }

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  if (loading) return <div className="p-10 text-center">Loading Group...</div>;
  if (error || !group) return <div className="p-10 text-center text-red-500">{error}</div>;

  const isOwner = currentUser === group.owner_id;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b px-6 py-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{members.length} members</p>
        </div>
        <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-500 hover:text-black">
          ← Dashboard
        </button>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* ── SECTION 1: MEMBERS ───────────────────────────── */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Members</h2>
            {isOwner && (
              <button onClick={() => setIsMemberModalOpen(true)} className="text-blue-600 text-sm font-medium hover:underline">
                + Add Member
              </button>
            )}
          </div>
          <div className="flex -space-x-2 overflow-hidden py-2">
            {members.map((m) => (
              <img key={m.id} className="inline-block h-10 w-10 rounded-full ring-2 ring-white" 
                   src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.full_name}`} 
                   title={m.full_name} alt={m.username} />
            ))}
          </div>
        </section>

        {/* ── SECTION 2: EXPENSES (The Core Feature) ────────── */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Expenses</h2>
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <span>💸</span> Add Expense
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">No expenses yet. Start adding!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => (
                <div key={exp.id} className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <div className="bg-gray-100 p-3 rounded-lg text-xl">🧾</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                      <p className="text-xs text-gray-500">
                        Paid by <span className="font-medium text-gray-700">{exp.profiles.full_name}</span> • {new Date(exp.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">${exp.amount}</p>
                    <p className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">Equal Split</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── MODAL: Add Member ─────────────────────────────── */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">Add New Member</h3>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input type="text" placeholder="Search username..." className="flex-1 border p-2 rounded-lg" 
                     value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <button type="submit" className="bg-blue-600 text-white px-4 rounded-lg">{searching ? "..." : "Search"}</button>
            </form>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map(u => (
                <div key={u.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span>{u.full_name}</span>
                  <button onClick={() => handleAddMember(u.id)} className="text-blue-600 font-medium text-sm">Add</button>
                </div>
              ))}
            </div>
            <button onClick={() => setIsMemberModalOpen(false)} className="mt-4 w-full py-2 text-gray-500">Cancel</button>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Expense (New) ──────────────────────── */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-bold text-xl mb-1">Add Expense</h3>
            <p className="text-sm text-gray-500 mb-6">Split equally among all members.</p>
            
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dinner at Cairo Spot" 
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                  value={expenseTitle}
                  onChange={e => setExpenseTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input 
                  type="number" 
                  required
                  step="0.01"
                  placeholder="0.00" 
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition font-mono text-lg"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsExpenseModalOpen(false)} 
                  className="flex-1 py-3 text-gray-600 font-medium bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingExpense}
                  className="flex-1 py-3 text-white font-medium bg-green-600 rounded-xl hover:bg-green-700 transition shadow-lg disabled:opacity-50"
                >
                  {submittingExpense ? "Adding..." : "Confirm Split"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
