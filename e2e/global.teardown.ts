import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Global teardown - czyszczenie bazy danych po testach E2E
 *
 * Loguje się jako użytkownik testowy i usuwa wszystkie jego dane
 * aby zapewnić izolację testów i uniknąć zanieczyszczenia danych.
 *
 * Wykorzystuje RLS policies - użytkownik może usuwać tylko własne dane.
 */
teardown("cleanup test user data from database", async () => {
  console.log("🧹 Starting database cleanup...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testUserEmail = process.env.E2E_USERNAME;
  const testUserPassword = process.env.E2E_PASSWORD;

  // Walidacja zmiennych środowiskowych
  if (!supabaseUrl || !supabaseKey || !testUserEmail || !testUserPassword) {
    console.warn("⚠️  Missing environment variables for cleanup. Skipping database cleanup.");
    console.warn("Required: SUPABASE_URL, SUPABASE_KEY, E2E_USERNAME, E2E_PASSWORD");
    return;
  }

  // Klient Supabase (zwykły klient, używa RLS)
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Krok 1: Zaloguj się jako użytkownik testowy
    console.log(`🔐 Logging in as test user: ${testUserEmail}`);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });

    if (authError) {
      console.error("❌ Login failed:", authError.message);
      return;
    }

    const userId = authData.user.id;
    console.log(`✅ Logged in successfully (user_id: ${userId})`);

    // Krok 2: Usuń training plans (wraz z workout_days przez CASCADE)
    console.log("🗑️  Deleting training plans...");
    const { error: plansError, count: plansCount } = await supabase
      .from("training_plans")
      .delete({ count: "exact" })
      .eq("user_id", userId);

    if (plansError) {
      console.error("❌ Error deleting training plans:", plansError.message);
    } else {
      console.log(`✅ Deleted ${plansCount ?? 0} training plan(s)`);
    }

    // Krok 3: Usuń personal records
    console.log("🗑️  Deleting personal records...");
    const { error: recordsError, count: recordsCount } = await supabase
      .from("personal_records")
      .delete({ count: "exact" })
      .eq("user_id", userId);

    if (recordsError) {
      console.error("❌ Error deleting personal records:", recordsError.message);
    } else {
      console.log(`✅ Deleted ${recordsCount ?? 0} personal record(s)`);
    }

    // Krok 4: Usuń profile
    console.log("🗑️  Deleting profile...");
    const { error: profileError, count: profileCount } = await supabase
      .from("profiles")
      .delete({ count: "exact" })
      .eq("user_id", userId);

    if (profileError) {
      console.error("❌ Error deleting profile:", profileError.message);
    } else {
      console.log(`✅ Deleted ${profileCount ?? 0} profile(s)`);
    }

    // Krok 5: Wyloguj się
    await supabase.auth.signOut();
    console.log("✨ Database cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
    // Nie rzucamy błędu - cleanup failure nie powinien powodować faila testów
  }
});
