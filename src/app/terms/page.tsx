import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/auth";

export default async function TermsPage() {
  const session = await getSession();

  return (
    <>
      <Navbar user={session} />
      <div style={{ paddingTop: "6rem", paddingBottom: "4rem", background: "white", minHeight: "100vh", width: "100%" }}>
        <div style={{ padding: "0 5%", maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 2.75rem)", fontWeight: 900, color: "var(--charcoal)", marginBottom: "1rem", letterSpacing: "-0.02em" }}>
            Syarat & Ketentuan
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", marginBottom: "2.5rem" }}>
            Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", color: "var(--text-body)", lineHeight: 1.8, fontSize: "1rem" }}>
            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "1rem" }}>1. Pendahuluan</h2>
              <p>Syarat dan Ketentuan ini ("Perjanjian") mengatur penggunaan Anda atas platform Wif-Me. Dengan mengakses atau menggunakan aplikasi, Anda setuju untuk terikat oleh Perjanjian ini. Jika Anda tidak setuju, harap hentikan penggunaan layanan kami.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "1rem" }}>2. Akun dan Registrasi</h2>
              <p>Untuk menggunakan layanan kami, Anda harus mendaftar akun sebagai <strong>Jamaah</strong> atau <strong>Muthawif</strong>. Anda bertanggung jawab menjaga kerahasiaan kredensial login Anda. Informasi yang diberikan saat registrasi harus akurat dan selalu diperbarui.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "1rem" }}>3. Pemesanan dan Layanan</h2>
              <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li>Platform Wif-Me adalah perantara yang menghubungkan Jamaah dengan Muthawif. Kami memfasilitasi transaksi dan komunikasi, namun pelaksanaan layanan langsung ditangani oleh Muthawif terkait.</li>
                <li>Jadwal, durasi, dan jenis layanan (seperti pendampingan umrah, family trip, dll) harus disepakati sebelum transaksi dilakukan.</li>
                <li>Platform tidak bertanggung jawab secara langsung atas kegagalan teknis pelaksanaan di lapangan (force majeure).</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "1rem" }}>4. Pembayaran dan Sistem Escrow</h2>
              <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li>Semua pembayaran dilakukan melalui sistem platform dengan metode pembayaran yang didukung.</li>
                <li>Pembayaran dari Jamaah akan ditahan di <strong>dompet escrow</strong> sementara, hingga status pesanan dinyatakan selesai oleh kedua belah pihak.</li>
                <li>Pencairan dana ke Muthawif (dikurangi biaya layanan/fee) dilakukan setelah pesanan selesai.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "1rem" }}>5. Pembatalan dan Pengembalian Dana</h2>
              <p>Kebijakan pembatalan bergantung pada rentang waktu sebelum pelaksanaan layanan. Jamaah dapat membatalkan pesanan dengan ketentuan pengembalian dana penuh atau sebagian sesuai kebijakan yang berlaku. Muthawif yang membatalkan pesanan tanpa alasan sah akan dikenakan penalti reputasi.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "1rem" }}>6. Larangan</h2>
              <p>Anda tidak diperkenankan menggunakan platform untuk tujuan penipuan, menyebarkan spam, bertransaksi di luar sistem (bypass pembayaran), atau menyebarkan konten yang melanggar hukum dan norma yang berlaku.</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
