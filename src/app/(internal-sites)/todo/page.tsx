import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Todo",
  description: "Manage your tasks and to-do items.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Todo",
    description: "Manage your tasks and to-do items.",
  },
};

const Todo = () => {
  return (
    <main className="flex h-full flex-col items-center justify-center lg:pl-24">
      <p>Todo</p>
    </main>
  );
};

export default Todo;
