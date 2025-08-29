import Link from "next/link";
import { env } from "@/env";
import {
  Github,
  Linkedin,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t mt-12 bg-[color-mix(in_oklab,var(--fg-light)_2%,transparent)] dark:bg-[color-mix(in_oklab,var(--fg-dark)_4%,transparent)]">
      <div className="container-max py-8 grid gap-6 text-xs sm:text-sm">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          {/* Créditos */}
          <div className="text-center sm:text-left opacity-80">
            © {new Date().getFullYear()} {env.APP_NAME}. Todos los derechos
            reservados.
            <br />
            Desarrollado por {env.DEVELOPER_NAME} ·{" "}
            <Link
              href={env.COMPANY_URL}
              className="font-semibold underline hover:text-[var(--brand-primary)] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {env.COMPANY_NAME}
            </Link>
          </div>

          {/* Redes sociales */}
          <div className="flex gap-4 opacity-80 hover:opacity-100 transition-opacity">
            <Link href="https://t.me/" target="_blank" aria-label="Telegram">
              <Send size={18} />
            </Link>
            <Link href="https://wa.me/" target="_blank" aria-label="WhatsApp">
              <Phone size={18} />
            </Link>
            <Link href="https://x.com" target="_blank" aria-label="X (Twitter)">
              <Twitter size={18} />
            </Link>
            <Link
              href="https://facebook.com"
              target="_blank"
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </Link>
            <Link
              href="https://instagram.com"
              target="_blank"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </Link>
            <Link href="https://github.com" target="_blank" aria-label="GitHub">
              <Github size={18} />
            </Link>
            <Link
              href="https://linkedin.com"
              target="_blank"
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </Link>
            <Link href={env.COMPANY_URL} target="_blank" aria-label="Website">
              <Globe size={18} />
            </Link>
          </div>
        </div>

        {/* Bottom row: links legales */}
        <div className="flex flex-col sm:flex-row justify-center sm:justify-between gap-3 text-center">
          <Link
            href="/contact"
            className="hover:text-[var(--brand-primary)] transition-colors"
          >
            Contacto
          </Link>
          <Link
            href="/privacy"
            className="hover:text-[var(--brand-primary)] transition-colors"
          >
            Política de Privacidad
          </Link>
          <Link
            href="/terms"
            className="hover:text-[var(--brand-primary)] transition-colors"
          >
            Términos y Condiciones
          </Link>
        </div>
      </div>
    </footer>
  );
}
