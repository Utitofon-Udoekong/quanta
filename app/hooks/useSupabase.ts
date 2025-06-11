import { SupabaseClient } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { cookieName } from "@/app/utils/supabase";
import { getSupabase } from "@/app/utils/supabase/client";
import Cookies from 'js-cookie';

export function useWalletSupabase(walletAddress?: string) {
    const [supabase, setSupabase] = useState<SupabaseClient<any, "public", any> | null>(null);
  
    useEffect(() => {
      const accessToken = Cookies.get(cookieName);
      const fetchSupabase = async () => {
        const client = await getSupabase(accessToken || '');
        setSupabase(client);
      };
  
      fetchSupabase();
    }, [walletAddress]);
  
    return supabase;
  }