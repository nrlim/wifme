import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/auth";

export default async function PrivacyPage() {
  const session = await getSession();

  return (
    <>
      <Navbar user={session} />
      <div style={{ paddingTop: "6rem", paddingBottom: "4rem", background: "white", minHeight: "100vh", width: "100%" }}>
        <div style={{ padding: "0 5%", maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 2.75rem)", fontWeight: 900, color: "var(--charcoal)", marginBottom: "1rem", letterSpacing: "-0.02em" }}>
            Kebijakan Privasi
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", marginBottom: "2.5rem" }}>
            Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", color: "var(--text-body)", lineHeight: 1.8, fontSize: "1rem" }}>
            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "1rem" }}>1. Pendahuluan</h2>
              <p>Selamat datang di Wif-Me. Kami menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat Anda menggunakan platform kami.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "1rem" }}>2. Data yang Kami Kumpulkan</h2>
              <p>Kami dapat mengumpulkan data pribadi berikut:</p>
              <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li><strong>Informasi Profil:</strong> Nama, alamat email, nomor telepon, dan foto profil.</li>
                <li><strong>Informasi Transaksi:</strong> Riwayat pemesanan, metode pembayaran (namun kami tidak menyimpan rincian kartu kredit secara penuh).</li>
                <li><strong>Informasi Muthawif (Khusus Mitra):</strong> Dokumen verifikasi, sertifikat, dan riwayat pengalaman.</li>
                <li><strong>Data Penggunaan:</strong> Interaksi Anda dengan aplikasi, log aktivitas, dan data perangkat keras/lunak.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "1rem" }}>3. Penggunaan Data</h2>
              <p>Data yang kami kumpulkan digunakan untuk tujuan berikut:</p>
              <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li>Memfasilitasi layanan pemesanan dan pendampingan Umrah.</li>
                <li>Meningkatkan kualitas dan pengalaman pengguna di platform Wif-Me.</li>
                <li>Komunikasi terkait transaksi, pembaruan layanan, dan dukungan pelanggan.</li>
                <li>Mencegah penipuan dan menjaga keamanan akun Anda.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "1rem" }}>4. Pembagian Data</h2>
              <p>Kami tidak akan menjual atau menyewakan data pribadi Anda. Namun, kami dapat membagikan data kepada:</p>
              <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li><strong>Mitra Layanan:</strong> Informasi dasar jamaah dibagikan kepada muthawif terkait (dan sebaliknya) untuk pelaksanaan layanan.</li>
                <li><strong>Penyedia Layanan Pihak Ketiga:</strong> Untuk keperluan analitik, server, atau pemrosesan pembayaran.</li>
                <li><strong>Otoritas Hukum:</strong> Jika diwajibkan oleh undang-undang atau untuk melindungi hak hukum platform.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "1rem" }}>5. Hak Anda</h2>
              <p>Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda dari sistem kami. Jika Anda ingin melakukan salah satu tindakan tersebut, hubungi dukungan pelanggan kami melalui <strong>halo@wifme.id</strong>.</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
