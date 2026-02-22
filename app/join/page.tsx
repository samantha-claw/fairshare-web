"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

// فصلنا المنطق جوه Component عشان Next.js 14 بيطلب Suspense لأي صفحة بتستخدم useSearchParams
function JoinGroupLogic() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Checking invite link...");

  const groupId = searchParams.get("id");
  const token = searchParams.get("token");

  useEffect(() => {
    let isMounted = true;

    const processJoin = async () => {
      if (!groupId) {
        if (isMounted) {
          setStatus("error");
          setMessage("Invalid invite link. Group ID is missing.");
        }
        return;
      }

      // 1. التأكد إن المستخدم مسجل دخول
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user || authError) {
        // لو مش مسجل، نوديه يسجل دخول ونحفظ الرابط ده عشان يرجعله تاني
        const currentUrl = encodeURIComponent(`/join?id=${groupId}${token ? `&token=${token}` : ""}`);
        router.push(`/login?next=${currentUrl}`); // غير مسار /login لو عندك مختلف
        return;
      }

      if (isMounted) setMessage("Joining group securely...");

      // 2. إرسال الطلب لـ Supabase (الدالة الآمنة)
      try {
        const { error } = await supabase.rpc("join_group_securely", {
          p_group_id: groupId,
          p_token: token || null,
        });

        if (error) {
          // لو المستخدم عضو بالفعل، هندخله الجروب برضه بدل ما نطلعله إيرور يضايقه
          if (error.message.includes("already a member")) {
            if (isMounted) {
              setStatus("success");
              setMessage("You are already a member! Redirecting...");
            }
            setTimeout(() => router.push(`/groups/${groupId}`), 1500);
            return;
          }
          throw new Error(error.message);
        }

        // 3. نجاح الانضمام
        if (isMounted) {
          setStatus("success");
          setMessage("Joined successfully! Redirecting to group...");
        }
        setTimeout(() => router.push(`/groups/${groupId}`), 1500); // تأكد إن ده مسار الجروب عندك (ممكن يكون /dashboard/groups/)

      } catch (err: any) {
        console.error("Join error:", err);
        if (isMounted) {
          setStatus("error");
          // رسائل خطأ واضحة للمستخدم
          setMessage(err.message || "Failed to join the group. The link might be expired.");
        }
      }
    };

    processJoin();

    return () => {
      isMounted = false;
    };
  }, [groupId, token, router, supabase]);

  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-2xl text-center">
      {status === "loading" && (
        <>
          <Loader2 className="h-16 w-16 animate-spin text-indigo-600 mb-6" />
          <h2 className="text-xl font-bold text-gray-900">Processing Invite...</h2>
          <p className="mt-2 text-sm text-gray-500">{message}</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="rounded-full bg-emerald-100 p-3 mb-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Welcome Aboard!</h2>
          <p className="mt-2 text-sm text-gray-500">{message}</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="rounded-full bg-red-100 p-3 mb-6">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Oops! Cannot Join</h2>
          <p className="mt-2 text-sm text-red-500">{message}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            Go to Dashboard
          </button>
        </>
      )}
    </div>
  );
}

// التغليف بـ Suspense إجباري في Next.js عشان قراءة الرابط
export default function JoinPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />}>
        <JoinGroupLogic />
      </Suspense>
    </div>
  );
}
