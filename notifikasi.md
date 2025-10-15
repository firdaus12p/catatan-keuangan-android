cd C:\Users\muham\AppData\Local\Android\Sdk\emulator
emulator -avd Pixel_9

Tidak usah menjalankan npx expo start untuk memeriksa masalahnya, biarkan saya yang melakukannya, dan jika terdapat eror, saya akan beritahu erornya apa. Jangan mengubah apapun selain apa yang saya promptkan, dan selalu ikuti #file:aturan.md


Mari tambahkan local notification, notifikasi offline, atau notifikasi offline terjadwal. Notifikasi dikirim langsung oleh aplikasi di HP user. Bisa pakai react-native-push-notification. dan user bisa atur kapan notifikasi itu muncul. Sistem Android akan simpan jadwal itu di background, lalu munculkan notifikasi walau app ditutup atau offline. Sistem menyesuaikan waktu **berdasarkan zona waktu perangkat user**, misal: jika user di Makassar (GMT+8), maka notifikasi akan mengikuti waktu lokal tersebut.

### 2. Logika Utama

#### a. Penjadwalan Notifikasi
- User dapat memilih jam & menit (misal “20:30”) melalui `TimePicker` atau `DateTimePickerModal`.
- Simpan waktu tersebut di `AsyncStorage`.
- Gunakan `Notifications.scheduleNotificationAsync()` untuk menjadwalkan notifikasi lokal.
- Pastikan notifikasi tetap aktif walaupun app di-*close* (background mode).

#### b. Zona Waktu Lokal
- Gunakan `Localization.timezone` untuk mendeteksi zona waktu pengguna (misal `"Asia/Makassar"`).
- Saat user menyimpan jadwal notifikasi, **konversi waktu tersebut ke waktu lokal** sesuai zona waktu perangkat.
- Jika user berpindah zona waktu (misal dari Makassar ke Jakarta), app otomatis menyesuaikan waktu notifikasi berikutnya.

#### c. Contoh Teks Notifikasi
Gunakan pesan default seperti:
> “⏰ Saatnya beritahu kemenkeu pengeluaranmu hari ini”

Pastikan semua bekerja offline, menggunakan waktu lokal perangkat (contoh: Asia/Makassar), dan dapat dijalankan di Android.