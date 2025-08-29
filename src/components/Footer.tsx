import Link from "next/link";
import { env } from "@/env";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container-max text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-2 opacity-80">
        <span>
          © {new Date().getFullYear()} {env.APP_NAME}. Todos los derechos
          reservados.
        </span>
        <span>
          Desarrollado por <strong>{env.DEVELOPER_NAME}</strong> ·{" "}
          <Link
            href={env.COMPANY_URL}
            className="underline hover:opacity-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            {env.COMPANY_NAME}
          </Link>
        </span>
      </div>
    </footer>
  );
}
