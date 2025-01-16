import Navbar from "~/components/navbar";

export const dynamic = "force-static";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
      <Navbar />
    </div>
  );
}
