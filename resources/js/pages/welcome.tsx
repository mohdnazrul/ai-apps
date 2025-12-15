// resources/js/pages/welcome.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import axios from "axios";
import http from "@/lib/http";
import { type SharedData } from "@/types";

type Role = "user" | "bot" | "system";
type ChatMsg = { role: Role; text: string; name?: string };

type TryStatusResponse = {
  is_authenticated?: boolean;
  remaining?: number | null;
};

type TrySuccess = {
  answer?: string;
  remaining?: number | null;
  requires_login?: boolean;
};

type TryError = {
  message?: string;
  remaining?: number | null;
  requires_login?: boolean;
};

function RobotIcon(props: { className?: string }) {
  // simple inline svg robot icon (no dependency)
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={props.className}
    >
      <path
        d="M10 2h4v2h-4V2Z"
        className="fill-current opacity-80"
      />
      <path
        d="M7 7a5 5 0 0 1 10 0v1h1a3 3 0 0 1 3 3v5a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6v-5a3 3 0 0 1 3-3h1V7Z"
        className="fill-current"
      />
      <path
        d="M9 12a1.2 1.2 0 1 0 0 2.4A1.2 1.2 0 0 0 9 12Zm6 0a1.2 1.2 0 1 0 0 2.4A1.2 1.2 0 0 0 15 12Z"
        className="fill-white"
      />
      <path
        d="M9 16h6"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="opacity-90"
      />
    </svg>
  );
}

