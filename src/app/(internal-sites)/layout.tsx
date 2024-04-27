import Navbar from "~/components/navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
      <Navbar />
    </div>
  );
}
