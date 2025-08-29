import Link from "next/link";
import { env } from "@/env";

export default function HomePage() {
  return (
    <section className="grid gap-6">
      <h1 className="text-3xl sm:text-4xl font-bold">{env.APP_NAME}</h1>
      <p className="text-base opacity-80">{env.SLOGAN}</p>
      <div>
        <Link href="/login" className="btn-primary">
          Ingresar
        </Link>
      </div>
    </section>
  );
}