export default function Welcome() {
  const { auth } = usePage<SharedData>().props;
  const isAuth = !!auth?.user;

  // ✅ System identity (you can rename here)
  const SYSTEM_NAME = "ERP AI Expert";

  const logoUrl =
    "https://static.vecteezy.com/system/resources/previews/023/783/293/non_2x/artificial-intelligence-generated-icon-ai-sign-for-graphic-design-logo-website-social-media-mobile-app-ui-illustration-vector.jpg";

  const heroImageUrl =
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80";

  // Chat state
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // guest tries
  const [remaining, setRemaining] = useState<number | null>(isAuth ? null : 5);
  const noTriesLeft = !isAuth && remaining !== null && remaining <= 0;

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ✅ intro system message (only once)
  useEffect(() => {
    if (chat.length > 0) return;

    setChat([
      {
        role: "system",
        name: SYSTEM_NAME,
        text:
          `Hello! I’m ${SYSTEM_NAME} (demo dataset mode).\n\n` +
          `Try:\n` +
          `• Show unpaid invoices > RM 10k\n` +
          `• Who has overdue payments?\n` +
          `• List low stock items below reorder point\n` +
          `• Show production delays\n` +
          `• Show approval workflow`,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, error]);

  // Load remaining tries for guest
  useEffect(() => {
    if (isAuth) return;

    http
      .get<TryStatusResponse>("/ai/try-status")
      .then(({ data }) => {
        if (typeof data?.remaining === "number") setRemaining(data.remaining);
      })
      .catch(() => {});
  }, [isAuth]);

  const onSend = async () => {
    setError("");

    const value = message.trim();
    if (!value) {
      setError("Please type a message.");
      return;
    }

    if (noTriesLeft) {
      setError("Please log in to continue using AI.");
      return;
    }

    // show user message immediately
    setChat((prev) => [...prev, { role: "user", name: auth?.user?.name ?? "You", text: value }]);
    setMessage("");
    setLoading(true);

    try {
      const { data } = await http.post<TrySuccess>("/ai/try", { message: value });

      if (typeof data?.remaining === "number") setRemaining(data.remaining);

      const ans = (data?.answer || "").trim();
      if (!ans) {
        setError("Sorry, your request is out of range. Please contact the administrator.");
        return;
      }

      // append bot answer
      setChat((prev) => [...prev, { role: "bot", name: SYSTEM_NAME, text: ans }]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as TryError | undefined;

        if (typeof data?.remaining === "number") setRemaining(data.remaining);
        if (data?.requires_login) setRemaining(0);

        // 422: out of range / dataset missing -> show error only (no bot msg)
        if (status === 422) {
          setError(
            data?.message ||
              "Sorry, your request is out of range. Please contact the administrator."
          );
          return;
        }

        // 401: login required
        if (status === 401) {
          setError(data?.message || "Please log in to continue using AI.");
          return;
        }

        setError(data?.message || "Request failed.");
        return;
      }

      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cards
  const fallbackImg =
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80";

  const cards = useMemo(
    () => [
      {
        title: "ERP Chat",
        desc: "Search records + explain fields in seconds.",
        img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
        tag: "Copilot",
      },
      {
        title: "Document AI",
        desc: "Extract invoice/PO data + auto matching.",
        img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
        tag: "Finance",
      },
      {
        title: "Forecasting",
        desc: "Inventory + production planning alerts.",
        img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
        tag: "Operations",
      },
      {
        title: "Workflow AI",
        desc: "Approve/reject suggestions + automation flow.",
        img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
        tag: "Automation",
      },
    ],
    []
  );

  const renderAvatar = (role: Role) => {
    if (role === "user") {
      return (
        <div className="h-8 w-8 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
          {auth?.user?.name ? auth.user.name.slice(0, 1).toUpperCase() : "U"}
        </div>
      );
    }

    if (role === "system") {
      return (
        <div className="h-8 w-8 shrink-0 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm">
          ⭐
        </div>
      );
    }

    // bot
    return (
      <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center">
        <RobotIcon className="h-5 w-5 text-white" />
      </div>
    );
  };

  const bubbleClass = (role: Role) => {
    // ✅ different colors for each role + dark mode
    if (role === "user") {
      return "bg-blue-600 text-white border-blue-600/30 dark:bg-blue-500 dark:border-blue-400/30";
    }
    if (role === "system") {
      return "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-700/40";
    }
    // bot
    return "bg-gray-100 text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700";
  };

  const rowAlign = (role: Role) => {
    if (role === "user") return "justify-end";
    return "justify-start";
  };

  return (
    <>
      <Head title="Welcome">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link
          href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
          rel="stylesheet"
        />
      </Head>

      <div className="flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a]">
        {/* Top Nav */}
        <header className="mx-auto w-full max-w-6xl p-6 lg:p-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt="ERP AI"
                className="h-9 w-9 rounded-xl border border-[#19140035] bg-white object-cover shadow-sm dark:border-[#3E3E3A] dark:bg-[#161615]"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />

              <div className="leading-tight">
                <div className="text-sm font-semibold">ERP AI</div>
                <div className="text-xs text-[#706f6c] dark:text-[#A1A09A]">
                  Copilot for your operations
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAuth ? (
                <Link
                  href={route("dashboard")}
                  className="inline-flex items-center justify-center rounded-md border border-[#19140035] bg-white px-4 py-2 text-sm font-medium hover:border-[#1915014a]
                  dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href={route("login")}
                    className="inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium hover:border-[#19140035]
                    dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                  >
                    Log in
                  </Link>
                  <Link
                    href={route("register")}
                    className="inline-flex items-center justify-center rounded-md border border-[#19140035] bg-white px-4 py-2 text-sm font-medium hover:border-[#1915014a]
                    dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>

        {/* Main */}
        <main className="mx-auto flex w-full max-w-6xl grow items-center px-6 pb-10 lg:px-8">
          <div className="grid w-full grid-cols-1 overflow-hidden rounded-2xl border border-[#19140035] bg-white shadow-sm dark:border-[#3E3E3A] dark:bg-[#161615] lg:grid-cols-2">
            {/* Left */}
            <div className="p-6 lg:p-12">
              <h1 className="text-2xl font-semibold tracking-tight lg:text-4xl dark:text-[#EDEDEC]">
                Ask. Automate. Analyze.
                <span className="block text-[#706f6c] dark:text-[#A1A09A]">
                  One assistant across sales, inventory, finance & production.
                </span>
              </h1>

              {/* ✅ Chat */}
              <div className="mt-6 rounded-xl border border-[#19140035] bg-[#FDFDFC] p-4 dark:border-[#3E3E3A] dark:bg-[#0f0f0f]">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium dark:text-white">
                    Test chat (dataset)
                  </div>

                  {!isAuth && remaining !== null && (
                    <div className="text-[11px] text-[#706f6c] dark:text-[#A1A09A]">
                      {remaining} free tries left
                    </div>
                  )}
                </div>

                {/* chat history */}
                <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-[#19140035] bg-white p-3 dark:border-[#3E3E3A] dark:bg-[#161615]">
                  <div className="space-y-3">
                    {chat.map((m, idx) => (
                      <div key={idx} className={`flex ${rowAlign(m.role)} gap-2`}>
                        {/* avatar left for bot/system, right for user */}
                        {m.role !== "user" && renderAvatar(m.role)}

                        <div className={`max-w-[85%] ${m.role === "user" ? "text-right" : "text-left"}`}>
                          {/* name */}
                          <div className="mb-1 text-[10px] text-gray-500 dark:text-gray-400">
                            {m.role === "user" ? (m.name ?? "You") : (m.name ?? SYSTEM_NAME)}
                          </div>

                          <div
                            className={[
                              "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap border shadow-sm",
                              bubbleClass(m.role),
                            ].join(" ")}
                          >
                            {m.text}
                          </div>
                        </div>

                        {m.role === "user" && renderAvatar(m.role)}
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                </div>

                {/* input */}
                <div className="mt-3 flex gap-2">
                  <input
                    className="h-10 w-full rounded-lg border border-[#19140035] bg-white px-3 text-sm outline-none focus:border-[#1915014a]
                    dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC]"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder='Type your message... (e.g. "Show unpaid invoices > RM 10k")'
                    disabled={loading || noTriesLeft}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSend();
                    }}
                  />

                  {noTriesLeft ? (
                    <Link
                      href={route("login")}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-[#19140035] bg-white px-4 text-sm font-medium hover:border-[#1915014a]
                      dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC]"
                    >
                      Log in
                    </Link>
                  ) : (
                    <button
                      onClick={onSend}
                      disabled={loading}
                      className="h-10 shrink-0 rounded-lg border border-[#19140035] bg-white px-4 text-sm font-medium hover:border-[#1915014a]
                      dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC]"
                    >
                      {loading ? "Thinking..." : "Send"}
                    </button>
                  )}
                </div>

                {/* error only (no bot message) */}
                {error && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="relative min-h-[320px] bg-[#fff2f2] dark:bg-[#1D0002] lg:min-h-full">
              <img
                src={heroImageUrl}
                alt="ERP AI preview"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            </div>
          </div>
        </main>

        {/* AI Modules */}
        <section id="ai-modules" className="mx-auto w-full max-w-6xl px-6 pb-12 lg:px-8">
          <div className="rounded-2xl border border-[#19140035] bg-white p-6 dark:border-[#3E3E3A] dark:bg-[#161615]">
            <div className="text-base font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
              AI modules you can add next
            </div>
            <div className="mt-1 text-sm text-[#706f6c] dark:text-[#A1A09A]">
              Plug-and-play ideas to make your ERP smarter.
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <div
                  key={card.title}
                  className="group overflow-hidden rounded-2xl border border-[#19140035] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md
                  dark:border-[#3E3E3A] dark:bg-[#161615]"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-gray-100 dark:bg-black/20">
                    <img
                      src={card.img}
                      alt={card.title}
                      className="block h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = fallbackImg;
                      }}
                    />
                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-[#1b1b18] backdrop-blur dark:bg-black/40 dark:text-white">
                      {card.tag}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-sm font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
                      {card.title}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-[#706f6c] dark:text-[#A1A09A]">
                      {card.desc}
                    </div>

                    <button
                      type="button"
                      className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-[#19140035] bg-white px-3 py-2 text-xs font-semibold hover:border-[#1915014a]
                      dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                    >
                      Enable
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
