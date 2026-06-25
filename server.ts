import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize GoogleGenAI with Gemini API Key
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.use(express.json());

  // API route for AI Triage monitoring
  app.post("/api/ai-triage", async (req: any, res: any) => {
    try {
      const { weight, systolic, diastolic, fetalMovement, symptoms, notes, weeks, patientName, comorbidities } = req.body;
      
      const sysNum = Number(systolic) || 120;
      const diaNum = Number(diastolic) || 80;
      const fetalNum = Number(fetalMovement) || 12;
      const symList = Array.isArray(symptoms) ? symptoms : [];
      const comorbidList = Array.isArray(comorbidities) ? comorbidities : [];
      const weeksNum = Number(weeks) || 24;
      const momName = patientName || "Ibu Hamil";

      // Classify status locally for bulletproof fallback or validation
      const redSymptoms = ["Pusing Hebat", "Pandangan Kabur/Sensitif Cahaya", "Kaki/Tangan Bengkak", "Kram Perut Hebat", "Keluar Cairan dari Jalan Lahir", "Bayi Tidak Bergerak"];
      const hasRedSymptom = symList.some((s: string) => redSymptoms.includes(s));
      const isHighBP = sysNum >= 140 || diaNum >= 90;
      const isLowFetal = fetalNum < 10;

      let localCategory: "Aman" | "Sensitif" | "Bahaya" = "Aman";
      if (hasRedSymptom || isHighBP || isLowFetal) {
        localCategory = "Bahaya";
      } else {
        const yellowSymptoms = ["Mual Muntah Berat (Morning Sickness)", "Demam", "Pusing Ringan", "Pegal", "Kebas Ringan"];
        const hasYellowSymptom = symList.some((s: string) => yellowSymptoms.includes(s));
        const isMarginalBP = (sysNum >= 130 && sysNum < 140) || (diaNum >= 85 && diaNum < 90);
        
        if (hasYellowSymptom || isMarginalBP || comorbidList.length > 0) {
          localCategory = "Sensitif";
        }
      }

      try {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY environment variable is not defined");
        }

        const prompt = `Lakukan penapisan medis maternal otomatis (AI Triage) untuk data pemeriksaan ibu hamil berikut:
Nama Ibu: ${momName}
Usia Kandungan: ${weeksNum} Minggu
Berat Badan: ${weight} kg
Tekanan Darah: ${sysNum}/${diaNum} mmHg
Gerakan Janin: ${fetalNum} kali dlm 12 jam
Keluhan dirasakan: ${symList.length > 0 ? symList.join(', ') : 'Tidak ada'}
Catatan Tambahan: ${notes || 'Tidak ada'}
Riwayat Komorbiditas: ${comorbidList.length > 0 ? comorbidList.join(', ') : 'Tidak ada'}

Berikan respons dalam format JSON yang valid dengan skema berikut:
{
  "kategoriRisk": "Aman" | "Sensitif" | "Bahaya",
  "analisis": "Uraikan analisis singkat & jelas mengenai kondisi ibu hamil tersebut dalam bahasa Indonesia.",
  "rekomendasi": "Daftar rekomendasi tindakan medis darurat, panduan perawatan mandiri, atau langkah P3K kebidanan esensial yang sangat taktis dan menenangkan dalam bahasa Indonesia."
}

Kriteria Kelas Triage:
- "Bahaya" (Triage Merah): jika tekanan darah tinggi (>= 140/90) ATAU ada gejala bahaya seperti pusing kepala belakang hebat, pandangan kabur, kaki bengkak parah, pendarahan, kram hebat, janin bergerak < 10 kali.
- "Sensitif" (Triage Kuning): jika tekanan darah waspada (130-139 / 85-89) ATAU ada keluhan sedang seperti mual muntah berat, demam, pegal berlebih, kebas berat, atau memiliki komorbiditas.
- "Aman" (Triage Hijau): jika pemeriksaan dalam kondisi prima bugar tanpa penyulit atau keluhan di atas.

Balas HANYA dengan dokumen JSON bersih tanpa melampirkan teks penjelasan pembuka/penutup atau blok markdown \`\`\`json.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            temperature: 0.1,
            responseMimeType: "application/json",
          }
        });

        const rawText = response.text || "{}";
        const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const resultJson = JSON.parse(cleanedText);

        const category = resultJson.kategoriRisk || resultJson.kategori_risiko || localCategory;
        const analysis = resultJson.analisis || resultJson.penjelasan || "Kondisi kehamilan terpantau dari parameter yang diinput.";
        const recommendations = resultJson.rekomendasi || resultJson.tindakan || "Lakukan pemantauan mandiri secara berkala.";

        return res.json({
          success: true,
          kategoriRisk: category,
          analisis: analysis,
          rekomendasi: recommendations
        });

      } catch (geminiError: any) {
        console.warn("Falling back to local triage logic due to Gemini API Error:", geminiError);
        
        let localAnalysis = `Berdasarkan rekam parameter mandiri Anda (BB ${weight}kg, TD ${sysNum}/${diaNum}mmHg, Gerak Janin ${fetalNum}x, Gejala: ${symList.length > 0 ? symList.join(', ') : 'tidak ada'}), `;
        let localRecs = "";

        if (localCategory === "Bahaya") {
          localAnalysis += `terdapat indikasi risiko tanda bahaya kehamilan (Kategori Merah/KRT). Harap segera hentikan aktivitas dan minta bantuan medis darurat.`;
          localRecs = `1. **Segera Berbaring Miring Kiri**: Guna melancarkan sirkulasi utero-plasenta janin.\n2. **Persiapkan Rujukan Segera**: Hubungi bidan wilayah Anda di Puskesmas Mekar Sari atau segera kunjungi rumah sakit terdekat.\n3. **Jangan Tunda Pengobatan**: Keluhan atau tensi tinggi memerlukan penanganan medis langsung.`;
        } else if (localCategory === "Sensitif") {
          localAnalysis += `kehamilan terpantau dalam kondisi relatif terkontrol namun memiliki keluhan sensitif atau riwayat komorbiditas (Kategori Kuning/KST).`;
          localRecs = `1. **Tingkatkan Hidrasi & Batasi Asupan Garam**: Minum minimal 2.5 liter air hangat per hari.\n2. **Kurangi Aktivitas Berat**: Luangkan waktu ekstra untuk istirahat baring miring ke kiri.\n3. **Jadwalkan Konsultasi Berkala**: Diskusikan keluhan ini pada faskes saat kunjungan berikutnya.`;
        } else {
          localAnalysis += `seluruh parameter fisik kehamilan Ibu terpantau normal dan bugar (Kategori Hijau/KRR). Tetap pertahankan gaya hidup sehat.`;
          localRecs = `1. **Pertahankan Nutrisi Seimbang**: Konsumsi tablet tambah darah (Fe) dan makanan kaya besi/kalsium.\n2. **Teruskan Hitung Gerakan Janin**: Target minimal 10 kali dalam 12 jam.\n3. **Kunjungan ANC Rutin**: Tetap ikuti agenda pemeriksaan antenatal terjadwal.`;
        }

        return res.json({
          success: true,
          kategoriRisk: localCategory,
          analisis: localAnalysis,
          rekomendasi: localRecs
        });
      }
    } catch (err: any) {
      console.error("AI Triage Route Error:", err);
      res.status(500).json({ error: err.message || "Failed to execute AI Triage" });
    }
  });

  // API route for Gemini clinical triage chatbot
  app.post("/api/chat-gemini", async (req: any, res: any) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const msgLower = message.toLowerCase();
      const hasSelfRescue = msgLower.includes("sendiri") || 
                           msgLower.includes("tunggal") || 
                           msgLower.includes("pingsan") || 
                           msgLower.includes("tidak ada orang") || 
                           msgLower.includes("seorang diri") ||
                           msgLower.includes("mandiri");
      const hasCrowd = msgLower.includes("umum") || 
                       msgLower.includes("ramai") || 
                       msgLower.includes("keramaian") || 
                       msgLower.includes("kerumunan") || 
                       msgLower.includes("bystander") || 
                       msgLower.includes("pasar") || 
                       msgLower.includes("jalan") || 
                       msgLower.includes("stasiun") || 
                       msgLower.includes("terminal") ||
                       msgLower.includes("panik") || 
                       msgLower.includes("pasif") || 
                       msgLower.includes("banyak orang") || 
                       msgLower.includes("publik") || 
                       msgLower.includes("halte") ||
                       msgLower.includes("mall");
      const hasRural3T = msgLower.includes("terpencil") || 
                         msgLower.includes("3t") || 
                         msgLower.includes("pelosok") || 
                         msgLower.includes("pedalaman") || 
                         msgLower.includes("unreached") ||
                         msgLower.includes("desa jauh") || 
                         msgLower.includes("perbatasan") ||
                         msgLower.includes("pustu");

      const isDanger = msgLower.includes("pendarahan") || 
                       msgLower.includes("darah") || 
                       msgLower.includes("ketuban") || 
                       msgLower.includes("pusing") || 
                       msgLower.includes("kabur") || 
                       msgLower.includes("pandangan") || 
                       msgLower.includes("muntah hebat") ||
                       msgLower.includes("nyeri perut") || 
                       msgLower.includes("nyerut") || 
                       msgLower.includes("kram") ||
                       hasSelfRescue ||
                       hasCrowd ||
                       hasRural3T;

      // Serve response with real Gemini API, falling back to local clinical triage rules on any failure (e.g. 503, 429)
      try {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY environment variable is not defined");
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: message,
          config: {
            systemInstruction: `Anda adalah asisten medis virtual bidan desa bernama 'Bidan Siti Rahma'. Tugas utama Anda adalah bertindak sebagai filter medis (Triage) untuk menyaring keluhan ibu hamil.

Aturan Triage Tepat:
- Jika keluhan ibu hamil mengandung unsur tanda bahaya kehamilan (seperti: pendarahan, ketuban pecah, pusing hebat/sakit kepala parah, pandangan kabur/penglihatan ganda, atau nyeri perut luar biasa/kram perut hebat), ATAU mendeteksi situasi khusus (Sendirian, Tempat Umum/Keramaian, atau Daerah Terpencil/3T), Anda HARUS segera menampilkan instruksi darurat berlabel merah tebal di awal respons dengan format tulisan persis seperti ini:
**🚨 Gejala Bahaya Terdeteksi! Sambil menunggu Bidan Wilayah merespons, lakukan tindakan P3K berikut sekarang...**

Setelah label merah tebal tersebut, cantumkan 3-4 langkah pertolongan pertama (P3K) taktis, ringkas, dan jelas dalam bahasa Indonesia yang tenang tetapi tegas untuk menyelamatkan ibu dan janin.

PROTOKOL KHUSUS & WAJIB:
1. Protokol Mandiri (Self-Rescue Protocol): Jika masukan mendeteksi bahwa Ibu Hamil sedang sendirian tanpa pendamping (misal: sendirian di rumah, pingsan, sedang pendarahan sendirian), ubah gaya bahasa Anda menjadi panduan psikologis dan medis mandiri yang menuntun serta menenangkan. Berikan langkah P3K yang bisa dilakukan sendiri di lantai/kasur tanpa harus berdiri (seperti berbaring miring ke kiri, menarik napas dalam, melonggarkan baju, tidak memaksakan berdiri), serta instruksi minimal untuk memicu bantuan luar (seperti menekan tombol darurat, berteriak sekencang mungkin, mencoba membuka slot pintu terdekat agar bisa didobrak jika pingsan, mengirimkan lokasi GPS ke grup WhatsApp keluarga).

2. Protokol Kendali Massa: Jika masukan menunjukkan situasi terjadi di tempat umum atau keramaian di mana orang sekitar cenderung pasif atau panik (Bystander Effect), Anda wajib menghasilkan satu bagian khusus bernama 'Kendali Massa'. Berikan instruksi psikologis dan tindakan taktis yang singkat, tegas, dan jelas yang bisa diteriakkan oleh petugas atau orang di lapangan untuk menggerakkan massa (misalnya: "Bapak baju merah, tolong telepon ambulans sekarang!", "Ibu jilbab biru, tolong panggil petugas pos satpam!", "Semua orang tolong mundur 3 langkah agar ada ruang oksigen untuk Ibu ini!").

3. Rekomendasi Medis Faskes Terbatas (Daerah 3T): Jika masukan mendeteksi bahwa Ibu Hamil tersebut berisiko tinggi dan berada di daerah terpencil/3T, berikan satu bagian khusus berisi rekomendasi tindakan medis darurat jangka pendek yang realistis yang bisa segera dilakukan oleh bidan desa menggunakan fasilitas puskesmas yang sangat terbatas (seperti pemberian cairan infus RL/NaCl, pemantauan ketat DJJ/TTV manual, injeksi tokolitik jika diindikasikan, kompres hangat/dingin, oksigen tabung sederhana) sebelum pasien akhirnya bisa dievakuasi ke rumah sakit kota.

- Jika keluhan dirasa normal (keluhan trimester biasa yang tidak membahayakan), berikan jawaban edukasi yang hangat, menenangkan, penuh empati, ramah, dan solutif ala Bidan Siti Rahma.`,
            temperature: 0.2,
          },
        });

        return res.json({ text: response.text });
      } catch (geminiError: any) {
        console.warn("Falling back to local clinical triage due to Gemini API Error:", geminiError);
        
        if (isDanger) {
          let reply = `**🚨 Gejala Bahaya Terdeteksi! Sambil menunggu Bidan Wilayah merespons, lakukan tindakan P3K berikut sekarang...**\n\n`;
          
          if (hasSelfRescue) {
            reply += `### 🛌 Protokol Mandiri (Self-Rescue):\n`;
            reply += `Ibu, tetaplah tenang, tarik napas dalam-dalam. Karena Ibu sedang sendirian, **jangan mencoba berdiri**. Lakukan langkah mandiri berikut:\n`;
            reply += `1. **Baring Miring Kiri**: Segera berbaringlah miring ke kiri di atas lantai atau kasur tanpa memaksakan diri berdiri untuk melancarkan oksigen ke janin.\n`;
            reply += `2. **Picu Bantuan Luar**: Coba buka kunci/slot pintu terdekat yang bisa dijangkau sambil merangkak agar penolong bisa masuk. Kirim pesan suara darurat atau share lokasi GPS ke WhatsApp keluarga, atau berteriaklah minta tolong.\n`;
            reply += `3. **Longgarkan Pakaian**: Longgarkan ikat pinggang, kancing baju, atau pakaian yang ketat.\n\n`;
          } else {
            reply += `1. **Berbaring Miring Kiri**: Segera baringkan tubuh mengarah ke kiri untuk meningkatkan sirkulasi utero-plasenta dan melancarkan pasokan oksigen janin.\n`;
            reply += `2. **Tirah Baring Total (Bedrest)**: Hentikan segala jenis aktivitas fisik rumah tangga dan berbaringlah.\n`;
            reply += `3. **Amati Keluhan Sekitar**: Perhatikan volume cairan/darah yang keluar, atau segera ukur tensi jika memiliki sfigmomanometer mandiri di rumah.\n`;
            reply += `4. **Hubungi Keluarga & Puskesmas**: Segera ajak pasangan atau keluarga terdekat untuk mengantar Ibu ke Puskesmas Mekar Sari atau fasilitas rujukan terdekat.\n\n`;
          }

          if (hasCrowd) {
            reply += `### 📣 Kendali Massa:\n`;
            reply += `Karena Ibu berada di tempat umum atau keramaian di mana orang sekitar cenderung pasif atau panik, mintalah seseorang berteriak dengan instruksi tegas berikut:\n`;
            reply += `- *"Semua orang tolong mundur 3 langkah sekarang juga agar Ibu ini mendapat ruang oksigen!"*\n`;
            reply += `- Menunjuk orang secara spesifik: *"Bapak kaos merah di depan, tolong telepon Ambulans ke 112 sekarang!"*\n`;
            reply += `- *"Ibu baju kuning di samping, tolong panggil petugas keamanan atau satpam stasiun terdekat!"*\n\n`;
          }

          if (hasRural3T) {
            reply += `### 🩺 Rekomendasi Medis Faskes Terbatas (Daerah 3T):\n`;
            reply += `Rekomendasi tindakan medis darurat jangka pendek yang realistis bagi Bidan Desa menggunakan fasilitas puskesmas terbatas:\n`;
            reply += `1. **Stabilisasi Cairan**: Pasang jalur IV line infus NaCl 0.9% atau Ringer Laktat (RL) untuk mencegah syok.\n`;
            reply += `2. **Oksigenasi**: Berikan oksigen nasal kanul 2-4 L/menit jika tersedia.\n`;
            reply += `3. **Monitor TTV & DJJ**: Ukur tekanan darah ibu dan dengarkan Detak Jantung Janin secara manual sesering mungkin.\n`;
            reply += `4. **Persiapan Rujukan**: Segera persiapkan sarana evakuasi darurat menuju Rumah Sakit rujukan kota terdekat.\n`;
          }

          return res.json({ text: reply });
        } else {
          return res.json({
            text: `Halo Ibu, terima kasih sudah berkonsultasi mengenai keluhan Anda. Pada fase kehamilan masa ini, keluhan tersebut umumnya masih tergolong normal akibat adaptasi hormonal tubuh.\n\nCobalah kurangi beban aktivitas bising/melelahkan, cukupi hidrasi cairan (minum air hangat minimal 2-3 liter sehari), beristirahat baring miring kiri, serta tetap hitung gerakan janin secara mandiri (target minimal 10 kali per 12 jam). Tetap tenang, dan jika keluhan semakin memburuk atau timbul tanda bahaya lain, segera laporkan ke Bidan atau kunjungi Puskesmas terdekat ya Bu.`
          });
        }
      }
    } catch (error: any) {
      console.error("Endpoint execution error:", error);
      res.status(500).json({ error: error.message || "Failed to process chat query" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
