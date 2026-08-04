import { Suspense, lazy } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import NavigationProgress from "@/components/NavigationProgress";

describe("client-side route navigation", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the current page visible and delays progress for a slow route chunk", async () => {
    vi.useFakeTimers();

    let resolveRoute: (module: { default: () => JSX.Element }) => void;
    const SlowRoute = lazy(
      () => new Promise<{ default: () => JSX.Element }>((resolve) => {
        resolveRoute = resolve;
      }),
    );

    render(
      <MemoryRouter
        initialEntries={["/"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <NavigationProgress />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<><h1>Current page</h1><Link to="/slow">Next</Link></>} />
            <Route path="/slow" element={<SlowRoute />} />
          </Routes>
        </Suspense>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Next" }));

    act(() => vi.advanceTimersByTime(179));
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Current page" })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("progressbar", { name: "Loading page" })).toBeInTheDocument();

    await act(async () => {
      resolveRoute({ default: () => <h1>Next page</h1> });
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "Next page" })).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
