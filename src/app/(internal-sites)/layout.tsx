import { EncryptionKeyBootstrap } from "~/components/encryption-key-bootstrap";
import Navbar from "~/components/navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <EncryptionKeyBootstrap />
      {children}
      <Navbar />
    </div>
  );
}
