"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("finsight_token");
    const userData = localStorage.getItem("finsight_user");
    if (!token) {
      router.replace("/");
      return;
    }
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        // ignore parse error
      }
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem("finsight_token");
    localStorage.removeItem("finsight_user");
    router.replace("/");
  };

  return { user, logout };
}
