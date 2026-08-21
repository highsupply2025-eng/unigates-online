import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoLogout } from "@/hooks/use-auto-logout";

const mocks = vi.hoisted(() => ({
  signOut: vi.fn().mockResolvedValue({}),
  unsubscribe: vi.fn(),
  getSession: vi.fn(),
}));

const authListenerRef = { current: null as ((event: string, session: unknown) => void) | null };

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      signOut: mocks.signOut,
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authListenerRef.current = cb;
        return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
      },
    },
  },
}));

const Probe = () => {
  useAutoLogout();
  return <div>Dashboard</div>;
};

const renderGuard = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<Probe />} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("useAutoLogout inactivity timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.signOut.mockClear();
    mocks.getSession.mockClear();
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the session alive through 59m59s of inactivity and logs out exactly at one hour", async () => {
    renderGuard();
    await act(async () => {}); // flush async session check

    act(() => vi.advanceTimersByTime(59 * 60 * 1000 + 59 * 1000));
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    await act(async () => {}); // flush signOut promise -> navigate
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("never logs out while real interactions keep resetting the timer", async () => {
    renderGuard();
    await act(async () => {});

    // Simulate activity every 10 minutes across 3 hours (well past the old 30-minute limit).
    const interact = () => {
      window.dispatchEvent(new Event("mousemove"));
      window.dispatchEvent(new Event("keydown"));
      window.dispatchEvent(new Event("scroll"));
    };

    for (let i = 0; i < 18; i++) {
      act(() => vi.advanceTimersByTime(10 * 60 * 1000));
      interact();
    }

    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();

    // One full silent hour after the last interaction finally logs out.
    act(() => vi.advanceTimersByTime(60 * 60 * 1000));
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    await act(async () => {}); // flush signOut promise -> navigate
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });
});
